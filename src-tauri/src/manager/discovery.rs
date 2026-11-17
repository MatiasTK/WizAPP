//! Two-phase discovery, run as a detached task per generation. It only talks to the
//! network and reports back; the actor decides what to do with each reply.

use std::collections::HashSet;
use std::net::Ipv4Addr;

use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use super::{ManagerMsg, ManagerOptions};
use crate::wiz::discovery::{discover_broadcast_stream, discover_unicast_stream, Discovered};
use crate::wiz::netif::broadcast_addresses;
use crate::wiz::{BulbClient, Pilot, SystemConfig};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Via {
    Unicast,
    Broadcast,
}

#[allow(clippy::large_enum_variant)] // sent once per bulb; boxing buys nothing
pub(crate) enum DiscoveryEvent {
    Found { ip: Ipv4Addr, pilot: Pilot, sys: Option<SystemConfig>, via: Via, adopt: bool },
    Finished,
}

/// Snapshot of what was known when discovery started.
pub(crate) struct Plan {
    pub known: Vec<(Ipv4Addr, Option<String>)>,
    /// Config was empty: take whatever answers the broadcast.
    pub adopt: bool,
}

pub(crate) fn normalize_mac(mac: &str) -> String {
    mac.chars().filter(|c| c.is_ascii_hexdigit()).collect::<String>().to_lowercase()
}

pub(crate) fn mac_matches(saved: &Option<String>, seen: &Option<String>) -> bool {
    match (saved, seen) {
        (Some(a), Some(b)) => normalize_mac(a) == normalize_mac(b),
        // Nothing to compare against yet: trust the IP.
        (None, _) => true,
        (Some(_), None) => false,
    }
}

async fn fetch_sys(ip: Ipv4Addr, opts: &ManagerOptions) -> Option<SystemConfig> {
    let mut client = BulbClient::connect(ip, opts.net, opts.timings).await.ok()?;
    client.get_system_config().await.ok()
}

pub(crate) async fn run(
    plan: Plan,
    opts: ManagerOptions,
    cancel: CancellationToken,
    generation: u64,
    to_actor: mpsc::UnboundedSender<ManagerMsg>,
) {
    let send = |event| {
        let _ = to_actor.send(ManagerMsg::Discovery { generation, event });
    };
    let t = opts.timings;
    let mut online = 0usize;

    // Phase 1: unicast to the saved IPs.
    if !plan.known.is_empty() {
        let mut remaining: Vec<Ipv4Addr> = plan.known.iter().map(|(ip, _)| *ip).collect();
        for attempt in 0..t.attempts {
            if cancel.is_cancelled() {
                return;
            }
            let (tx, mut rx) = mpsc::unbounded_channel::<Discovered>();
            let probing =
                discover_unicast_stream(&remaining, opts.net, t.discover_wait, &cancel, tx);
            let mut answered: HashSet<Ipv4Addr> = HashSet::new();
            let consuming = async {
                while let Some(d) = rx.recv().await {
                    let sys = fetch_sys(d.ip, &opts).await;
                    let saved = plan.known.iter().find(|(ip, _)| *ip == d.ip).map(|(_, m)| m);
                    if saved.is_some_and(|m| mac_matches(m, &d.pilot.mac)) {
                        online += 1;
                    }
                    answered.insert(d.ip);
                    send(DiscoveryEvent::Found {
                        ip: d.ip,
                        pilot: d.pilot,
                        sys,
                        via: Via::Unicast,
                        adopt: plan.adopt,
                    });
                }
            };
            let (res, ()) = tokio::join!(probing, consuming);
            if let Err(e) = res {
                log::warn!("unicast discovery round failed: {e}");
            }
            remaining.retain(|ip| !answered.contains(ip));
            if online > 0 || remaining.is_empty() {
                break;
            }
            if attempt + 1 < t.attempts && !sleep_or_cancel(t.retry_delay, &cancel).await {
                return;
            }
        }
    }

    // Phase 2: broadcast, only when nothing saved answered.
    if online == 0 {
        let targets = opts.broadcast_targets.clone().unwrap_or_else(broadcast_addresses);
        for attempt in 0..t.attempts {
            if cancel.is_cancelled() {
                return;
            }
            let (tx, mut rx) = mpsc::unbounded_channel::<Discovered>();
            let probing =
                discover_broadcast_stream(&targets, opts.net, t.discover_wait, &cancel, tx);
            let consuming = async {
                while let Some(d) = rx.recv().await {
                    let sys = fetch_sys(d.ip, &opts).await;
                    let known_mac =
                        plan.known.iter().any(|(_, m)| m.is_some() && mac_matches(m, &d.pilot.mac));
                    if plan.adopt || known_mac {
                        online += 1;
                    }
                    send(DiscoveryEvent::Found {
                        ip: d.ip,
                        pilot: d.pilot,
                        sys,
                        via: Via::Broadcast,
                        adopt: plan.adopt,
                    });
                }
            };
            let (res, ()) = tokio::join!(probing, consuming);
            if let Err(e) = res {
                log::warn!("broadcast discovery round failed: {e}");
            }
            if online > 0 {
                break;
            }
            if attempt + 1 < t.attempts && !sleep_or_cancel(t.retry_delay, &cancel).await {
                return;
            }
        }
    }

    if !cancel.is_cancelled() {
        send(DiscoveryEvent::Finished);
    }
}

/// `false` when cancelled during the sleep.
async fn sleep_or_cancel(d: std::time::Duration, cancel: &CancellationToken) -> bool {
    tokio::select! {
        () = cancel.cancelled() => false,
        () = tokio::time::sleep(d) => true,
    }
}
