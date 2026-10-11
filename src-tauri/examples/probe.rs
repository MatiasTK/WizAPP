//! Manual check against `scripts/wiz_emulator.py` or a real bulb:
//! `cargo run --example probe -- 127.0.0.1`

use std::net::Ipv4Addr;

use wiz_app_lib::wiz::{BulbClient, PilotPatch, Timings, WizNet};

#[tokio::main]
async fn main() {
    let ip: Ipv4Addr = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "127.0.0.1".into())
        .parse()
        .expect("usage: probe <ipv4>");
    let mut client =
        BulbClient::connect(ip, WizNet::default(), Timings::default()).await.expect("connect");

    println!("getSystemConfig: {:?}", client.get_system_config().await);
    let pilot = client.get_pilot().await;
    println!("getPilot:        {pilot:?}");
    if let Ok(p) = pilot {
        let on = p.state.unwrap_or(false);
        println!("setPilot({}):  {:?}", !on, client.set_pilot(&PilotPatch::state(!on)).await);
        println!("setPilot({}):  {:?}", on, client.set_pilot(&PilotPatch::state(on)).await);
    }
}
