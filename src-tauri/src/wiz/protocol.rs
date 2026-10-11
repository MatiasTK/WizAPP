//! Wire types. Deserialization is lenient on purpose: firmwares add and omit fields.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::WizError;

/// `result` of `getPilot`.
#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Pilot {
    pub mac: Option<String>,
    pub rssi: Option<i32>,
    pub src: Option<String>,
    pub state: Option<bool>,
    pub scene_id: Option<u32>,
    pub dimming: Option<u32>,
    pub speed: Option<u32>,
    pub temp: Option<u32>,
    pub r: Option<u8>,
    pub g: Option<u8>,
    pub b: Option<u8>,
    pub c: Option<u8>,
    pub w: Option<u8>,
}

/// `result` of `getSystemConfig`.
#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SystemConfig {
    pub mac: Option<String>,
    pub module_name: Option<String>,
    pub fw_version: Option<String>,
    pub home_id: Option<u64>,
    pub room_id: Option<u64>,
    pub rgn: Option<String>,
    pub group_id: Option<u64>,
}

/// `params` of `setPilot`; only the set fields are sent.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PilotPatch {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scene_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dimming: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speed: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temp: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub g: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b: Option<u8>,
}

impl PilotPatch {
    pub fn state(on: bool) -> Self {
        Self { state: Some(on), ..Default::default() }
    }

    pub fn dimming(percent: u32) -> Self {
        Self { dimming: Some(percent), ..Default::default() }
    }

    pub fn scene(scene_id: u32) -> Self {
        Self { scene_id: Some(scene_id), ..Default::default() }
    }

    pub fn rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r: Some(r), g: Some(g), b: Some(b), ..Default::default() }
    }

    /// `#rrggbb` or `rrggbb`.
    pub fn from_hex(hex: &str) -> Result<Self, WizError> {
        let h = hex.strip_prefix('#').unwrap_or(hex);
        if h.len() != 6 || !h.is_ascii() {
            return Err(WizError::InvalidArgument("hex"));
        }
        let byte = |i: usize| {
            u8::from_str_radix(&h[i..i + 2], 16).map_err(|_| WizError::InvalidArgument("hex"))
        };
        Ok(Self::rgb(byte(0)?, byte(2)?, byte(4)?))
    }

    pub fn validate(&self) -> Result<(), WizError> {
        let in_range = |v: Option<u32>, lo: u32, hi: u32| v.is_none_or(|v| (lo..=hi).contains(&v));
        if !in_range(self.scene_id, 1, 32) {
            return Err(WizError::InvalidArgument("sceneId"));
        }
        if !in_range(self.dimming, 0, 100) {
            return Err(WizError::InvalidArgument("dimming"));
        }
        if !in_range(self.speed, 1, 100) {
            return Err(WizError::InvalidArgument("speed"));
        }
        if !in_range(self.temp, 1000, 10_000) {
            return Err(WizError::InvalidArgument("temp"));
        }
        Ok(())
    }
}

/// Anything a bulb sends back; `method` is used to pair replies with requests.
#[derive(Debug, Deserialize)]
pub struct Envelope {
    pub method: Option<String>,
    pub result: Option<Value>,
    pub error: Option<Value>,
}

impl Envelope {
    pub fn parse(bytes: &[u8]) -> Option<Self> {
        serde_json::from_slice(bytes).ok()
    }

    pub fn error_message(&self) -> Option<String> {
        self.error.as_ref().map(|e| {
            e.get("message").and_then(Value::as_str).map_or_else(|| e.to_string(), str::to_owned)
        })
    }
}

#[derive(Debug, Deserialize)]
#[serde(default)]
pub struct SetPilotResult {
    pub success: bool,
}

impl Default for SetPilotResult {
    fn default() -> Self {
        Self { success: true }
    }
}
