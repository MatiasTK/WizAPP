pub mod commands;
pub mod config;
pub mod error;
pub mod i18n;
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
use config::{legacy_dirs_for, ConfigStore};
use manager::{ManagerHandle, ManagerOptions};

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

            let frontend = Arc::new(TauriFrontend(app.handle().clone()));
            let (manager, actor) =
                ManagerHandle::build(frontend, store, outcome, ManagerOptions::default());
            tauri::async_runtime::spawn(actor.run());
            let language = i18n::system_language();
            app.manage(AppState { manager, data_dir: dir.clone(), language });
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
            commands::retry_discovery,
            commands::delete_profile,
            commands::get_language,
            commands::show_window,
            commands::open_app_folder,
            commands::open_apps_settings,
            commands::check_for_updates,
            commands::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running WiZ APP");
}
