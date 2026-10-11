pub mod commands;
pub mod config;
pub mod error;
pub mod i18n;
pub mod legacy;
pub mod manager;
pub mod models;
pub mod tray;
pub mod updater;
pub mod wiz;

use std::sync::Arc;
use std::time::Duration;

use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_log::{Target, TargetKind};

use commands::{AppState, TauriFrontend};
use config::{legacy_dirs_for, ConfigStore, LoadOutcome};
use manager::Frontend;
use manager::{ManagerHandle, ManagerOptions};
use models::{RetryAction, ToastKind, ToastMessage};
use uuid::Uuid;

pub const MAIN_WINDOW: &str = "main";

/// Shows, un-minimizes and focuses the main window.
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Brings the window back (tray, second instance) and re-polls the bulbs, since their
/// state may have changed while the app was hidden.
pub fn restore_main_window(app: &AppHandle) {
    show_main_window(app);
    if let Some(state) = app.try_state::<AppState>() {
        state.manager.refresh_all();
    }
}

pub fn run() {
    tauri::Builder::default()
        // Must be the first plugin.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            restore_main_window(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .on_window_event(|window, event| {
            // The X hides to the tray; quitting is only available from the tray menu.
            if window.label() == MAIN_WINDOW {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            // Debug builds can point at a scratch directory (end-to-end tests).
            let dir = match std::env::var_os("WIZAPP_DATA_DIR").filter(|_| cfg!(debug_assertions)) {
                Some(custom) => std::path::PathBuf::from(custom),
                None => app.path().app_config_dir()?,
            };
            std::fs::create_dir_all(&dir)?;

            // Logs go next to config.json so "open app folder" shows both.
            let level = if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            };
            app.handle().plugin(
                tauri_plugin_log::Builder::new()
                    .level(level)
                    .clear_targets()
                    .target(Target::new(TargetKind::Stdout))
                    .target(Target::new(TargetKind::Folder {
                        path: dir.clone(),
                        file_name: Some("wiz-app".into()),
                    }))
                    .build(),
            )?;

            let (store, outcome) = ConfigStore::load(&dir, &legacy_dirs_for(&dir));
            log::info!("config loaded from {}: {outcome:?}", store.path().display());

            // First run (new or imported config): mention a still-installed Electron app.
            let first_run = matches!(outcome, LoadOutcome::Created | LoadOutcome::Imported { .. });
            let language = i18n::resolve_language(store.config().language);
            let frontend = Arc::new(TauriFrontend::new(app.handle().clone(), language));
            if first_run && legacy::find_legacy_install().is_some() {
                frontend.toast(ToastMessage {
                    id: Uuid::new_v4().to_string(),
                    message: "toast.legacyInstallFound".to_owned(),
                    kind: ToastKind::Info,
                    auto_dismiss: false,
                    retry_action: Some(RetryAction::OpenAppsSettings),
                });
            }
            let (manager, actor) =
                ManagerHandle::build(frontend.clone(), store, outcome, ManagerOptions::default());
            tauri::async_runtime::spawn(actor.run());
            app.manage(AppState { manager, frontend, data_dir: dir.clone() });
            tray::setup(app.handle(), language)?;
            tauri::async_runtime::spawn(updater::check_on_startup(app.handle().clone()));

            // The window starts hidden and the renderer shows it once it painted. If the JS
            // never gets there, show it anyway instead of leaving an invisible app.
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(Duration::from_secs(5)).await;
                let hidden = handle
                    .get_webview_window(MAIN_WINDOW)
                    .and_then(|w| w.is_visible().ok())
                    .is_some_and(|visible| !visible);
                if hidden {
                    log::warn!("renderer did not show the window in 5 s; showing it");
                    show_main_window(&handle);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_bulbs,
            commands::toggle_bulb,
            commands::toggle_bulb_by_ip,
            commands::set_brightness,
            commands::set_scene,
            commands::set_custom_color,
            commands::set_all_bulbs,
            commands::apply_to_all,
            commands::get_settings,
            commands::set_settings,
            commands::set_bulb_name,
            commands::set_active_bulb,
            commands::delete_bulb,
            commands::probe_bulb,
            commands::add_bulb_by_ip,
            commands::add_custom_color,
            commands::edit_custom_color,
            commands::remove_custom_color,
            commands::toggle_favorite_color,
            commands::set_favorite_colors_order,
            commands::set_bulbs_order,
            commands::retry_discovery,
            commands::delete_profile,
            commands::get_language,
            commands::show_window,
            commands::open_app_folder,
            commands::open_apps_settings,
            commands::has_legacy_install,
            commands::check_for_updates,
            commands::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running WiZ APP");
}
