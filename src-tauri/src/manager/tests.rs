use std::net::Ipv4Addr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use tempfile::TempDir;

use super::*;
use crate::config::{AppConfig, BulbEntry, ConfigStore, LoadOutcome};
use crate::error::AppError;
use crate::models::{AddBulbOutcome, MultiBulbState, ToastMessage};
use crate::wiz::testing::{Behavior, FakeBulb};
use crate::wiz::{Timings, WizNet};

// ---- harness ------------------------------------------------------------------

#[derive(Default)]
struct TestFrontend {
    states: Mutex<Vec<MultiBulbState>>,
    toasts: Mutex<Vec<ToastMessage>>,
}

impl Frontend for TestFrontend {
    fn state(&self, state: &MultiBulbState) {
        self.states.lock().unwrap().push(state.clone());
    }

    fn toast(&self, toast: ToastMessage) {
        self.toasts.lock().unwrap().push(toast);
    }
}

impl TestFrontend {
    fn last(&self) -> Option<MultiBulbState> {
        self.states.lock().unwrap().last().cloned()
    }

    fn toasts(&self) -> Vec<ToastMessage> {
        self.toasts.lock().unwrap().clone()
    }
}

struct Harness {
    handle: ManagerHandle,
    ui: Arc<TestFrontend>,
    dir: TempDir,
}

fn ip(last: u8) -> Ipv4Addr {
    Ipv4Addr::new(127, 0, 0, last)
}

fn entry(mac: Option<&str>, ip: &str, name: &str) -> BulbEntry {
    BulbEntry { mac: mac.map(str::to_owned), ip: ip.to_owned(), name: name.to_owned() }
}

fn config_with(bulbs: Vec<BulbEntry>) -> AppConfig {
    let active = bulbs.first().map(|b| b.ip.clone());
    AppConfig { bulbs, active_bulb_ip: active, ..AppConfig::default() }
}

/// `n` fakes on 127.0.0.1..=n sharing one port, with MACs `aa00000000NN`.
async fn fakes(n: u8) -> (u16, Vec<FakeBulb>) {
    'attempt: for _ in 0..20 {
        let Ok(first) = FakeBulb::try_start_on(ip(1), 0, "aa0000000001").await else { continue };
        let port = first.port();
        let mut all = vec![first];
        for i in 2..=n {
            let mac = format!("aa00000000{i:02}");
            match FakeBulb::try_start_on(ip(i), port, &mac).await {
                Ok(b) => all.push(b),
                Err(_) => continue 'attempt,
            }
        }
        return (port, all);
    }
    panic!("could not bind fake bulbs");
}

fn fast_timings() -> Timings {
    Timings {
        response: Duration::from_millis(250),
        discover_wait: Duration::from_millis(400),
        retry_delay: Duration::from_millis(50),
        attempts: 3,
    }
}

impl Harness {
    /// `broadcast` replaces the interface broadcast addresses (loopback fakes).
    async fn start(port: u16, config: AppConfig, broadcast: Option<Vec<Ipv4Addr>>) -> Self {
        let dir = tempfile::tempdir().unwrap();
        {
            let (mut store, _) = ConfigStore::load(dir.path(), &[]);
            *store.config_mut() = config;
            store.save().unwrap();
        }
        let (store, outcome) = ConfigStore::load(dir.path(), &[]);
        assert_eq!(outcome, LoadOutcome::Loaded);

        let ui = Arc::new(TestFrontend::default());
        let opts = ManagerOptions {
            net: WizNet { port },
            timings: fast_timings(),
            refresh_min_interval: Duration::from_millis(100),
            broadcast_targets: broadcast,
        };
        let (handle, actor) = ManagerHandle::build(ui.clone(), store, outcome, opts);
        tokio::spawn(actor.run());
        Self { handle, ui, dir }
    }

    async fn wait_for(&self, what: &str, pred: impl Fn(&MultiBulbState) -> bool) -> MultiBulbState {
        let deadline = Instant::now() + Duration::from_secs(8);
        loop {
            if let Some(s) = self.ui.last() {
                if pred(&s) {
                    return s;
                }
            }
            assert!(Instant::now() < deadline, "timed out waiting for: {what}");
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    }

    async fn settled(&self) -> MultiBulbState {
        self.wait_for("discovery finished", |s| !s.is_discovering).await
    }

    fn disk(&self) -> AppConfig {
        ConfigStore::load(self.dir.path(), &[]).0.config().clone()
    }
}

fn online_ips(s: &MultiBulbState) -> Vec<String> {
    s.bulbs.iter().filter(|b| b.online).map(|b| b.ip.clone()).collect()
}

// ---- startup / discovery --------------------------------------------------------

#[tokio::test]
async fn startup_keeps_offline_bulbs_in_the_list_and_config() {
    let (port, fakes) = fakes(2).await; // .3 is never started
    let cfg = config_with(vec![
        entry(Some("aa0000000001"), "127.0.0.1", "Uno"),
        entry(Some("aa0000000002"), "127.0.0.2", "Dos"),
        entry(Some("aa0000000003"), "127.0.0.3", "Tres"),
    ]);
    let h = Harness::start(port, cfg.clone(), Some(vec![])).await;

    // First emitted state: everything known, nothing online yet, discovering.
    let first = h.wait_for("first state", |_| true).await;
    assert!(first.is_discovering);
    assert_eq!(first.bulbs.len(), 3);

    let s = h.settled().await;
    assert_eq!(online_ips(&s), vec!["127.0.0.1", "127.0.0.2"]);
    assert!(!s.bulbs[2].online);
    assert!(!s.discovery_failed);
    assert_eq!(h.disk().bulbs.len(), 3, "offline bulb must stay in config.json");
    assert!(h.ui.toasts().is_empty());
    drop(fakes);
}

#[tokio::test]
async fn no_known_bulbs_reports_failure_with_pinned_retry_toast() {
    let (port, _f) = fakes(1).await;
    let h = Harness::start(port, AppConfig::default(), Some(vec![])).await;
    let s = h.settled().await;
    assert!(s.discovery_failed);
    let toasts = h.ui.toasts();
    assert_eq!(toasts.len(), 1);
    assert_eq!(toasts[0].message, "toast.discoveryFailed");
    assert!(!toasts[0].auto_dismiss);
    assert_eq!(toasts[0].retry_action.as_deref(), Some("retry-discovery"));
}

#[tokio::test]
async fn saved_but_all_offline_shows_grey_list_without_toast() {
    let (port, _f) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000009"), "127.0.0.9", "Fuera")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    let s = h.settled().await;
    assert!(!s.discovery_failed);
    assert_eq!(s.bulbs.len(), 1);
    assert!(!s.bulbs[0].online);
    assert!(h.ui.toasts().is_empty());
}

#[tokio::test]
async fn broadcast_with_empty_config_adopts_everything() {
    let (port, _f) = fakes(2).await;
    let h = Harness::start(port, AppConfig::default(), Some(vec![ip(1), ip(2)])).await;
    let s = h.settled().await;
    assert_eq!(s.bulbs.len(), 2);
    assert!(s.bulbs.iter().all(|b| b.online));
    assert_eq!(s.bulbs[0].name, "ESP01_SHRGB_03");
    assert_eq!(s.active_bulb.as_ref().unwrap().ip, s.bulbs[0].ip);
    let disk = h.disk();
    assert_eq!(disk.bulbs.len(), 2);
    assert!(disk.bulbs.iter().all(|b| b.mac.is_some()));
}

#[tokio::test]
async fn broadcast_with_saved_bulbs_ignores_unknown_macs() {
    let (port, _f) = fakes(2).await;
    let cfg = config_with(vec![entry(Some("aa0000000009"), "127.0.0.9", "Fuera")]);
    let h = Harness::start(port, cfg, Some(vec![ip(1), ip(2)])).await;
    let s = h.settled().await;
    assert_eq!(s.bulbs.len(), 1);
    assert_eq!(s.bulbs[0].ip, "127.0.0.9");
    assert!(!s.bulbs[0].online);
}

#[tokio::test]
async fn known_mac_on_new_ip_is_relocated_keeping_name_and_active() {
    let (port, _f) = fakes(5).await;
    // Saved at .9, but that MAC now answers from .5.
    let cfg = config_with(vec![entry(Some("aa0000000005"), "127.0.0.9", "Cocina")]);
    let h = Harness::start(port, cfg, Some(vec![ip(5)])).await;
    let s = h.settled().await;
    assert_eq!(s.bulbs.len(), 1);
    assert_eq!(s.bulbs[0].ip, "127.0.0.5");
    assert_eq!(s.bulbs[0].name, "Cocina");
    assert!(s.bulbs[0].online);
    assert_eq!(s.active_bulb.unwrap().ip, "127.0.0.5");

    let disk = h.disk();
    assert_eq!(disk.bulbs[0].ip, "127.0.0.5");
    assert_eq!(disk.active_bulb_ip.as_deref(), Some("127.0.0.5"));
}

#[tokio::test]
async fn saved_ip_answered_by_a_different_mac_stays_offline_and_untouched() {
    let (port, _f) = fakes(1).await; // 127.0.0.1 answers as aa0000000001
    let cfg = config_with(vec![entry(Some("bb0000000000"), "127.0.0.1", "Otra")]);
    let h = Harness::start(port, cfg.clone(), Some(vec![])).await;
    let s = h.settled().await;
    assert!(!s.bulbs[0].online);
    assert_eq!(h.disk().bulbs, cfg.bulbs);
}

#[tokio::test]
async fn retry_discovery_cancels_the_previous_run() {
    let (port, _f) = fakes(1).await;
    // Slow to finish: unicast never answers, 3 attempts of 400 ms.
    let cfg = config_with(vec![entry(Some("aa0000000009"), "127.0.0.9", "Fuera")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.wait_for("first state", |_| true).await;
    tokio::time::sleep(Duration::from_millis(100)).await;

    h.handle.retry_discovery().await.unwrap();
    h.settled().await;
    tokio::time::sleep(Duration::from_millis(1500)).await; // the cancelled run would finish here

    let finished = h.ui.states.lock().unwrap().iter().filter(|s| !s.is_discovering).count();
    assert_eq!(finished, 1, "only the surviving discovery may report completion");
}

#[tokio::test]
async fn delete_profile_during_discovery_starts_a_fresh_adoption() {
    let (port, _f) = fakes(4).await;
    let cfg = config_with(vec![entry(Some("aa0000000009"), "127.0.0.9", "Vieja")]);
    let h = Harness::start(port, cfg, Some(vec![ip(4)])).await;
    h.wait_for("first state", |_| true).await;
    tokio::time::sleep(Duration::from_millis(100)).await;

    h.handle.delete_profile().await.unwrap();
    let s = h.settled().await;
    assert_eq!(s.bulbs.len(), 1);
    assert_eq!(s.bulbs[0].mac, "aa0000000004");
    assert!(s.bulbs[0].online);

    let disk = h.disk();
    assert_eq!(disk.bulbs.len(), 1);
    assert_eq!(disk.bulbs[0].ip, "127.0.0.4");
    assert_eq!(disk.favorite_colors, vec![11, 12, 14, 6]);
}

// ---- commands -----------------------------------------------------------------

#[tokio::test]
async fn failing_bulb_goes_offline_without_touching_active_or_config() {
    let (port, fakes) = fakes(2).await;
    let cfg = config_with(vec![
        entry(Some("aa0000000001"), "127.0.0.1", "Uno"),
        entry(Some("aa0000000002"), "127.0.0.2", "Dos"),
    ]);
    let h = Harness::start(port, cfg.clone(), Some(vec![])).await;
    h.settled().await;

    fakes[1].set_behavior(Behavior::Silent);
    let err = h.handle.toggle_bulb_by_ip("127.0.0.2".into()).await.unwrap_err();
    assert_eq!(err, AppError::BulbOffline { ip: "127.0.0.2".into() });

    let s = h.wait_for("second bulb offline", |s| !s.bulbs[1].online).await;
    assert!(s.bulbs[0].online);
    assert_eq!(s.active_bulb.unwrap().ip, "127.0.0.1");
    assert_eq!(h.disk().bulbs, cfg.bulbs);
    // The command was retried once before giving up.
    let toggles = fakes[1].received().iter().filter(|m| *m == "getPilot").count();
    assert!(toggles >= 2);
}

#[tokio::test]
async fn offline_bulb_that_came_back_is_online_after_a_command() {
    let (port, fakes) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    fakes[0].set_behavior(Behavior::Silent);
    assert!(h.handle.toggle_bulb().await.is_err());
    h.wait_for("offline", |s| !s.bulbs[0].online).await;

    fakes[0].set_behavior(Behavior::Normal);
    h.handle.toggle_bulb().await.unwrap();
    let s = h.wait_for("online again", |s| s.bulbs[0].online).await;
    assert!(s.active_bulb.unwrap().online);
}

#[tokio::test]
async fn probe_brings_an_offline_bulb_back() {
    let (port, fakes) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    fakes[0].set_behavior(Behavior::Silent);
    assert!(h.handle.probe_bulb("127.0.0.1".into()).await.is_err());
    h.wait_for("offline", |s| !s.bulbs[0].online).await;

    fakes[0].set_behavior(Behavior::Normal);
    h.handle.probe_bulb("127.0.0.1".into()).await.unwrap();
    h.wait_for("online", |s| s.bulbs[0].online).await;
}

#[tokio::test]
async fn a_hung_bulb_does_not_delay_the_others() {
    let (port, fakes) = fakes(2).await;
    let cfg = config_with(vec![
        entry(Some("aa0000000001"), "127.0.0.1", "Uno"),
        entry(Some("aa0000000002"), "127.0.0.2", "Dos"),
    ]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    fakes[0].set_behavior(Behavior::Silent);
    let hung = tokio::spawn({
        let handle = h.handle.clone();
        async move { handle.toggle_bulb_by_ip("127.0.0.1".into()).await }
    });
    tokio::time::sleep(Duration::from_millis(30)).await;

    let started = Instant::now();
    h.handle.toggle_bulb_by_ip("127.0.0.2".into()).await.unwrap();
    assert!(started.elapsed() < Duration::from_millis(200), "took {:?}", started.elapsed());

    let started = Instant::now();
    let s = h.handle.get_bulbs().await.unwrap();
    assert!(started.elapsed() < Duration::from_millis(100));
    assert_eq!(s.bulbs.len(), 2);

    assert!(hung.await.unwrap().is_err());
}

#[tokio::test]
async fn overlapping_commands_to_one_bulb_run_in_order_and_all_succeed() {
    let (port, fakes) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;
    fakes[0].with(|s| s.received.clear());

    let calls: Vec<_> = (1..=20u32).map(|i| h.handle.set_brightness(i * 5)).collect();
    for r in futures_util_join_all(calls).await {
        r.unwrap();
    }
    assert_eq!(fakes[0].with(|s| s.dimming), 100);
    assert_eq!(fakes[0].received().iter().filter(|m| *m == "setPilot").count(), 20);
    assert_eq!(h.ui.last().unwrap().active_bulb.unwrap().dimming, Some(100));
}

/// Minimal `join_all` so the tests don't need the futures crate.
async fn futures_util_join_all<F: std::future::Future>(futs: Vec<F>) -> Vec<F::Output> {
    let mut set = Vec::with_capacity(futs.len());
    let mut pinned: Vec<std::pin::Pin<Box<F>>> = futs.into_iter().map(Box::pin).collect();
    std::future::poll_fn(|cx| {
        let mut done = true;
        for (i, f) in pinned.iter_mut().enumerate() {
            if set.len() <= i {
                set.push(None);
            }
            if set[i].is_none() {
                match f.as_mut().poll(cx) {
                    std::task::Poll::Ready(v) => set[i] = Some(v),
                    std::task::Poll::Pending => done = false,
                }
            }
        }
        if done {
            std::task::Poll::Ready(())
        } else {
            std::task::Poll::Pending
        }
    })
    .await;
    set.into_iter().map(Option::unwrap).collect()
}

#[tokio::test]
async fn scene_and_custom_color_update_cached_state() {
    let (port, fakes) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    h.handle.toggle_bulb().await.unwrap(); // on -> off
    assert!(!fakes[0].with(|s| s.on));
    h.handle.set_scene(6).await.unwrap();
    let s = h.ui.last().unwrap();
    assert_eq!(s.active_bulb.as_ref().unwrap().scene_id, 6);
    assert!(s.active_bulb.unwrap().state);

    h.handle.add_custom_color("Rosa".into(), "#ff66aa".into()).await.unwrap();
    h.handle.set_custom_color(33).await.unwrap();
    let a = h.ui.last().unwrap().active_bulb.unwrap();
    assert_eq!((a.scene_id, a.r, a.g, a.b), (33, Some(255), Some(102), Some(170)));

    // Out of range values never reach the bulb.
    assert!(matches!(
        h.handle.set_scene(40).await,
        Err(AppError::InvalidArgument { field }) if field == "sceneId"
    ));
    assert!(matches!(
        h.handle.set_brightness(101).await,
        Err(AppError::InvalidArgument { field }) if field == "dimming"
    ));
    assert!(matches!(h.handle.set_custom_color(99).await, Err(AppError::InvalidArgument { .. })));
}

#[tokio::test]
async fn add_by_ip_outcomes() {
    let (port, _f) = fakes(2).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    assert_eq!(
        h.handle.add_bulb_by_ip("127.0.0.1".into()).await.unwrap(),
        AddBulbOutcome::Duplicate
    );
    assert_eq!(h.handle.add_bulb_by_ip("127.0.0.2".into()).await.unwrap(), AddBulbOutcome::Added);
    assert_eq!(
        h.handle.add_bulb_by_ip("127.0.0.2".into()).await.unwrap(),
        AddBulbOutcome::Duplicate
    );
    assert_eq!(
        h.handle.add_bulb_by_ip("127.0.0.9".into()).await.unwrap_err(),
        AppError::BulbUnreachable { ip: "127.0.0.9".into() }
    );
    assert!(matches!(
        h.handle.add_bulb_by_ip("not an ip".into()).await,
        Err(AppError::InvalidArgument { .. })
    ));

    let disk = h.disk();
    assert_eq!(disk.bulbs.len(), 2);
    assert_eq!(disk.bulbs[1].mac.as_deref(), Some("aa0000000002"));
}

#[tokio::test]
async fn rename_delete_and_active_reassignment() {
    let (port, _f) = fakes(2).await;
    let cfg = config_with(vec![
        entry(Some("aa0000000001"), "127.0.0.1", "Uno"),
        entry(Some("aa0000000002"), "127.0.0.2", "Dos"),
    ]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    h.settled().await;

    h.handle.set_bulb_name("Living".into(), Some("127.0.0.2".into())).await.unwrap();
    assert_eq!(h.disk().bulbs[1].name, "Living");
    assert!(h.handle.set_bulb_name("  ".into(), None).await.is_err());
    assert!(matches!(
        h.handle.set_bulb_name("X".into(), Some("10.9.9.9".into())).await,
        Err(AppError::UnknownBulb { .. })
    ));

    h.handle.set_active_bulb("127.0.0.2".into()).await.unwrap();
    assert_eq!(h.disk().active_bulb_ip.as_deref(), Some("127.0.0.2"));

    h.handle.delete_bulb("127.0.0.2".into()).await.unwrap();
    let s = h.handle.get_bulbs().await.unwrap();
    assert_eq!(s.bulbs.len(), 1);
    assert_eq!(s.active_bulb.unwrap().ip, "127.0.0.1");
    assert_eq!(h.disk().active_bulb_ip.as_deref(), Some("127.0.0.1"));
}

#[tokio::test]
async fn colors_and_favorites_lifecycle_persists() {
    let (port, _f) = fakes(1).await;
    let h = Harness::start(port, AppConfig::default(), Some(vec![])).await;
    h.settled().await;

    h.handle.add_custom_color("Rosa".into(), "#ff66aa".into()).await.unwrap();
    h.handle.add_custom_color("Azul".into(), "#3366ff".into()).await.unwrap();
    let disk = h.disk();
    assert_eq!(disk.custom_colors.iter().map(|c| c.id).collect::<Vec<_>>(), vec![33, 34]);

    h.handle.edit_custom_color(34, "Azul claro".into(), "#6699ff".into()).await.unwrap();
    assert_eq!(h.disk().custom_colors[1].name, "Azul claro");
    assert_eq!(h.disk().custom_colors[1].hex, "#6699ff");

    h.handle.toggle_favorite_color(33).await.unwrap();
    assert_eq!(h.disk().favorite_colors, vec![11, 12, 14, 6, 33]);
    h.handle.set_favorite_colors_order(vec![33, 6, 14, 12, 11]).await.unwrap();
    assert_eq!(h.disk().favorite_colors, vec![33, 6, 14, 12, 11]);

    // Removing a favorite color also drops it from favorites.
    h.handle.remove_custom_color(33).await.unwrap();
    let disk = h.disk();
    assert_eq!(disk.custom_colors.len(), 1);
    assert_eq!(disk.favorite_colors, vec![6, 14, 12, 11]);

    // A new color gets a fresh id above the highest existing one.
    h.handle.add_custom_color("Verde".into(), "#00ff00".into()).await.unwrap();
    assert_eq!(h.disk().custom_colors.last().unwrap().id, 35);

    assert!(matches!(
        h.handle.add_custom_color("Mal".into(), "rojo".into()).await,
        Err(AppError::InvalidArgument { .. })
    ));
    assert!(h.handle.remove_custom_color(999).await.is_err());
}

#[tokio::test]
async fn refresh_all_picks_up_external_changes_and_is_throttled() {
    let (port, fakes) = fakes(1).await;
    let cfg = config_with(vec![entry(Some("aa0000000001"), "127.0.0.1", "Uno")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    let s = h.settled().await;
    assert!(s.bulbs[0].state);

    fakes[0].with(|s| s.on = false); // changed from the official WiZ app
    h.handle.refresh_all();
    h.wait_for("state refreshed", |s| !s.bulbs[0].state).await;

    // Immediately again: ignored by the throttle, no new getPilot.
    let before = fakes[0].received().len();
    fakes[0].with(|s| s.on = true);
    h.handle.refresh_all();
    tokio::time::sleep(Duration::from_millis(50)).await;
    assert_eq!(fakes[0].received().len(), before);

    tokio::time::sleep(Duration::from_millis(120)).await;
    h.handle.refresh_all();
    h.wait_for("second refresh", |s| s.bulbs[0].state).await;
}

#[tokio::test]
async fn legacy_entry_without_mac_gets_its_mac_filled_in() {
    let (port, _f) = fakes(1).await;
    let cfg = config_with(vec![entry(None, "127.0.0.1", "Importada")]);
    let h = Harness::start(port, cfg, Some(vec![])).await;
    let s = h.settled().await;
    assert!(s.bulbs[0].online);
    assert_eq!(s.bulbs[0].name, "Importada");
    assert_eq!(h.disk().bulbs[0].mac.as_deref(), Some("aa0000000001"));
}
