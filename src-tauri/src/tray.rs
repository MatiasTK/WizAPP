//! System tray: show window, toggle the active bulb, quit. Closing the window only
//! hides it, so "quit" here is the one way out.

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

use crate::commands::AppState;
use crate::error::AppError;
use crate::i18n;
use crate::models::{ToastKind, ToastMessage};

const ID_SHOW: &str = "show";
const ID_TOGGLE: &str = "toggle";
const ID_QUIT: &str = "quit";

/// i18n key of the toast for a failed command, e.g. `toast.error.bulbOffline`.
pub fn error_toast_key(error: &AppError) -> String {
    let code = serde_json::to_value(error)
        .ok()
        .and_then(|v| v.get("code").and_then(|c| c.as_str().map(str::to_owned)))
        .unwrap_or_else(|| "io".to_owned());
    format!("toast.error.{code}")
}

pub fn setup(app: &AppHandle, language: &str) -> tauri::Result<()> {
    let labels = i18n::tray_labels(language);
    let show = MenuItem::with_id(app, ID_SHOW, &labels.show, true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, ID_TOGGLE, &labels.toggle, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, ID_QUIT, &labels.quit, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &toggle, &quit])?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("WiZ APP")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            ID_SHOW => crate::restore_main_window(app),
            ID_TOGGLE => toggle_active_bulb(app),
            ID_QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                crate::restore_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

/// Nobody awaits a tray click, so a failure is reported with a toast (the window may
/// be hidden; the toast is there when it comes back).
fn toggle_active_bulb(app: &AppHandle) {
    let Some(state) = app.try_state::<AppState>() else { return };
    let manager = state.manager.clone();
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = manager.toggle_bulb().await {
            log::warn!("tray toggle failed: {e}");
            let _ = app.emit(
                "on-show-toast",
                ToastMessage {
                    id: Uuid::new_v4().to_string(),
                    message: error_toast_key(&e),
                    kind: ToastKind::Error,
                    auto_dismiss: true,
                    retry_action: None,
                },
            );
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn toast_key_uses_the_error_code() {
        assert_eq!(
            error_toast_key(&AppError::BulbOffline { ip: "1.2.3.4".into() }),
            "toast.error.bulbOffline"
        );
        assert_eq!(
            error_toast_key(&AppError::UnknownBulb { ip: String::new() }),
            "toast.error.unknownBulb"
        );
        assert_eq!(
            error_toast_key(&AppError::InvalidArgument { field: "x".into() }),
            "toast.error.invalidArgument"
        );
    }
}
