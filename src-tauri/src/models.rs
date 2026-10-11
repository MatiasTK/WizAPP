use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Scene IDs below this are built-in WiZ scenes; IDs at or above are user colors.
pub const MAX_DEFAULT_COLORS: u32 = 33;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct CustomColor {
    pub id: u32,
    pub name: String,
    pub hex: String,
}

/// What the renderer sees for one bulb. `online: false` entries carry the last known
/// pilot values (defaults if the bulb never answered this session).
#[derive(Debug, Clone, PartialEq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct BulbState {
    pub mac: String,
    pub rssi: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub src: Option<String>,
    pub state: bool,
    pub scene_id: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub temp: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub speed: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub r: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub g: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub b: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub c: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub w: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub dimming: Option<u32>,
    #[ts(type = "number")]
    pub home_id: u64,
    #[ts(type = "number")]
    pub room_id: u64,
    pub rgn: String,
    pub module_name: String,
    pub fw_version: String,
    #[ts(type = "number")]
    pub group_id: u64,
    pub ping: u32,
    pub ip: String,
    pub port: u16,
    pub name: String,
    pub online: bool,
    pub custom_colors: Vec<CustomColor>,
    pub favorite_colors: Vec<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct MultiBulbState {
    pub bulbs: Vec<BulbState>,
    pub active_bulb: Option<BulbState>,
    pub is_discovering: bool,
    pub discovery_failed: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(export)]
pub enum ToastKind {
    Success,
    Error,
    Info,
}

/// What the button on a pinned toast does.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export)]
pub enum RetryAction {
    RetryDiscovery,
    InstallUpdate,
    OpenAppsSettings,
}

/// `message` is an i18n key; the renderer translates it.
#[derive(Debug, Clone, PartialEq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct ToastMessage {
    pub id: String,
    pub message: String,
    #[serde(rename = "type")]
    pub kind: ToastKind,
    pub auto_dismiss: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub retry_action: Option<RetryAction>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum AddBulbOutcome {
    Added,
    Duplicate,
}
