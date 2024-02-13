"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discover = void 0;
const dgram_1 = __importDefault(require("dgram"));
const bulb_1 = require("./bulb");
const constants_1 = require("./constants");
const type_checker_1 = require("./type-checker");
const types_1 = require("./types");
const utils_1 = require("./utils");
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
async function discover({ addr = "192.168.1.255", port = constants_1.WIZ_BULB_LISTEN_PORT, waitMs = constants_1.DEFAULT_DISCOVER_WAIT_MS, }) {
    const client = dgram_1.default.createSocket("udp4");
    const bulbs = [];
    const message = {
        method: "getPilot",
        params: {},
    };
    if (addr.split(".").includes("255")) {
        client.once("listening", function () {
            client.setBroadcast(true);
        });
    }
    client.send(JSON.stringify(message), port, addr);
    const listener = (msg, rinfo) => {
        const response = JSON.parse(msg.toString());
        if ((0, type_checker_1.checkType)(types_1.getPilotResponseTemplate, response)) {
            bulbs.push(new bulb_1.Bulb(rinfo.address, { port }));
        }
    };
    client.on("message", listener);
    await (0, utils_1.sleep)(waitMs);
    client.off("message", listener);
    client.close();
    return bulbs;
}
exports.discover = discover;
//# sourceMappingURL=discover.js.map