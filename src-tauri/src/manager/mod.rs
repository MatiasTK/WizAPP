//! The bulb manager: a single actor that owns the config and the bulb list, plus one
//! worker task per bulb so a slow bulb never blocks the others.

mod actor;
mod discovery;
#[cfg(test)]
mod tests;
mod worker;

use std::net::Ipv4Addr;
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{mpsc, oneshot};

use crate::config::{ConfigStore, LoadOutcome};
use crate::error::AppError;
use crate::models::{AddBulbOutcome, MultiBulbState, ToastMessage};
use crate::wiz::{Timings, WizNet};

pub use actor::Actor;

/// Where the manager sends what the UI should show.
pub trait Frontend: Send + Sync + 'static {
    fn state(&self, state: &MultiBulbState);
    fn toast(&self, toast: ToastMessage);
}

#[derive(Debug, Clone)]
pub struct ManagerOptions {
    pub net: WizNet,
    pub timings: Timings,
    /// `RefreshAll` calls closer together than this are ignored.
    pub refresh_min_interval: Duration,
    /// Replaces the per-interface broadcast addresses (tests aim this at loopback fakes).
    pub broadcast_targets: Option<Vec<Ipv4Addr>>,
}

impl Default for ManagerOptions {
    fn default() -> Self {
        Self {
            net: WizNet::default(),
            timings: Timings::default(),
            refresh_min_interval: Duration::from_secs(5),
            broadcast_targets: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Target {
    Active,
    Ip(String),
}

pub(crate) type Reply<T> = oneshot::Sender<Result<T, AppError>>;

pub(crate) enum ManagerMsg {
    GetBulbs(oneshot::Sender<MultiBulbState>),
    Toggle(Target, Reply<()>),
    SetBrightness(u32, Reply<()>),
    SetScene(u32, Reply<()>),
    SetCustomColor(u32, Reply<()>),
    SetBulbName {
        name: String,
        ip: Option<String>,
        reply: Reply<()>,
    },
    SetActive(String, Reply<()>),
    Delete(String, Reply<()>),
    Probe(String, Reply<()>),
    AddByIp(String, Reply<AddBulbOutcome>),
    AddColor {
        name: String,
        hex: String,
        reply: Reply<()>,
    },
    EditColor {
        id: u32,
        name: String,
        hex: String,
        reply: Reply<()>,
    },
    RemoveColor(u32, Reply<()>),
    ToggleFavorite(u32, Reply<()>),
    SetFavoriteOrder(Vec<u32>, Reply<()>),
    RetryDiscovery(Reply<()>),
    DeleteProfile(Reply<()>),
    RefreshAll,
    // Internal.
    WorkerDone {
        ip: String,
        ticket: u64,
        outcome: Result<worker::WorkerOutput, crate::wiz::WizError>,
    },
    Discovery {
        generation: u64,
        event: discovery::DiscoveryEvent,
    },
    AddResult {
        ip: String,
        outcome: Result<(crate::wiz::discovery::Discovered, Option<crate::wiz::SystemConfig>), ()>,
        reply: Reply<AddBulbOutcome>,
    },
}

/// Cheap, cloneable front door to the actor.
#[derive(Clone)]
pub struct ManagerHandle {
    tx: mpsc::UnboundedSender<ManagerMsg>,
}

fn gone() -> AppError {
    AppError::Io { message: "bulb manager stopped".into() }
}

impl ManagerHandle {
    /// Builds the actor without starting it; run it with `tokio::spawn(actor.run())` or
    /// `tauri::async_runtime::spawn`.
    pub fn build(
        frontend: Arc<dyn Frontend>,
        store: ConfigStore,
        outcome: LoadOutcome,
        opts: ManagerOptions,
    ) -> (ManagerHandle, Actor) {
        let (tx, rx) = mpsc::unbounded_channel();
        let actor = Actor::new(frontend, store, outcome, opts, tx.clone(), rx);
        (ManagerHandle { tx }, actor)
    }

    async fn ask<T>(&self, make: impl FnOnce(Reply<T>) -> ManagerMsg) -> Result<T, AppError> {
        let (reply, rx) = oneshot::channel();
        self.tx.send(make(reply)).map_err(|_| gone())?;
        rx.await.map_err(|_| gone())?
    }

    pub async fn get_bulbs(&self) -> Result<MultiBulbState, AppError> {
        let (reply, rx) = oneshot::channel();
        self.tx.send(ManagerMsg::GetBulbs(reply)).map_err(|_| gone())?;
        rx.await.map_err(|_| gone())
    }

    pub async fn toggle_bulb(&self) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::Toggle(Target::Active, r)).await
    }

    pub async fn toggle_bulb_by_ip(&self, ip: String) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::Toggle(Target::Ip(ip), r)).await
    }

    pub async fn set_brightness(&self, brightness: u32) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::SetBrightness(brightness, r)).await
    }

    pub async fn set_scene(&self, scene_id: u32) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::SetScene(scene_id, r)).await
    }

    pub async fn set_custom_color(&self, color_id: u32) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::SetCustomColor(color_id, r)).await
    }

    pub async fn set_bulb_name(&self, name: String, ip: Option<String>) -> Result<(), AppError> {
        self.ask(|reply| ManagerMsg::SetBulbName { name, ip, reply }).await
    }

    pub async fn set_active_bulb(&self, ip: String) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::SetActive(ip, r)).await
    }

    pub async fn delete_bulb(&self, ip: String) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::Delete(ip, r)).await
    }

    pub async fn probe_bulb(&self, ip: String) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::Probe(ip, r)).await
    }

    pub async fn add_bulb_by_ip(&self, ip: String) -> Result<AddBulbOutcome, AppError> {
        self.ask(|r| ManagerMsg::AddByIp(ip, r)).await
    }

    pub async fn add_custom_color(&self, name: String, hex: String) -> Result<(), AppError> {
        self.ask(|reply| ManagerMsg::AddColor { name, hex, reply }).await
    }

    pub async fn edit_custom_color(
        &self,
        id: u32,
        name: String,
        hex: String,
    ) -> Result<(), AppError> {
        self.ask(|reply| ManagerMsg::EditColor { id, name, hex, reply }).await
    }

    pub async fn remove_custom_color(&self, id: u32) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::RemoveColor(id, r)).await
    }

    pub async fn toggle_favorite_color(&self, id: u32) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::ToggleFavorite(id, r)).await
    }

    pub async fn set_favorite_colors_order(&self, order: Vec<u32>) -> Result<(), AppError> {
        self.ask(|r| ManagerMsg::SetFavoriteOrder(order, r)).await
    }

    /// Returns once the new discovery has started, not when it finishes.
    pub async fn retry_discovery(&self) -> Result<(), AppError> {
        self.ask(ManagerMsg::RetryDiscovery).await
    }

    /// Returns once the profile is deleted and a new discovery has started.
    pub async fn delete_profile(&self) -> Result<(), AppError> {
        self.ask(ManagerMsg::DeleteProfile).await
    }

    /// Fire and forget: re-polls every bulb (window shown again, second instance).
    pub fn refresh_all(&self) {
        let _ = self.tx.send(ManagerMsg::RefreshAll);
    }
}
