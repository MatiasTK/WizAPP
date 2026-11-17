use std::net::{Ipv4Addr, SocketAddr};
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use tokio::net::UdpSocket;
use tokio::time::{timeout, Instant};

use super::protocol::{Envelope, Pilot, PilotPatch, SetPilotResult, SystemConfig};
use super::{Timings, WizError, WizNet};

/// One connected UDP socket per bulb. Requests are serialized by `&mut self`.
pub struct BulbClient {
    sock: UdpSocket,
    ip: Ipv4Addr,
    response_timeout: Duration,
}

impl BulbClient {
    pub async fn connect(ip: Ipv4Addr, net: WizNet, timings: Timings) -> Result<Self, WizError> {
        let sock = UdpSocket::bind("0.0.0.0:0").await.map_err(|e| WizError::from_io(&e))?;
        sock.connect(SocketAddr::from((ip, net.port))).await.map_err(|e| WizError::from_io(&e))?;
        Ok(Self { sock, ip, response_timeout: timings.response })
    }

    pub fn ip(&self) -> Ipv4Addr {
        self.ip
    }

    pub async fn get_pilot(&mut self) -> Result<Pilot, WizError> {
        self.request("getPilot", json!({})).await
    }

    pub async fn get_system_config(&mut self) -> Result<SystemConfig, WizError> {
        self.request("getSystemConfig", json!({})).await
    }

    pub async fn set_pilot(&mut self, patch: &PilotPatch) -> Result<(), WizError> {
        patch.validate()?;
        let params = serde_json::to_value(patch).map_err(|e| WizError::Malformed(e.to_string()))?;
        let res: SetPilotResult = self.request("setPilot", params).await?;
        if res.success {
            Ok(())
        } else {
            Err(WizError::Rejected("success: false".into()))
        }
    }

    async fn request<T: DeserializeOwned>(
        &mut self,
        method: &str,
        params: Value,
    ) -> Result<T, WizError> {
        self.drain();
        let msg = json!({ "method": method, "params": params }).to_string();
        self.sock.send(msg.as_bytes()).await.map_err(|e| WizError::from_io(&e))?;

        let deadline = Instant::now() + self.response_timeout;
        let mut buf = [0u8; 2048];
        loop {
            let remaining = deadline.saturating_duration_since(Instant::now());
            let n = match timeout(remaining, self.sock.recv(&mut buf)).await {
                Err(_) => return Err(WizError::Timeout),
                Ok(Err(e)) => return Err(WizError::from_io(&e)),
                Ok(Ok(n)) => n,
            };
            // Invalid JSON and replies to other methods are ignored until the deadline.
            let Some(env) = Envelope::parse(&buf[..n]) else { continue };
            if env.method.as_deref() != Some(method) {
                continue;
            }
            if let Some(message) = env.error_message() {
                return Err(WizError::Rejected(message));
            }
            let result = env.result.ok_or_else(|| WizError::Malformed("missing result".into()))?;
            return serde_json::from_value(result).map_err(|e| WizError::Malformed(e.to_string()));
        }
    }

    /// Drops datagrams (and queued ICMP errors) left over from earlier requests.
    fn drain(&self) {
        let mut buf = [0u8; 2048];
        loop {
            match self.sock.try_recv(&mut buf) {
                Ok(_) => {}
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                // A queued ICMP error from a previous send: consume it and keep draining.
                Err(e) if WizError::from_io(&e) == WizError::Unreachable => {}
                Err(_) => break,
            }
        }
    }
}
