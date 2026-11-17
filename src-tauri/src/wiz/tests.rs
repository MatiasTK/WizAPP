use std::net::Ipv4Addr;
use std::time::Duration;

use tokio_util::sync::CancellationToken;

use super::discovery::{discover_broadcast_to, discover_unicast};
use super::testing::{Behavior, FakeBulb};
use super::*;

fn fast() -> Timings {
    Timings {
        response: Duration::from_millis(300),
        discover_wait: Duration::from_millis(1500),
        retry_delay: Duration::from_millis(20),
        attempts: 2,
    }
}

async fn client_for(bulb: &FakeBulb) -> BulbClient {
    BulbClient::connect(bulb.ip(), WizNet { port: bulb.port() }, fast()).await.unwrap()
}

#[tokio::test]
async fn get_set_and_system_config() {
    let bulb = FakeBulb::start("A8BB50AABBCC").await;
    let mut c = client_for(&bulb).await;

    let pilot = c.get_pilot().await.unwrap();
    assert_eq!(pilot.mac.as_deref(), Some("a8bb50aabbcc"));
    assert_eq!(pilot.state, Some(true));
    assert_eq!(pilot.dimming, Some(80));

    c.set_pilot(&PilotPatch::state(false)).await.unwrap();
    c.set_pilot(&PilotPatch::dimming(33)).await.unwrap();
    c.set_pilot(&PilotPatch::scene(6)).await.unwrap();
    let pilot = c.get_pilot().await.unwrap();
    assert_eq!((pilot.state, pilot.dimming, pilot.scene_id), (Some(false), Some(33), Some(6)));

    let cfg = c.get_system_config().await.unwrap();
    assert_eq!(cfg.module_name.as_deref(), Some("ESP01_SHRGB_03"));
}

#[tokio::test]
async fn timeout_then_next_request_works() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let mut c = client_for(&bulb).await;

    bulb.set_behavior(Behavior::Silent);
    assert_eq!(c.get_pilot().await.unwrap_err(), WizError::Timeout);

    bulb.set_behavior(Behavior::Normal);
    assert!(c.get_pilot().await.is_ok());
}

#[tokio::test]
async fn late_reply_to_previous_request_is_discarded() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let timings = Timings { response: Duration::from_millis(400), ..fast() };
    let mut c =
        BulbClient::connect(bulb.ip(), WizNet { port: bulb.port() }, timings).await.unwrap();

    // getPilot is answered at ~550 ms, after the 400 ms deadline.
    bulb.set_delay("getPilot", Duration::from_millis(550));
    assert_eq!(c.get_pilot().await.unwrap_err(), WizError::Timeout);

    // setPilot goes out at ~400 ms and is answered at ~700 ms. The stray getPilot reply
    // lands at ~550 ms, while setPilot is waiting, and must be skipped by `method`.
    bulb.set_delay("setPilot", Duration::from_millis(300));
    c.set_pilot(&PilotPatch::state(false)).await.unwrap();
    assert!(!bulb.with(|s| s.on));
}

#[tokio::test]
async fn stale_reply_with_same_method_is_dropped_before_next_request() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let timings = Timings { response: Duration::from_millis(100), ..fast() };
    let mut c =
        BulbClient::connect(bulb.ip(), WizNet { port: bulb.port() }, timings).await.unwrap();

    bulb.set_delay("getPilot", Duration::from_millis(150));
    assert_eq!(c.get_pilot().await.unwrap_err(), WizError::Timeout);

    // The stale getPilot reply (state: true) sits in the socket; the next request must
    // report the fresh state instead.
    tokio::time::sleep(Duration::from_millis(150)).await;
    bulb.with(|s| s.on = false);
    bulb.set_delay("getPilot", Duration::ZERO);
    assert_eq!(c.get_pilot().await.unwrap().state, Some(false));
}

#[tokio::test]
async fn error_reply_is_rejected_and_garbage_times_out() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let mut c = client_for(&bulb).await;

    bulb.set_behavior(Behavior::Reject);
    assert!(matches!(c.get_pilot().await, Err(WizError::Rejected(m)) if m.contains("not found")));
    // A rejection is an error value, never a success.
    assert!(c.set_pilot(&PilotPatch::state(true)).await.is_err());

    bulb.set_behavior(Behavior::Garbage);
    assert_eq!(c.get_pilot().await.unwrap_err(), WizError::Timeout);
}

#[tokio::test]
async fn closed_port_is_unreachable_and_socket_stays_usable() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let (ip, port) = (bulb.ip(), bulb.port());
    let mut c = client_for(&bulb).await;
    bulb.stop();
    tokio::time::sleep(Duration::from_millis(50)).await;

    assert_eq!(c.get_pilot().await.unwrap_err(), WizError::Unreachable);

    let _revived = FakeBulb::start_on(ip, port, "a8bb50aabbcc").await;
    assert!(c.get_pilot().await.is_ok());
}

#[tokio::test]
async fn lenient_deserialization() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let mut c = client_for(&bulb).await;

    bulb.with(|s| s.extra_fields = true);
    assert!(c.get_pilot().await.is_ok());
    assert!(c.get_system_config().await.is_ok());

    bulb.with(|s| {
        s.extra_fields = false;
        s.minimal = true;
    });
    let p = c.get_pilot().await.unwrap();
    assert_eq!(p.dimming, None);
    assert_eq!(p.state, Some(true));
}

#[tokio::test]
async fn out_of_range_arguments_are_errors() {
    let bulb = FakeBulb::start("a8bb50aabbcc").await;
    let mut c = client_for(&bulb).await;
    assert_eq!(
        c.set_pilot(&PilotPatch::scene(33)).await,
        Err(WizError::InvalidArgument("sceneId"))
    );
    assert_eq!(c.set_pilot(&PilotPatch::scene(0)).await, Err(WizError::InvalidArgument("sceneId")));
    assert_eq!(
        c.set_pilot(&PilotPatch::dimming(101)).await,
        Err(WizError::InvalidArgument("dimming"))
    );
    assert!(bulb.received().is_empty());
    assert_eq!(PilotPatch::from_hex("#ff66aa").unwrap(), PilotPatch::rgb(255, 102, 170));
    assert!(PilotPatch::from_hex("#ff66").is_err());
}

async fn three_fakes() -> (FakeBulb, FakeBulb, FakeBulb) {
    let a = FakeBulb::start_on(Ipv4Addr::new(127, 0, 0, 1), 0, "aa0000000001").await;
    let b = FakeBulb::start_on(Ipv4Addr::new(127, 0, 0, 2), a.port(), "aa0000000002").await;
    let c = FakeBulb::start_on(Ipv4Addr::new(127, 0, 0, 3), a.port(), "aa0000000003").await;
    (a, b, c)
}

#[tokio::test]
async fn unicast_returns_early_when_all_answered() {
    let (a, b, c) = three_fakes().await;
    let ips = [a.ip(), b.ip(), c.ip()];
    let started = std::time::Instant::now();
    let found = discover_unicast(
        &ips,
        WizNet { port: a.port() },
        Duration::from_secs(5),
        &CancellationToken::new(),
    )
    .await
    .unwrap();
    assert_eq!(found.len(), 3);
    assert!(started.elapsed() < Duration::from_secs(1), "waited {:?}", started.elapsed());
    assert!(found.iter().any(|d| d.pilot.mac.as_deref() == Some("aa0000000002")));
}

#[tokio::test]
async fn unicast_waits_full_deadline_when_one_is_missing() {
    let (a, b, _c) = three_fakes().await;
    let ips = [a.ip(), b.ip(), Ipv4Addr::new(127, 0, 0, 9)];
    let found = discover_unicast(
        &ips,
        WizNet { port: a.port() },
        Duration::from_millis(400),
        &CancellationToken::new(),
    )
    .await
    .unwrap();
    assert_eq!(found.len(), 2);
}

#[tokio::test]
async fn broadcast_deduplicates_by_ip() {
    let (a, b, _c) = three_fakes().await;
    a.with(|s| s.duplicate_replies = true);
    // Same target twice and duplicate replies from the bulb: still one result per IP.
    let targets = [a.ip(), a.ip(), b.ip()];
    let found = discover_broadcast_to(
        &targets,
        WizNet { port: a.port() },
        Duration::from_millis(300),
        &CancellationToken::new(),
    )
    .await
    .unwrap();
    assert_eq!(found.len(), 2);
}

#[tokio::test]
async fn discovery_is_cancelable() {
    let a = FakeBulb::start("aa0000000001").await;
    a.set_behavior(Behavior::Silent);
    let cancel = CancellationToken::new();
    let c2 = cancel.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(50)).await;
        c2.cancel();
    });
    let started = std::time::Instant::now();
    let found =
        discover_unicast(&[a.ip()], WizNet { port: a.port() }, Duration::from_secs(5), &cancel)
            .await
            .unwrap();
    assert!(found.is_empty());
    assert!(started.elapsed() < Duration::from_secs(1));
}
