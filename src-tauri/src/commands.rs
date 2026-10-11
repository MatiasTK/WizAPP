//! `#[tauri::command]` layer. Everything here only translates arguments into a call on
//! the [`ManagerHandle`]; the logic lives in `manager`.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};
use tauri_plugin_opener::OpenerExt;

use crate::error::AppError;
use crate::manager::{Frontend, ManagerHandle};
use crate::models::{AddBulbOutcome, MultiBulbState, ToastMessage};

pub struct AppState {
    pub manager: ManagerHandle,
    pub frontend: std::sync::Arc<TauriFrontend>,
    /// Folder with `config.json` and `wiz-app.log`.
    pub data_dir: std::path::PathBuf,
    pub language: &'static str,
}

/// Holds toasts until the renderer has subscribed; events sent earlier are lost.
#[derive(Default)]
pub struct ToastGate {
    inner: Mutex<(bool, Vec<ToastMessage>)>,
}

impl ToastGate {
    /// `Some(toast)` when it can be delivered now, `None` when it was queued.
    pub fn push(&self, toast: ToastMessage) -> Option<ToastMessage> {
        let mut g = self.inner.lock().unwrap();
        if g.0 {
            Some(toast)
        } else {
            g.1.push(toast);
            None
        }
    }

    /// Marks the renderer as listening and returns what was queued, in order.
    pub fn open(&self) -> Vec<ToastMessage> {
        let mut g = self.inner.lock().unwrap();
        g.0 = true;
        std::mem::take(&mut g.1)
    }
}

/// Pushes manager output to the webview as events.
pub struct TauriFrontend {
    app: AppHandle,
    gate: ToastGate,
}

impl TauriFrontend {
    pub fn new(app: AppHandle) -> Self {
        Self { app, gate: ToastGate::default() }
    }

    fn emit_toast(&self, toast: ToastMessage) {
        if let Err(e) = self.app.emit("on-show-toast", toast) {
            log::warn!("could not emit on-show-toast: {e}");
        }
    }

    /// Called when the renderer asks for the initial state, which it does right after
    /// subscribing to events.
    pub fn renderer_ready(&self) {
        for toast in self.gate.open() {
            self.emit_toast(toast);
        }
    }
}

impl Frontend for TauriFrontend {
    fn state(&self, state: &MultiBulbState) {
        if let Err(e) = self.app.emit("on-update-bulb", state) {
            log::warn!("could not emit on-update-bulb: {e}");
        }
    }

    fn toast(&self, toast: ToastMessage) {
        if let Some(toast) = self.gate.push(toast) {
            self.emit_toast(toast);
        }
    }
}

type Res<T> = Result<T, AppError>;

#[tauri::command]
pub async fn get_bulbs(state: State<'_, AppState>) -> Res<MultiBulbState> {
    state.frontend.renderer_ready();
    state.manager.get_bulbs().await
}

#[tauri::command]
pub async fn toggle_bulb(state: State<'_, AppState>) -> Res<()> {
    state.manager.toggle_bulb().await
}

#[tauri::command]
pub async fn toggle_bulb_by_ip(state: State<'_, AppState>, ip: String) -> Res<()> {
    state.manager.toggle_bulb_by_ip(ip).await
}

#[tauri::command]
pub async fn set_brightness(state: State<'_, AppState>, brightness: u32) -> Res<()> {
    state.manager.set_brightness(brightness).await
}

#[tauri::command]
pub async fn set_scene(state: State<'_, AppState>, scene_id: u32) -> Res<()> {
    state.manager.set_scene(scene_id).await
}

#[tauri::command]
pub async fn set_custom_color(state: State<'_, AppState>, color_id: u32) -> Res<()> {
    state.manager.set_custom_color(color_id).await
}

#[tauri::command]
pub async fn set_bulb_name(
    state: State<'_, AppState>,
    name: String,
    ip: Option<String>,
) -> Res<()> {
    state.manager.set_bulb_name(name, ip).await
}

#[tauri::command]
pub async fn set_active_bulb(state: State<'_, AppState>, ip: String) -> Res<()> {
    state.manager.set_active_bulb(ip).await
}

#[tauri::command]
pub async fn delete_bulb(state: State<'_, AppState>, ip: String) -> Res<()> {
    state.manager.delete_bulb(ip).await
}

#[tauri::command]
pub async fn probe_bulb(state: State<'_, AppState>, ip: String) -> Res<()> {
    state.manager.probe_bulb(ip).await
}

#[tauri::command]
pub async fn add_bulb_by_ip(state: State<'_, AppState>, ip: String) -> Res<AddBulbOutcome> {
    state.manager.add_bulb_by_ip(ip).await
}

#[tauri::command]
pub async fn add_custom_color(
    state: State<'_, AppState>,
    color_name: String,
    color_hex: String,
) -> Res<()> {
    state.manager.add_custom_color(color_name, color_hex).await
}

#[tauri::command]
pub async fn edit_custom_color(
    state: State<'_, AppState>,
    color_id: u32,
    color_name: String,
    color_hex: String,
) -> Res<()> {
    state.manager.edit_custom_color(color_id, color_name, color_hex).await
}

#[tauri::command]
pub async fn remove_custom_color(state: State<'_, AppState>, color_id: u32) -> Res<()> {
    state.manager.remove_custom_color(color_id).await
}

#[tauri::command]
pub async fn toggle_favorite_color(state: State<'_, AppState>, color_id: u32) -> Res<()> {
    state.manager.toggle_favorite_color(color_id).await
}

#[tauri::command]
pub async fn set_favorite_colors_order(
    state: State<'_, AppState>,
    favorite_colors: Vec<u32>,
) -> Res<()> {
    state.manager.set_favorite_colors_order(favorite_colors).await
}

#[tauri::command]
pub async fn retry_discovery(state: State<'_, AppState>) -> Res<()> {
    state.manager.retry_discovery().await
}

#[tauri::command]
pub async fn delete_profile(state: State<'_, AppState>) -> Res<()> {
    state.manager.delete_profile().await
}

#[tauri::command]
pub fn get_language(state: State<'_, AppState>) -> String {
    state.language.to_owned()
}

#[tauri::command]
pub fn show_window(app: AppHandle) -> Res<()> {
    crate::show_main_window(&app);
    Ok(())
}

/// Opens the folder holding `config.json` and `wiz-app.log`.
#[tauri::command]
pub fn open_app_folder(app: AppHandle, state: State<'_, AppState>) -> Res<()> {
    let io = |e: &dyn std::fmt::Display| AppError::Io { message: e.to_string() };
    std::fs::create_dir_all(&state.data_dir).map_err(|e| io(&e))?;
    app.opener().open_path(state.data_dir.to_string_lossy(), None::<&str>).map_err(|e| io(&e))
}

/// Windows "Installed apps" settings page (used for the old-install notice).
#[tauri::command]
pub fn open_apps_settings(app: AppHandle) -> Res<()> {
    app.opener()
        .open_url("ms-settings:appsfeatures", None::<&str>)
        .map_err(|e| AppError::Io { message: e.to_string() })
}

/// Whether the Electron-era install is still registered (help dialog notice).
#[tauri::command]
pub fn has_legacy_install() -> bool {
    crate::legacy::find_legacy_install().is_some()
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Res<bool> {
    crate::updater::check_for_updates(&app).await
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Res<()> {
    crate::updater::install_update(&app).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::ToastKind;

    fn toast(n: u32) -> ToastMessage {
        ToastMessage {
            id: n.to_string(),
            message: "toast.x".into(),
            kind: ToastKind::Info,
            auto_dismiss: true,
            retry_action: None,
        }
    }

    #[test]
    fn toasts_wait_for_the_renderer_and_keep_order() {
        let gate = ToastGate::default();
        assert!(gate.push(toast(1)).is_none());
        assert!(gate.push(toast(2)).is_none());

        let flushed = gate.open();
        assert_eq!(flushed.iter().map(|t| t.id.as_str()).collect::<Vec<_>>(), ["1", "2"]);

        // Once open, toasts pass straight through and nothing is queued.
        assert_eq!(gate.push(toast(3)).map(|t| t.id), Some("3".to_owned()));
        assert!(gate.open().is_empty());
    }
}
