use serde::{Deserialize, Serialize};

/// Scene IDs below this are built-in WiZ scenes; IDs at or above are user colors.
pub const MAX_DEFAULT_COLORS: u32 = 33;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomColor {
    pub id: u32,
    pub name: String,
    pub hex: String,
}
