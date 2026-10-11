//! `#[tauri::command]` layer. Everything here only translates arguments into a call on
//! the [`ManagerHandle`]; the logic lives in `manager`.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};
use tauri_plugin_opener::OpenerExt;

use crate::error::AppError;
use crate::manager::{Frontend, ManagerHandle};
use crate::models::{AddBulbOutcome, MultiBulbState, Settings, ToastMessage, MAX_DEFAULT_COLORS};
use crate::tray::{self, TrayFavorite};

pub struct AppState {
    pub manager: ManagerHandle,
    pub frontend: std::sync::Arc<TauriFrontend>,
    /// Folder with `config.json` and `wiz-app.log`.
    pub data_dir: std::path::PathBuf,
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
    /// UI language as resolved from the stored preference (tray labels, `get_language`).
    language: Mutex<&'static str>,
    /// What the tray menu currently shows, so it is only rebuilt when that changes.
    tray_favorites: Mutex<Vec<TrayFavorite>>,
}

impl TauriFrontend {
    pub fn new(app: AppHandle, language: &'static str) -> Self {
        Self {
            app,
            gate: ToastGate::default(),
            language: Mutex::new(language),
            tray_favorites: Mutex::new(Vec::new()),
        }
    }

    pub fn language(&self) -> &'static str {
        *self.language.lock().unwrap()
    }

    /// Switches the language of the tray menu.
    pub fn set_language(&self, language: &'static str) {
        *self.language.lock().unwrap() = language;
        let favorites = self.tray_favorites.lock().unwrap().clone();
        tray::rebuild(&self.app, language, &favorites);
    }

    /// Favorites in order, named in the current language. Custom colors come from the
    /// state itself; ids that resolve to nothing are left out.
    fn favorites_of(&self, state: &MultiBulbState) -> Vec<TrayFavorite> {
        let language = self.language();
        let Some(reference) = state.active_bulb.as_ref().or_else(|| state.bulbs.first()) else {
            return Vec::new();
        };
        reference
            .favorite_colors
            .iter()
            .filter_map(|id| {
                let name = if *id < MAX_DEFAULT_COLORS {
                    crate::i18n::scene_name(language, *id)
                } else {
                    reference.custom_colors.iter().find(|c| c.id == *id).map(|c| c.name.clone())
                };
                name.map(|n| (*id, n))
            })
            .take(tray::MAX_TRAY_FAVORITES)
            .collect()
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
        let favorites = self.favorites_of(state);
        let mut shown = self.tray_favorites.lock().unwrap();
        if *shown != favorites {
            tray::rebuild(&self.app, self.language(), &favorites);
            *shown = favorites;
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

/// `ip: None` acts on the active bulb.
#[tauri::command]
pub async fn set_brightness(
    state: State<'_, AppState>,
    brightness: u32,
    ip: Option<String>,
) -> Res<()> {
    state.manager.set_brightness(ip, brightness).await
}

#[tauri::command]
pub async fn set_scene(state: State<'_, AppState>, scene_id: u32, ip: Option<String>) -> Res<()> {
    state.manager.set_scene(ip, scene_id).await
}

#[tauri::command]
pub async fn set_custom_color(
    state: State<'_, AppState>,
    color_id: u32,
    ip: Option<String>,
) -> Res<()> {
    state.manager.set_custom_color(ip, color_id).await
}

/// Powers every bulb on or off. Returns the IPs that did not respond.
#[tauri::command]
pub async fn set_all_bulbs(state: State<'_, AppState>, on: bool) -> Res<Vec<String>> {
    state.manager.set_all(on).await
}

/// Applies a scene (`id < 33`) or custom color to every bulb. Returns the IPs that failed.
#[tauri::command]
pub async fn apply_to_all(state: State<'_, AppState>, id: u32) -> Res<Vec<String>> {
    state.manager.apply_all(id).await
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
pub async fn set_bulbs_order(state: State<'_, AppState>, ips: Vec<String>) -> Res<()> {
    state.manager.set_bulb_order(ips).await
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

/// The UI language: the stored preference, or the system one when it is automatic.
#[tauri::command]
pub fn get_language(state: State<'_, AppState>) -> String {
    state.frontend.language().to_owned()
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Res<Settings> {
    state.manager.get_settings().await
}

/// Saves theme and language; the tray follows the language right away.
#[tauri::command]
pub async fn set_settings(state: State<'_, AppState>, settings: Settings) -> Res<()> {
    state.manager.set_settings(settings).await?;
    state.frontend.set_language(crate::i18n::resolve_language(settings.language));
    Ok(())
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
