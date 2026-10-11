use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::sync::Arc;
use std::time::Instant;

use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use super::discovery::{self, mac_matches, normalize_mac, DiscoveryEvent, Plan, Via};
use super::worker::{self, Job, WorkerOp, WorkerOutput};
use super::{Frontend, ManagerMsg, ManagerOptions, Reply, Target};
use crate::config::{BulbEntry, ConfigStore, LoadOutcome};
use crate::error::AppError;
use crate::models::{
    AddBulbOutcome, BulbState, CustomColor, MultiBulbState, ToastKind, ToastMessage,
    MAX_DEFAULT_COLORS,
};
use crate::wiz::discovery::{discover_unicast, Discovered};
use crate::wiz::{BulbClient, Pilot, PilotPatch, SystemConfig, WizError};

struct Bulb {
    mac: Option<String>,
    ip: String,
    name: String,
    online: bool,
    pilot: Pilot,
    sys: SystemConfig,
}

/// What to do with the result of a worker job.
enum Pending {
    Toggle,
    Brightness(u32),
    Scene(u32),
    Color { id: u32, rgb: (u8, u8, u8) },
    Refresh,
}

struct PendingJob {
    kind: Pending,
    reply: Option<Reply<()>>,
}

struct Running {
    generation: u64,
    cancel: CancellationToken,
}

pub struct Actor {
    frontend: Arc<dyn Frontend>,
    store: ConfigStore,
    opts: ManagerOptions,
    tx: UnboundedSender<ManagerMsg>,
    rx: UnboundedReceiver<ManagerMsg>,
    initial: LoadOutcome,

    bulbs: Vec<Bulb>,
    workers: HashMap<String, UnboundedSender<Job>>,
    pending: HashMap<u64, PendingJob>,
    next_ticket: u64,

    generation: u64,
    discovery: Option<Running>,
    is_discovering: bool,
    discovery_failed: bool,
    last_refresh: Option<Instant>,
}

impl Actor {
    pub(super) fn new(
        frontend: Arc<dyn Frontend>,
        store: ConfigStore,
        initial: LoadOutcome,
        opts: ManagerOptions,
        tx: UnboundedSender<ManagerMsg>,
        rx: UnboundedReceiver<ManagerMsg>,
    ) -> Self {
        let bulbs = store
            .config()
            .bulbs
            .iter()
            .map(|e| Bulb {
                mac: e.mac.clone(),
                ip: e.ip.clone(),
                name: e.name.clone(),
                online: false,
                pilot: Pilot::default(),
                sys: SystemConfig::default(),
            })
            .collect();
        Self {
            frontend,
            store,
            opts,
            tx,
            rx,
            initial,
            bulbs,
            workers: HashMap::new(),
            pending: HashMap::new(),
            next_ticket: 0,
            generation: 0,
            discovery: None,
            is_discovering: false,
            discovery_failed: false,
            last_refresh: None,
        }
    }

    pub async fn run(mut self) {
        self.announce_load_outcome();
        self.ensure_active();
        self.start_discovery();
        while let Some(msg) = self.rx.recv().await {
            self.handle(msg);
        }
    }

    // ---- dispatch ---------------------------------------------------------------

    fn handle(&mut self, msg: ManagerMsg) {
        match msg {
            ManagerMsg::GetBulbs(reply) => {
                let _ = reply.send(self.snapshot());
            }
            ManagerMsg::Toggle(target, reply) => match self.resolve(&target) {
                Ok(ip) => self.dispatch(&ip, WorkerOp::Toggle, Pending::Toggle, Some(reply)),
                Err(e) => {
                    let _ = reply.send(Err(e));
                }
            },
            ManagerMsg::SetBrightness(value, reply) => {
                self.patch_active(PilotPatch::dimming(value), Pending::Brightness(value), reply);
            }
            ManagerMsg::SetScene(id, reply) => {
                self.patch_active(PilotPatch::scene(id), Pending::Scene(id), reply);
            }
            ManagerMsg::SetCustomColor(id, reply) => self.set_custom_color(id, reply),
            ManagerMsg::SetBulbName { name, ip, reply } => {
                let _ = reply.send(self.set_name(name, ip));
            }
            ManagerMsg::SetActive(ip, reply) => {
                let _ = reply.send(self.set_active(&ip));
            }
            ManagerMsg::Delete(ip, reply) => {
                let _ = reply.send(self.delete_bulb(&ip));
            }
            ManagerMsg::Probe(ip, reply) => match self.find(&ip) {
                Some(_) => self.refresh_one(&ip, Some(reply)),
                None => {
                    let _ = reply.send(Err(AppError::UnknownBulb { ip }));
                }
            },
            ManagerMsg::AddByIp(ip, reply) => self.add_by_ip(ip, reply),
            ManagerMsg::AddColor { name, hex, reply } => {
                let _ = reply.send(self.add_color(name, &hex));
            }
            ManagerMsg::EditColor { id, name, hex, reply } => {
                let _ = reply.send(self.edit_color(id, name, &hex));
            }
            ManagerMsg::RemoveColor(id, reply) => {
                let _ = reply.send(self.remove_color(id));
            }
            ManagerMsg::ToggleFavorite(id, reply) => {
                let _ = reply.send(self.toggle_favorite(id));
            }
            ManagerMsg::SetFavoriteOrder(order, reply) => {
                let _ = reply.send(self.set_favorite_order(order));
            }
            ManagerMsg::RetryDiscovery(reply) => {
                for b in &mut self.bulbs {
                    b.online = false;
                }
                self.start_discovery();
                let _ = reply.send(Ok(()));
            }
            ManagerMsg::DeleteProfile(reply) => {
                let _ = reply.send(self.delete_profile());
            }
            ManagerMsg::RefreshAll => self.refresh_all(),
            ManagerMsg::WorkerDone { ip, ticket, outcome } => {
                self.worker_done(&ip, ticket, outcome)
            }
            ManagerMsg::Discovery { generation, event } => {
                // Results of a cancelled or superseded run never touch the state.
                if self.discovery.as_ref().is_some_and(|d| d.generation == generation) {
                    self.on_discovery(event);
                }
            }
            ManagerMsg::AddResult { ip, outcome, reply } => self.add_result(&ip, outcome, reply),
        }
    }

    // ---- output -----------------------------------------------------------------

    fn toast(&self, message: &str, kind: ToastKind, auto_dismiss: bool, retry: Option<&str>) {
        self.frontend.toast(ToastMessage {
            id: Uuid::new_v4().to_string(),
            message: message.to_owned(),
            kind,
            auto_dismiss,
            retry_action: retry.map(str::to_owned),
        });
    }

    fn bulb_state(&self, b: &Bulb) -> BulbState {
        let p = &b.pilot;
        let s = &b.sys;
        let cfg = self.store.config();
        BulbState {
            mac: b.mac.clone().or_else(|| p.mac.clone()).unwrap_or_default(),
            rssi: p.rssi.unwrap_or(0),
            src: p.src.clone(),
            state: p.state.unwrap_or(false),
            scene_id: p.scene_id.unwrap_or(0),
            temp: p.temp,
            speed: p.speed,
            r: p.r,
            g: p.g,
            b: p.b,
            c: p.c,
            w: p.w,
            dimming: p.dimming,
            home_id: s.home_id.unwrap_or(0),
            room_id: s.room_id.unwrap_or(0),
            rgn: s.rgn.clone().unwrap_or_default(),
            module_name: s.module_name.clone().unwrap_or_default(),
            fw_version: s.fw_version.clone().unwrap_or_default(),
            group_id: s.group_id.unwrap_or(0),
            ping: 0,
            ip: b.ip.clone(),
            port: self.opts.net.port,
            name: b.name.clone(),
            online: b.online,
            custom_colors: cfg.custom_colors.clone(),
            favorite_colors: cfg.favorite_colors.clone(),
        }
    }

    fn snapshot(&self) -> MultiBulbState {
        let active = self.store.config().active_bulb_ip.as_deref();
        MultiBulbState {
            bulbs: self.bulbs.iter().map(|b| self.bulb_state(b)).collect(),
            active_bulb: active
                .and_then(|ip| self.bulbs.iter().find(|b| b.ip == ip))
                .map(|b| self.bulb_state(b)),
            is_discovering: self.is_discovering,
            discovery_failed: self.discovery_failed,
        }
    }

    fn emit(&self) {
        self.frontend.state(&self.snapshot());
    }

    fn announce_load_outcome(&self) {
        match &self.initial {
            LoadOutcome::Imported { .. } => {
                self.toast("toast.configImported", ToastKind::Info, true, None);
            }
            LoadOutcome::Reset { .. } => {
                self.toast("toast.configReset", ToastKind::Error, false, None);
            }
            LoadOutcome::Loaded | LoadOutcome::Created => {}
        }
    }

    // ---- state helpers ----------------------------------------------------------

    fn find(&self, ip: &str) -> Option<usize> {
        self.bulbs.iter().position(|b| b.ip == ip)
    }

    fn resolve(&self, target: &Target) -> Result<String, AppError> {
        match target {
            Target::Ip(ip) => self
                .find(ip)
                .map(|_| ip.clone())
                .ok_or_else(|| AppError::UnknownBulb { ip: ip.clone() }),
            Target::Active => self
                .store
                .config()
                .active_bulb_ip
                .clone()
                .filter(|ip| self.find(ip).is_some())
                .ok_or_else(|| AppError::UnknownBulb { ip: String::new() }),
        }
    }

    /// Writes bulbs + colors to disk. The config is only touched by explicit actions.
    fn persist(&mut self) -> Result<(), AppError> {
        let entries = self
            .bulbs
            .iter()
            .map(|b| BulbEntry { mac: b.mac.clone(), ip: b.ip.clone(), name: b.name.clone() })
            .collect();
        self.store.config_mut().bulbs = entries;
        self.store.save().map_err(|e| AppError::Io { message: e.to_string() })
    }

    fn persist_logged(&mut self) {
        if let Err(e) = self.persist() {
            log::warn!("could not save config: {e}");
        }
    }

    /// Keeps `active_bulb_ip` pointing at a bulb that exists.
    fn ensure_active(&mut self) {
        let valid = self
            .store
            .config()
            .active_bulb_ip
            .as_deref()
            .is_some_and(|ip| self.bulbs.iter().any(|b| b.ip == ip));
        if !valid {
            let first = self.bulbs.first().map(|b| b.ip.clone());
            self.store.config_mut().active_bulb_ip = first;
        }
    }

    fn worker_for(&mut self, ip: &str) -> Option<&UnboundedSender<Job>> {
        if !self.workers.contains_key(ip) {
            let addr: Ipv4Addr = ip.parse().ok()?;
            let w = worker::spawn(addr, self.opts.net, self.opts.timings, self.tx.clone());
            self.workers.insert(ip.to_owned(), w);
        }
        self.workers.get(ip)
    }

    fn dispatch(&mut self, ip: &str, op: WorkerOp, kind: Pending, reply: Option<Reply<()>>) {
        self.next_ticket += 1;
        let ticket = self.next_ticket;
        let sent = match self.worker_for(ip) {
            Some(w) => w.send(Job { ticket, op }).is_ok(),
            None => false,
        };
        if !sent {
            if let Some(reply) = reply {
                let _ = reply.send(Err(AppError::invalid("ip")));
            }
            return;
        }
        self.pending.insert(ticket, PendingJob { kind, reply });
    }

    fn refresh_one(&mut self, ip: &str, reply: Option<Reply<()>>) {
        let full = self.find(ip).is_some_and(|i| self.bulbs[i].sys.module_name.is_none());
        let op = if full { WorkerOp::RefreshFull } else { WorkerOp::Refresh };
        self.dispatch(ip, op, Pending::Refresh, reply);
    }

    fn patch_active(&mut self, patch: PilotPatch, kind: Pending, reply: Reply<()>) {
        if let Err(e) = patch.validate() {
            let _ = reply.send(Err(AppError::from_wiz(e, "")));
            return;
        }
        match self.resolve(&Target::Active) {
            Ok(ip) => self.dispatch(&ip, WorkerOp::Patch(patch), kind, Some(reply)),
            Err(e) => {
                let _ = reply.send(Err(e));
            }
        }
    }

    fn set_custom_color(&mut self, id: u32, reply: Reply<()>) {
        let Some(color) = self.store.config().custom_colors.iter().find(|c| c.id == id) else {
            let _ = reply.send(Err(AppError::invalid("colorId")));
            return;
        };
        let patch = match PilotPatch::from_hex(&color.hex) {
            Ok(p) => p,
            Err(e) => {
                let _ = reply.send(Err(AppError::from_wiz(e, "")));
                return;
            }
        };
        let rgb = (patch.r.unwrap_or(0), patch.g.unwrap_or(0), patch.b.unwrap_or(0));
        self.patch_active(patch, Pending::Color { id, rgb }, reply);
    }

    // ---- worker results ---------------------------------------------------------

    fn worker_done(&mut self, ip: &str, ticket: u64, outcome: Result<WorkerOutput, WizError>) {
        let Some(job) = self.pending.remove(&ticket) else { return };
        let reply = job.reply;

        let Some(i) = self.find(ip) else {
            // Deleted while the job was in flight.
            if let Some(reply) = reply {
                let _ = reply.send(outcome.map(|_| ()).map_err(|e| AppError::from_wiz(e, ip)));
            }
            return;
        };

        match outcome {
            Ok(output) => {
                let was_offline = !self.bulbs[i].online;
                self.bulbs[i].online = true;
                self.apply_success(i, &job.kind, output);
                self.emit();
                if let Some(reply) = reply {
                    let _ = reply.send(Ok(()));
                }
                // A command revived the bulb but only touched a few cached fields.
                if was_offline && !matches!(job.kind, Pending::Refresh) {
                    self.refresh_one(ip, None);
                }
            }
            Err(e) => {
                if matches!(e, WizError::Timeout | WizError::Unreachable) {
                    self.bulbs[i].online = false;
                    self.emit();
                }
                if let Some(reply) = reply {
                    let _ = reply.send(Err(AppError::from_wiz(e, ip)));
                }
            }
        }
    }

    fn apply_success(&mut self, i: usize, kind: &Pending, output: WorkerOutput) {
        let b = &mut self.bulbs[i];
        match (kind, output) {
            (_, WorkerOutput::Pilot(p)) => b.pilot = p,
            (_, WorkerOutput::Full(p, sys)) => {
                b.pilot = p;
                if let Some(sys) = sys {
                    b.sys = sys;
                }
            }
            (_, WorkerOutput::Toggled(on)) => b.pilot.state = Some(on),
            (Pending::Brightness(d), _) => b.pilot.dimming = Some(*d),
            (Pending::Scene(id), _) => {
                b.pilot.state = Some(true);
                b.pilot.scene_id = Some(*id);
            }
            (Pending::Color { id, rgb }, _) => {
                b.pilot.state = Some(true);
                b.pilot.scene_id = Some(*id);
                (b.pilot.r, b.pilot.g, b.pilot.b) = (Some(rgb.0), Some(rgb.1), Some(rgb.2));
            }
            _ => {}
        }
        if b.mac.is_none() {
            if let Some(mac) = b.pilot.mac.clone() {
                b.mac = Some(mac);
                self.persist_logged();
            }
        }
    }

    // ---- bulb list --------------------------------------------------------------

    fn set_name(&mut self, name: String, ip: Option<String>) -> Result<(), AppError> {
        let name = name.trim().to_owned();
        if name.is_empty() {
            return Err(AppError::invalid("name"));
        }
        let ip = match ip {
            Some(ip) => ip,
            None => self.resolve(&Target::Active)?,
        };
        let i = self.find(&ip).ok_or(AppError::UnknownBulb { ip })?;
        self.bulbs[i].name = name;
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn set_active(&mut self, ip: &str) -> Result<(), AppError> {
        let i = self.find(ip).ok_or_else(|| AppError::UnknownBulb { ip: ip.to_owned() })?;
        self.store.config_mut().active_bulb_ip = Some(ip.to_owned());
        self.persist()?;
        self.emit();
        // Selecting a bulb is one of the moments an offline bulb gets another chance.
        if !self.bulbs[i].online {
            self.refresh_one(ip, None);
        }
        Ok(())
    }

    fn delete_bulb(&mut self, ip: &str) -> Result<(), AppError> {
        let i = self.find(ip).ok_or_else(|| AppError::UnknownBulb { ip: ip.to_owned() })?;
        self.bulbs.remove(i);
        self.workers.remove(ip);
        self.ensure_active();
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn delete_profile(&mut self) -> Result<(), AppError> {
        self.cancel_discovery();
        self.bulbs.clear();
        self.workers.clear();
        self.discovery_failed = false;
        let result = self.store.reset().map_err(|e| AppError::Io { message: e.to_string() });
        self.start_discovery();
        result
    }

    fn add_by_ip(&mut self, ip: String, reply: Reply<AddBulbOutcome>) {
        let Ok(addr) = ip.trim().parse::<Ipv4Addr>() else {
            let _ = reply.send(Err(AppError::invalid("ip")));
            return;
        };
        let ip = addr.to_string();
        if self.find(&ip).is_some() {
            let _ = reply.send(Ok(AddBulbOutcome::Duplicate));
            return;
        }
        let opts = self.opts.clone();
        let tx = self.tx.clone();
        tokio::spawn(async move {
            let cancel = CancellationToken::new();
            let found = discover_unicast(&[addr], opts.net, opts.timings.discover_wait, &cancel)
                .await
                .ok()
                .and_then(|mut v| v.pop());
            let outcome = match found {
                Some(d) => {
                    let sys = match BulbClient::connect(addr, opts.net, opts.timings).await {
                        Ok(mut c) => c.get_system_config().await.ok(),
                        Err(_) => None,
                    };
                    Ok((d, sys))
                }
                None => Err(()),
            };
            let _ = tx.send(ManagerMsg::AddResult { ip, outcome, reply });
        });
    }

    fn add_result(
        &mut self,
        ip: &str,
        outcome: Result<(Discovered, Option<SystemConfig>), ()>,
        reply: Reply<AddBulbOutcome>,
    ) {
        let Ok((found, sys)) = outcome else {
            let _ = reply.send(Err(AppError::BulbUnreachable { ip: ip.to_owned() }));
            return;
        };
        let mac = found.pilot.mac.clone();
        let duplicate = self.find(ip).is_some()
            || self.bulbs.iter().any(|b| b.mac.is_some() && mac_matches(&b.mac, &mac));
        if duplicate {
            let _ = reply.send(Ok(AddBulbOutcome::Duplicate));
            return;
        }
        let sys = sys.unwrap_or_default();
        let name = sys.module_name.clone().or_else(|| mac.clone()).unwrap_or_else(|| ip.to_owned());
        self.bulbs.push(Bulb {
            mac,
            ip: ip.to_owned(),
            name,
            online: true,
            pilot: found.pilot,
            sys,
        });
        if self.store.config().active_bulb_ip.is_none() {
            self.store.config_mut().active_bulb_ip = Some(ip.to_owned());
        }
        let saved = self.persist();
        self.emit();
        let _ = reply.send(saved.map(|()| AddBulbOutcome::Added));
    }

    // ---- colors -----------------------------------------------------------------

    fn add_color(&mut self, name: String, hex: &str) -> Result<(), AppError> {
        PilotPatch::from_hex(hex).map_err(|_| AppError::invalid("colorHex"))?;
        let cfg = self.store.config_mut();
        let id = cfg
            .custom_colors
            .iter()
            .map(|c| c.id)
            .max()
            .map_or(MAX_DEFAULT_COLORS, |m| (m + 1).max(MAX_DEFAULT_COLORS));
        cfg.custom_colors.push(CustomColor { id, name, hex: hex.to_owned() });
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn edit_color(&mut self, id: u32, name: String, hex: &str) -> Result<(), AppError> {
        PilotPatch::from_hex(hex).map_err(|_| AppError::invalid("colorHex"))?;
        let color = self
            .store
            .config_mut()
            .custom_colors
            .iter_mut()
            .find(|c| c.id == id)
            .ok_or_else(|| AppError::invalid("colorId"))?;
        color.name = name;
        color.hex = hex.to_owned();
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn remove_color(&mut self, id: u32) -> Result<(), AppError> {
        let cfg = self.store.config_mut();
        if !cfg.custom_colors.iter().any(|c| c.id == id) {
            return Err(AppError::invalid("colorId"));
        }
        cfg.custom_colors.retain(|c| c.id != id);
        cfg.favorite_colors.retain(|f| *f != id);
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn toggle_favorite(&mut self, id: u32) -> Result<(), AppError> {
        let cfg = self.store.config_mut();
        if let Some(pos) = cfg.favorite_colors.iter().position(|f| *f == id) {
            cfg.favorite_colors.remove(pos);
        } else {
            cfg.favorite_colors.push(id);
        }
        self.persist()?;
        self.emit();
        Ok(())
    }

    fn set_favorite_order(&mut self, order: Vec<u32>) -> Result<(), AppError> {
        self.store.config_mut().favorite_colors = order;
        self.persist()?;
        self.emit();
        Ok(())
    }

    // ---- refresh ----------------------------------------------------------------

    fn refresh_all(&mut self) {
        if self.is_discovering {
            return;
        }
        let now = Instant::now();
        if self.last_refresh.is_some_and(|t| now.duration_since(t) < self.opts.refresh_min_interval)
        {
            return;
        }
        self.last_refresh = Some(now);
        let ips: Vec<String> = self.bulbs.iter().map(|b| b.ip.clone()).collect();
        for ip in ips {
            self.refresh_one(&ip, None);
        }
    }

    // ---- discovery --------------------------------------------------------------

    fn cancel_discovery(&mut self) {
        if let Some(d) = self.discovery.take() {
            d.cancel.cancel();
        }
    }

    fn start_discovery(&mut self) {
        self.cancel_discovery();
        self.generation += 1;
        let cancel = CancellationToken::new();
        self.discovery = Some(Running { generation: self.generation, cancel: cancel.clone() });
        self.is_discovering = true;
        self.discovery_failed = false;
        self.emit();

        let known = self
            .bulbs
            .iter()
            .filter_map(|b| Some((b.ip.parse::<Ipv4Addr>().ok()?, b.mac.clone())))
            .collect();
        let plan = Plan { known, adopt: self.bulbs.is_empty() };
        tokio::spawn(discovery::run(
            plan,
            self.opts.clone(),
            cancel,
            self.generation,
            self.tx.clone(),
        ));
    }

    fn on_discovery(&mut self, event: DiscoveryEvent) {
        match event {
            DiscoveryEvent::Found { ip, pilot, sys, via, adopt } => {
                self.apply_found(ip, pilot, sys, via, adopt);
            }
            DiscoveryEvent::Finished => {
                self.discovery = None;
                self.is_discovering = false;
                self.discovery_failed = self.bulbs.is_empty();
                if self.discovery_failed {
                    self.toast(
                        "toast.discoveryFailed",
                        ToastKind::Error,
                        false,
                        Some("retry-discovery"),
                    );
                }
                self.ensure_active();
                self.persist_logged();
                self.emit();
            }
        }
    }

    fn apply_found(
        &mut self,
        ip: Ipv4Addr,
        pilot: Pilot,
        sys: Option<SystemConfig>,
        via: Via,
        adopt: bool,
    ) {
        let ip = ip.to_string();
        let seen_mac = pilot.mac.clone();
        let by_ip = self.find(&ip);

        let target = match (via, by_ip) {
            // A saved IP answered: only trust it if the MAC still matches.
            (Via::Unicast, Some(i)) if mac_matches(&self.bulbs[i].mac, &seen_mac) => Some(i),
            (Via::Unicast, _) => None,
            (Via::Broadcast, by_ip) => {
                let by_mac = seen_mac.as_deref().map(normalize_mac).and_then(|m| {
                    self.bulbs
                        .iter()
                        .position(|b| b.mac.as_deref().map(normalize_mac).as_deref() == Some(&m))
                });
                match (by_mac, by_ip) {
                    (Some(i), _) => Some(i),
                    (None, Some(i)) if self.bulbs[i].mac.is_none() => Some(i),
                    _ => None,
                }
            }
        };

        if let Some(i) = target {
            let old_ip = self.bulbs[i].ip.clone();
            if old_ip != ip {
                // Known MAC under a new IP: keep the name, move the entry.
                self.workers.remove(&old_ip);
                let cfg = self.store.config_mut();
                if cfg.active_bulb_ip.as_deref() == Some(old_ip.as_str()) {
                    cfg.active_bulb_ip = Some(ip.clone());
                }
                self.bulbs[i].ip = ip.clone();
            }
            let b = &mut self.bulbs[i];
            b.online = true;
            if b.mac.is_none() {
                b.mac = seen_mac;
            }
            b.pilot = pilot;
            if let Some(sys) = sys {
                b.sys = sys;
            }
            self.persist_logged();
        } else if via == Via::Broadcast && adopt && by_ip.is_none() {
            let sys = sys.unwrap_or_default();
            let name =
                sys.module_name.clone().or_else(|| seen_mac.clone()).unwrap_or_else(|| ip.clone());
            self.bulbs.push(Bulb { mac: seen_mac, ip, name, online: true, pilot, sys });
            self.ensure_active();
            self.persist_logged();
        } else {
            return;
        }
        self.emit();
    }
}
