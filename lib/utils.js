"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipAddress = exports.hexToRgb = exports.getRandomMac = exports.sleep = void 0;
const constants_1 = require("./constants");
const os_1 = __importDefault(require("os"));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.sleep = sleep;
const getRandomMac = () => [...Array(12).keys()]
    .map(() => constants_1.POSSIBLE_MAC_CHARACTERS.charAt(Math.floor(Math.random() * constants_1.POSSIBLE_MAC_CHARACTERS.length)))
    .join("");
exports.getRandomMac = getRandomMac;
const hexToRgb = (hex) => {
    const result = constants_1.HEX_COLOR_REGEX.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : new Error("Invalid hex");
};
exports.hexToRgb = hexToRgb;
const ipAddress = (networkInterface) => {
    const nets = os_1.default.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // on node <= v17, 'net.family' is "IPv4"
            // since node v18, it's the number 4 or 6
            const ipv4 = typeof net.family === "string" ? "IPv4" : 4;
            if (net.family === ipv4 && !net.internal) {
                if (networkInterface) {
                    if (name == networkInterface)
                        return net.address;
                }
                else
                    return net.address;
            }
        }
    }
    return undefined;
};
exports.ipAddress = ipAddress;
//# sourceMappingURL=utils.js.map