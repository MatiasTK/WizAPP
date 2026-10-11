import dgram from "dgram";
import { Bulb } from "./bulb";
import { DEFAULT_DISCOVER_WAIT_MS, WIZ_BULB_LISTEN_PORT } from "./constants";
import { checkType } from "./type-checker";
import { GetPilotMsg, getPilotResponseTemplate } from "./types";
import { getBroadcastAddresses, sleep } from "./utils";

/**
 * Discovers bulbs on a network.
 * This is done by sending a request and creating bulb instances from the devices
 * that respond.
 *
 * The first argument contains options for discovery, them being:
 * * addr: the address to send the request on (ideally a broadcast address)
 * * port: the port that the bulbs listen on
 * * waitMs: how long to wait for a response from the bulb
 *
 * If your local IP addresses do not start with 192.168.1, you'll need to
 * pass a custom addr.
 *
 * @returns an array of {@link Bulb} instances corresponding to discovered bulbs
 */
export async function discover({
	addr,
	port = WIZ_BULB_LISTEN_PORT,
	waitMs = DEFAULT_DISCOVER_WAIT_MS,
}: {
	addr?: string;
	port?: number;
	waitMs?: number;
} = {}): Promise<Bulb[]> {
	const client = dgram.createSocket("udp4");
	const bulbs: Bulb[] = [];
	const message: GetPilotMsg = {
		method: "getPilot",
		params: {},
	};

	const targets = addr ? [addr] : getBroadcastAddresses();

	if (targets.length === 0 && !addr) {
		targets.push("255.255.255.255");
	}

	client.on("listening", function () {
		client.setBroadcast(true);
	});

	// Bind to a random port to allow sending
	client.bind(() => {
		for (const target of targets) {
			try {
				client.send(JSON.stringify(message), port, target);
			} catch (e) {
				// Ignore send errors for specific interfaces
			}
		}
	});

	const listener = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
		try {
			const response = JSON.parse(msg.toString());

			if (checkType(getPilotResponseTemplate, response)) {
				// Avoid duplicates
				if (!bulbs.some(b => b.address === rinfo.address)) {
					bulbs.push(new Bulb(rinfo.address, { port }));
				}
			}
		} catch (e) {
			// Ignore invalid JSON or malformed packets
		}
	};

	client.on("message", listener);
	await sleep(waitMs);
	client.off("message", listener);

	client.close();

	return bulbs;
}
