//! Auto-update through GitHub releases. Never closes the app on its own: the user
//! chooses "update now" from a pinned toast, then the installer runs.

use std::time::Duration;

use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::{Update, UpdaterExt};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::{RetryAction, ToastKind, ToastMessage};

fn updater_error(e: impl std::fmt::Display) -> AppError {
    AppError::Updater { message: e.to_string() }
}

async fn find_update(app: &AppHandle) -> Result<Option<Update>, AppError> {
    app.updater().map_err(updater_error)?.check().await.map_err(updater_error)
}

fn announce(app: &AppHandle, version: &str) {
    log::info!("update {version} is available");
    let toast = ToastMessage {
        id: Uuid::new_v4().to_string(),
        message: "toast.updateAvailable".to_owned(),
        kind: ToastKind::Info,
        auto_dismiss: false,
        retry_action: Some(RetryAction::InstallUpdate),
    };
    if let Err(e) = app.emit("on-show-toast", toast) {
        log::warn!("could not emit the update toast: {e}");
    }
}

/// Checked once after startup, release builds only. Failures are logged, not shown:
/// being offline is normal and nobody asked for this check.
pub async fn check_on_startup(app: AppHandle) {
    if cfg!(debug_assertions) {
        return;
    }
    // Let the renderer subscribe to events first.
    tokio::time::sleep(Duration::from_secs(8)).await;
    match find_update(&app).await {
        Ok(Some(update)) => announce(&app, &update.version),
        Ok(None) => log::info!("no update available"),
        Err(e) => log::warn!("startup update check failed: {e}"),
    }
}

/// Manual check from the help dialog. `true` also pins the same toast.
pub async fn check_for_updates(app: &AppHandle) -> Result<bool, AppError> {
    match find_update(app).await? {
        Some(update) => {
            announce(app, &update.version);
            Ok(true)
        }
        None => Ok(false),
    }
}

/// Downloads, verifies the signature and runs the installer. On Windows the process
/// exits once the installer takes over, so success normally never returns.
pub async fn install_update(app: &AppHandle) -> Result<(), AppError> {
    let update = find_update(app)
        .await?
        .ok_or_else(|| AppError::Updater { message: "no update available".into() })?;
    log::info!("installing update {}", update.version);
    update.download_and_install(|_, _| {}, || {}).await.map_err(updater_error)?;
    app.restart()
}
