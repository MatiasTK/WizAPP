use serde::Serialize;
use ts_rs::TS;

use crate::wiz::WizError;

/// Error returned by every command. Serialized as `{ "code": "bulbOffline", "ip": "..." }`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS, thiserror::Error)]
#[serde(tag = "code", rename_all = "camelCase")]
#[ts(export)]
pub enum AppError {
    /// Timed out or unreachable after one retry; the bulb is now shown as offline.
    #[error("bulb {ip} is offline")]
    BulbOffline { ip: String },
    /// The bulb answered with an error; it stays online.
    #[error("bulb {ip} rejected the request")]
    BulbRejected { ip: String },
    #[error("no bulb with ip {ip}")]
    UnknownBulb { ip: String },
    /// Could not reach a bulb that was being added.
    #[error("could not reach {ip}")]
    BulbUnreachable { ip: String },
    #[error("invalid argument: {field}")]
    InvalidArgument { field: String },
    #[error("io error: {message}")]
    Io { message: String },
    #[error("updater error: {message}")]
    Updater { message: String },
}

impl AppError {
    pub fn from_wiz(e: WizError, ip: &str) -> Self {
        let ip = ip.to_owned();
        match e {
            WizError::Timeout | WizError::Unreachable => AppError::BulbOffline { ip },
            WizError::Rejected(_) | WizError::Malformed(_) => AppError::BulbRejected { ip },
            WizError::InvalidArgument(field) => AppError::InvalidArgument { field: field.into() },
            WizError::Io(message) => AppError::Io { message },
        }
    }

    pub fn invalid(field: &str) -> Self {
        AppError::InvalidArgument { field: field.into() }
    }
}
