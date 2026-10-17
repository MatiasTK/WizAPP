//! Local-network UDP client for WiZ bulbs.

pub mod client;
pub mod discovery;
pub mod netif;
pub mod protocol;
#[cfg(test)]
pub mod testing;

use std::time::Duration;

pub use client::BulbClient;
pub use protocol::{Pilot, PilotPatch, SystemConfig};

pub const WIZ_PORT: u16 = 38899;

/// Where bulbs listen. Tests override the port with an ephemeral one.
#[derive(Debug, Clone, Copy)]
pub struct WizNet {
    pub port: u16,
}

impl Default for WizNet {
    fn default() -> Self {
        Self { port: WIZ_PORT }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Timings {
    /// How long to wait for the reply to a single request.
    pub response: Duration,
    /// How long a discovery round listens for replies.
    pub discover_wait: Duration,
    /// Pause between discovery attempts.
    pub retry_delay: Duration,
    /// Discovery attempts per phase.
    pub attempts: u32,
}

impl Default for Timings {
    fn default() -> Self {
        Self {
            response: Duration::from_millis(2000),
            discover_wait: Duration::from_millis(5000),
            retry_delay: Duration::from_millis(5000),
            attempts: 3,
        }
    }
}

#[derive(Debug, thiserror::Error, Clone, PartialEq, Eq)]
pub enum WizError {
    /// No matching reply before the deadline.
    #[error("timed out waiting for the bulb")]
    Timeout,
    /// The destination answered with ICMP port unreachable (WSAECONNRESET on Windows).
    #[error("bulb unreachable")]
    Unreachable,
    /// The bulb replied with an `error` object or `success: false`.
    #[error("bulb rejected the request: {0}")]
    Rejected(String),
    /// A reply matched the method but not the expected shape.
    #[error("malformed reply: {0}")]
    Malformed(String),
    #[error("invalid argument: {0}")]
    InvalidArgument(&'static str),
    #[error("io error: {0}")]
    Io(String),
}

impl WizError {
    pub(crate) fn from_io(e: &std::io::Error) -> Self {
        use std::io::ErrorKind::{ConnectionRefused, ConnectionReset};
        match e.kind() {
            ConnectionReset | ConnectionRefused => WizError::Unreachable,
            _ => WizError::Io(e.to_string()),
        }
    }
}

#[cfg(test)]
mod tests;
