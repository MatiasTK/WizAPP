//! System tray: show window, toggle the active bulb, all on/off, favorite scenes, quit.
//! Closing the window only hides it, so "quit" here is the one way out. The menu is
//! rebuilt when the favorites or the language change.

use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Wry};
use uuid::Uuid;

use crate::commands::AppState;
use crate::error::AppError;
use crate::i18n;
use crate::models::{ToastKind, ToastMessage, MAX_DEFAULT_COLORS};

const TRAY_ID: &str = "main";
const ID_SHOW: &str = "show";
const ID_TOGGLE: &str = "toggle";
const ID_ALL_ON: &str = "all-on";
const ID_ALL_OFF: &str = "all-off";
const ID_QUIT: &str = "quit";
const FAVORITE_PREFIX: &str = "fav:";

/// Favorites shown in the tray menu (the menu would get unwieldy past this).
pub const MAX_TRAY_FAVORITES: usize = 8;

/// One favorite as shown in the tray: scene or custom color id plus its display name.
pub type TrayFavorite = (u32, String);

/// i18n key of the toast for a failed command, e.g. `toast.error.bulbOffline`.
pub fn error_toast_key(error: &AppError) -> String {
    let code = serde_json::to_value(error)
        .ok()
        .and_then(|v| v.get("code").and_then(|c| c.as_str().map(str::to_owned)))
        .unwrap_or_else(|| "io".to_owned());
    format!("toast.error.{code}")
}

fn build_menu(
    app: &AppHandle,
    language: &str,
    favorites: &[TrayFavorite],
) -> tauri::Result<Menu<Wry>> {
    let labels = i18n::tray_labels(language);
    let show = MenuItem::with_id(app, ID_SHOW, &labels.show, true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, ID_TOGGLE, &labels.toggle, true, None::<&str>)?;
    let all_on = MenuItem::with_id(app, ID_ALL_ON, &labels.all_on, true, None::<&str>)?;
    let all_off = MenuItem::with_id(app, ID_ALL_OFF, &labels.all_off, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, ID_QUIT, &labels.quit, true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let separator_favorites = PredefinedMenuItem::separator(app)?;
    let separator_quit = PredefinedMenuItem::separator(app)?;

    let favorite_items = favorites
        .iter()
        .take(MAX_TRAY_FAVORITES)
        .map(|(id, name)| {
            MenuItem::with_id(app, format!("{FAVORITE_PREFIX}{id}"), name, true, None::<&str>)
        })
        .collect::<tauri::Result<Vec<_>>>()?;

    let mut items: Vec<&dyn IsMenuItem<Wry>> = vec![&show, &separator, &toggle, &all_on, &all_off];
    if !favorite_items.is_empty() {
        items.push(&separator_favorites);
        items.extend(favorite_items.iter().map(|i| i as &dyn IsMenuItem<Wry>));
    }
    items.push(&separator_quit);
    items.push(&quit);
    Menu::with_items(app, &items)
}

pub fn setup(app: &AppHandle, language: &str) -> tauri::Result<()> {
    let menu = build_menu(app, language, &[])?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("WiZ APP")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            match id {
                ID_SHOW => crate::restore_main_window(app),
                ID_TOGGLE => run(app, Action::Toggle),
                ID_ALL_ON => run(app, Action::All(true)),
                ID_ALL_OFF => run(app, Action::All(false)),
                ID_QUIT => app.exit(0),
                _ => {
                    if let Some(favorite) =
                        id.strip_prefix(FAVORITE_PREFIX).and_then(|n| n.parse::<u32>().ok())
                    {
                        run(app, Action::Favorite(favorite));
                    }
                }
            }
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

/// Replaces the tray menu (favorites or language changed).
pub fn rebuild(app: &AppHandle, language: &str, favorites: &[TrayFavorite]) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
    match build_menu(app, language, favorites) {
        Ok(menu) => {
            if let Err(e) = tray.set_menu(Some(menu)) {
                log::warn!("could not update the tray menu: {e}");
            }
        }
        Err(e) => log::warn!("could not build the tray menu: {e}"),
    }
}

enum Action {
    Toggle,
    All(bool),
    Favorite(u32),
}

/// Nobody awaits a tray click, so a failure is reported with a toast (the window may
/// be hidden; the toast is there when it comes back).
fn run(app: &AppHandle, action: Action) {
    let Some(state) = app.try_state::<AppState>() else { return };
    let manager = state.manager.clone();
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let result = match action {
            Action::Toggle => manager.toggle_bulb().await,
            Action::All(on) => manager.set_all(on).await.map(|failed| {
                if !failed.is_empty() {
                    log::warn!("{} bulb(s) did not respond: {failed:?}", failed.len());
                }
            }),
            Action::Favorite(id) if id < MAX_DEFAULT_COLORS => manager.set_scene(None, id).await,
            Action::Favorite(id) => manager.set_custom_color(None, id).await,
        };
        if let Err(e) = result {
            log::warn!("tray action failed: {e}");
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
