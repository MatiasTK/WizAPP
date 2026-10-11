//! `#[tauri::command]` layer. Everything here only translates arguments into a call on
//! the [`ManagerHandle`]; the logic lives in `manager`.

use tauri::{AppHandle, Emitter, State};
use tauri_plugin_opener::OpenerExt;

use crate::error::AppError;
use crate::manager::{Frontend, ManagerHandle};
use crate::models::{AddBulbOutcome, MultiBulbState, ToastMessage};

pub struct AppState {
    pub manager: ManagerHandle,
    /// Folder with `config.json` and `wiz-app.log`.
    pub data_dir: std::path::PathBuf,
    pub language: &'static str,
}

/// Pushes manager output to the webview as events.
pub struct TauriFrontend(pub AppHandle);

impl Frontend for TauriFrontend {
    fn state(&self, state: &MultiBulbState) {
        if let Err(e) = self.0.emit("on-update-bulb", state) {
            log::warn!("could not emit on-update-bulb: {e}");
        }
    }

    fn toast(&self, toast: ToastMessage) {
        if let Err(e) = self.0.emit("on-show-toast", toast) {
            log::warn!("could not emit on-show-toast: {e}");
        }
    }
}

type Res<T> = Result<T, AppError>;

#[tauri::command]
pub async fn get_bulbs(state: State<'_, AppState>) -> Res<MultiBulbState> {
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

// Wired up for real in M6 (updater).
#[tauri::command]
pub async fn check_for_updates() -> Res<bool> {
    Ok(false)
}

#[tauri::command]
pub async fn install_update() -> Res<()> {
    Err(AppError::Updater { message: "updater not configured yet".into() })
}
