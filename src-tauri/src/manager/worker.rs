//! One task per bulb: owns its UDP client and runs jobs strictly in order. Different
//! bulbs run in parallel, so a bulb that hangs only delays its own queue.

use std::net::Ipv4Addr;

use tokio::sync::mpsc;

use super::ManagerMsg;
use crate::wiz::{BulbClient, Pilot, PilotPatch, SystemConfig, Timings, WizError, WizNet};

pub(crate) enum WorkerOp {
    /// `getPilot`, then `setPilot { state: !state }` with an explicit value.
    Toggle,
    Patch(PilotPatch),
    /// `getPilot` only.
    Refresh,
    /// `getPilot` plus a best-effort `getSystemConfig`.
    RefreshFull,
}

pub(crate) enum WorkerOutput {
    Toggled(bool),
    Done,
    Pilot(Pilot),
    Full(Pilot, Option<SystemConfig>),
}

pub(crate) struct Job {
    pub ticket: u64,
    pub op: WorkerOp,
}

/// One retry on timeout or unreachable. A rejection is final.
macro_rules! retry {
    ($call:expr) => {{
        let mut r = $call.await;
        if matches!(r, Err(WizError::Timeout | WizError::Unreachable)) {
            r = $call.await;
        }
        r
    }};
}

pub(crate) fn spawn(
    ip: Ipv4Addr,
    net: WizNet,
    timings: Timings,
    results: mpsc::UnboundedSender<ManagerMsg>,
) -> mpsc::UnboundedSender<Job> {
    let (jobs_tx, mut jobs_rx) = mpsc::unbounded_channel::<Job>();
    tokio::spawn(async move {
        let mut client: Option<BulbClient> = None;
        while let Some(job) = jobs_rx.recv().await {
            let outcome = run(&mut client, ip, net, timings, job.op).await;
            let msg = ManagerMsg::WorkerDone { ip: ip.to_string(), ticket: job.ticket, outcome };
            if results.send(msg).is_err() {
                break;
            }
        }
    });
    jobs_tx
}

async fn run(
    slot: &mut Option<BulbClient>,
    ip: Ipv4Addr,
    net: WizNet,
    timings: Timings,
    op: WorkerOp,
) -> Result<WorkerOutput, WizError> {
    if slot.is_none() {
        *slot = Some(BulbClient::connect(ip, net, timings).await?);
    }
    let client = slot.as_mut().expect("client was just created");

    match op {
        WorkerOp::Toggle => {
            let pilot = retry!(client.get_pilot())?;
            let next = !pilot.state.unwrap_or(false);
            retry!(client.set_pilot(&PilotPatch::state(next)))?;
            Ok(WorkerOutput::Toggled(next))
        }
        WorkerOp::Patch(patch) => {
            retry!(client.set_pilot(&patch))?;
            Ok(WorkerOutput::Done)
        }
        WorkerOp::Refresh => Ok(WorkerOutput::Pilot(retry!(client.get_pilot())?)),
        WorkerOp::RefreshFull => {
            let pilot = retry!(client.get_pilot())?;
            let sys = client.get_system_config().await.ok();
            Ok(WorkerOutput::Full(pilot, sys))
        }
    }
}
