use std::collections::HashSet;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::Duration;

use tokio::net::UdpSocket;
use tokio::time::{timeout, Instant};
use tokio_util::sync::CancellationToken;

use super::netif::broadcast_addresses;
use super::protocol::{Envelope, Pilot};
use super::{WizError, WizNet};

#[derive(Debug, Clone, PartialEq)]
pub struct Discovered {
    pub ip: Ipv4Addr,
    pub pilot: Pilot,
}

/// Sends `getPilot` to every IP at once and returns as soon as all of them answered
/// or `wait` elapses.
pub async fn discover_unicast(
    ips: &[Ipv4Addr],
    net: WizNet,
    wait: Duration,
    cancel: &CancellationToken,
) -> Result<Vec<Discovered>, WizError> {
    probe(ips, net, wait, cancel, true).await
}

/// Sends `getPilot` to every interface broadcast address and listens for the full
/// `wait`. Replies are deduplicated by source IP.
pub async fn discover_broadcast(
    net: WizNet,
    wait: Duration,
    cancel: &CancellationToken,
) -> Result<Vec<Discovered>, WizError> {
    discover_broadcast_to(&broadcast_addresses(), net, wait, cancel).await
}

pub async fn discover_broadcast_to(
    targets: &[Ipv4Addr],
    net: WizNet,
    wait: Duration,
    cancel: &CancellationToken,
) -> Result<Vec<Discovered>, WizError> {
    probe(targets, net, wait, cancel, false).await
}

async fn probe(
    targets: &[Ipv4Addr],
    net: WizNet,
    wait: Duration,
    cancel: &CancellationToken,
    stop_when_all_answered: bool,
) -> Result<Vec<Discovered>, WizError> {
    if targets.is_empty() {
        return Ok(Vec::new());
    }
    let sock = UdpSocket::bind("0.0.0.0:0").await.map_err(|e| WizError::from_io(&e))?;
    sock.set_broadcast(true).map_err(|e| WizError::from_io(&e))?;

    let msg = br#"{"method":"getPilot","params":{}}"#;
    for target in targets {
        // One unreachable interface must not abort the whole round.
        let _ = sock.send_to(msg, SocketAddr::from((*target, net.port))).await;
    }

    let wanted: HashSet<Ipv4Addr> = targets.iter().copied().collect();
    let mut seen: HashSet<Ipv4Addr> = HashSet::new();
    let mut found = Vec::new();
    let deadline = Instant::now() + wait;
    let mut buf = [0u8; 2048];

    loop {
        let remaining = deadline.saturating_duration_since(Instant::now());
        let recv = tokio::select! {
            _ = cancel.cancelled() => return Ok(found),
            r = timeout(remaining, sock.recv_from(&mut buf)) => r,
        };
        let (n, from) = match recv {
            Err(_) => break,
            // ICMP port unreachable from a target that is down: keep listening.
            Ok(Err(e)) if WizError::from_io(&e) == WizError::Unreachable => continue,
            Ok(Err(e)) => return Err(WizError::from_io(&e)),
            Ok(Ok(r)) => r,
        };
        let IpAddr::V4(ip) = from.ip() else { continue };
        let Some(env) = Envelope::parse(&buf[..n]) else { continue };
        if env.method.as_deref() != Some("getPilot") || env.error.is_some() {
            continue;
        }
        let Some(result) = env.result else { continue };
        let Ok(pilot) = serde_json::from_value::<Pilot>(result) else { continue };
        if !seen.insert(ip) {
            continue;
        }
        found.push(Discovered { ip, pilot });
        if stop_when_all_answered && wanted.iter().all(|w| seen.contains(w)) {
            break;
        }
    }
    Ok(found)
}
