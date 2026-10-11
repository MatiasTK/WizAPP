//! In-process fake bulb for tests (also used by the manager tests).

use std::collections::HashMap;
use std::net::{Ipv4Addr, SocketAddr};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde_json::{json, Value};
use tokio::net::UdpSocket;
use tokio::task::JoinHandle;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Behavior {
    Normal,
    /// Receives but never answers.
    Silent,
    /// Answers every request with an `error` object.
    Reject,
    /// Answers with bytes that are not JSON.
    Garbage,
}

#[derive(Debug, Clone)]
pub struct FakeState {
    pub mac: String,
    pub module_name: String,
    pub on: bool,
    pub dimming: u32,
    pub scene_id: u32,
    pub behavior: Behavior,
    /// Per-method reply delay.
    pub delays: HashMap<String, Duration>,
    /// Adds unknown fields to every `result`.
    pub extra_fields: bool,
    /// Only `mac` and `state` in `getPilot`.
    pub minimal: bool,
    /// Sends every reply twice.
    pub duplicate_replies: bool,
    /// Methods received, in arrival order.
    pub received: Vec<String>,
}

pub struct FakeBulb {
    pub addr: SocketAddr,
    state: Arc<Mutex<FakeState>>,
    task: JoinHandle<()>,
}

impl FakeBulb {
    /// Binds `127.0.0.1` on an ephemeral port.
    pub async fn start(mac: &str) -> Self {
        Self::start_on(Ipv4Addr::LOCALHOST, 0, mac).await
    }

    pub async fn start_on(ip: Ipv4Addr, port: u16, mac: &str) -> Self {
        let sock = Arc::new(UdpSocket::bind((ip, port)).await.expect("bind fake bulb"));
        let addr = sock.local_addr().unwrap();
        let state = Arc::new(Mutex::new(FakeState {
            mac: mac.to_lowercase(),
            module_name: "ESP01_SHRGB_03".into(),
            on: true,
            dimming: 80,
            scene_id: 0,
            behavior: Behavior::Normal,
            delays: HashMap::new(),
            extra_fields: false,
            minimal: false,
            duplicate_replies: false,
            received: Vec::new(),
        }));
        let task = tokio::spawn(serve(sock, state.clone()));
        Self { addr, state, task }
    }

    pub fn ip(&self) -> Ipv4Addr {
        match self.addr.ip() {
            std::net::IpAddr::V4(ip) => ip,
            std::net::IpAddr::V6(_) => unreachable!(),
        }
    }

    pub fn port(&self) -> u16 {
        self.addr.port()
    }

    pub fn with<R>(&self, f: impl FnOnce(&mut FakeState) -> R) -> R {
        f(&mut self.state.lock().unwrap())
    }

    pub fn set_behavior(&self, b: Behavior) {
        self.with(|s| s.behavior = b);
    }

    pub fn set_delay(&self, method: &str, d: Duration) {
        self.with(|s| {
            s.delays.insert(method.to_owned(), d);
        });
    }

    pub fn received(&self) -> Vec<String> {
        self.with(|s| s.received.clone())
    }

    /// Stops answering and releases the port (later sends get ICMP port unreachable).
    pub fn stop(self) {
        self.task.abort();
    }
}

impl Drop for FakeBulb {
    fn drop(&mut self) {
        self.task.abort();
    }
}

async fn serve(sock: Arc<UdpSocket>, state: Arc<Mutex<FakeState>>) {
    let mut buf = [0u8; 2048];
    loop {
        let Ok((n, from)) = sock.recv_from(&mut buf).await else { continue };
        let Ok(req) = serde_json::from_slice::<Value>(&buf[..n]) else { continue };
        let method = req["method"].as_str().unwrap_or_default().to_owned();

        let (reply, delay, dup) = {
            let mut s = state.lock().unwrap();
            s.received.push(method.clone());
            let delay = s.delays.get(&method).copied().unwrap_or_default();
            let reply = build_reply(&mut s, &method, &req["params"]);
            (reply, delay, s.duplicate_replies)
        };
        let Some(reply) = reply else { continue };

        let sock = sock.clone();
        tokio::spawn(async move {
            tokio::time::sleep(delay).await;
            let _ = sock.send_to(&reply, from).await;
            if dup {
                let _ = sock.send_to(&reply, from).await;
            }
        });
    }
}

fn build_reply(s: &mut FakeState, method: &str, params: &Value) -> Option<Vec<u8>> {
    match s.behavior {
        Behavior::Silent => return None,
        Behavior::Garbage => return Some(b"not json {".to_vec()),
        Behavior::Reject => {
            let v = json!({"method": method, "env": "pro",
                           "error": {"code": -32601, "message": "Method not found"}});
            return Some(v.to_string().into_bytes());
        }
        Behavior::Normal => {}
    }

    let mut result = match method {
        "getPilot" if s.minimal => json!({"mac": s.mac, "state": s.on}),
        "getPilot" => json!({
            "mac": s.mac, "rssi": -50, "src": "", "state": s.on,
            "sceneId": s.scene_id, "dimming": s.dimming, "temp": 2700,
            "r": 255, "g": 255, "b": 255
        }),
        "getSystemConfig" => json!({
            "mac": s.mac, "moduleName": s.module_name, "fwVersion": "1.0.0",
            "homeId": 1, "roomId": 1, "rgn": "us", "groupId": 0
        }),
        "setPilot" => {
            if let Some(v) = params["state"].as_bool() {
                s.on = v;
            }
            if let Some(v) = params["dimming"].as_u64() {
                s.dimming = v as u32;
            }
            if let Some(v) = params["sceneId"].as_u64() {
                s.scene_id = v as u32;
            }
            json!({"success": true})
        }
        _ => return None,
    };
    if s.extra_fields {
        result["futureField"] = json!({"nested": [1, 2, 3]});
        result["fwUpdateState"] = json!(0);
    }
    let v = json!({"method": method, "env": "pro", "result": result});
    Some(v.to_string().into_bytes())
}
