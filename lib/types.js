"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPilotResponseTemplate = exports.setPilotResponseTemplate = exports.getPilotResponseTemplate = exports.pilotTemplate = void 0;
const type_checker_1 = require("./type-checker");
exports.pilotTemplate = (0, type_checker_1.makeTypeTemplate)({
    // range 1-32
    sceneId: ["number", false],
    // range 1-100, is a percentage
    speed: ["number", false],
    // range 1-100, is a percentage
    dimming: ["number", false],
    // range 1000-10_000, kelvin
    temp: ["number", false],
    // range 0-255
    r: ["number", false],
    // range 0-255
    g: ["number", false],
    // range 0-255
    b: ["number", false],
    // range 0-255
    c: ["number", false],
    // range 0-255
    w: ["number", false],
    // whether the bulb is on or off
    state: ["boolean", false],
});
// getPilot
exports.getPilotResponseTemplate = (0, type_checker_1.makeTypeTemplate)({
    method: ["string", true],
    env: ["string", true],
    result: {
        mac: ["string", true],
        rssi: ["number", true],
        src: ["string", false],
        state: ["boolean", true],
        sceneId: ["number", true],
        // optional properties
        temp: ["number", false],
        speed: ["number", false],
        r: ["number", false],
        g: ["number", false],
        b: ["number", false],
        c: ["number", false],
        w: ["number", false],
        dimming: ["number", false],
    },
});
// setPilot
exports.setPilotResponseTemplate = (0, type_checker_1.makeTypeTemplate)({
    method: ["string", true],
    env: ["string", true],
    result: {
        success: ["boolean", true],
    },
});
// syncPilot
exports.syncPilotResponseTemplate = (0, type_checker_1.makeTypeTemplate)({
    method: ["string", true],
    env: ["string", true],
    id: ["number", false],
    params: {
        mac: ["string", true],
        rssi: ["number", true],
        src: ["string", false],
        mqttCd: ["number", false],
        ts: ["number", false],
        ...exports.pilotTemplate,
    },
});
//# sourceMappingURL=types.js.map