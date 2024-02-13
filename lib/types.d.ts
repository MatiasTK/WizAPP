import { ADJUSTABLE_DIMMING_SCENES, ADJUSTABLE_SPEED_SCENES } from "./constants";
import { FromTypeTemplate } from "./type-checker";
export declare const pilotTemplate: {
    sceneId: ["number", false];
    speed: ["number", false];
    dimming: ["number", false];
    temp: ["number", false];
    r: ["number", false];
    g: ["number", false];
    b: ["number", false];
    c: ["number", false];
    w: ["number", false];
    state: ["boolean", false];
};
export type Pilot = FromTypeTemplate<typeof pilotTemplate>;
type IfExtends<P, Q, R extends Pilot> = P extends Q ? R : {};
export type GetSceneArgs<Scene extends number> = IfExtends<Scene, (typeof ADJUSTABLE_SPEED_SCENES)[number], {
    speed?: number;
}> & IfExtends<Scene, (typeof ADJUSTABLE_DIMMING_SCENES)[number], {
    dimming?: number;
}>;
export type GenericResponse = {
    method: string;
    params: Record<string, any>;
};
export declare const getPilotResponseTemplate: {
    method: ["string", true];
    env: ["string", true];
    result: {
        mac: ["string", true];
        rssi: ["number", true];
        src: ["string", false];
        state: ["boolean", true];
        sceneId: ["number", true];
        temp: ["number", false];
        speed: ["number", false];
        r: ["number", false];
        g: ["number", false];
        b: ["number", false];
        c: ["number", false];
        w: ["number", false];
        dimming: ["number", false];
    };
};
export type GetPilotResponse = FromTypeTemplate<typeof getPilotResponseTemplate>;
export declare const setPilotResponseTemplate: {
    method: ["string", true];
    env: ["string", true];
    result: {
        success: ["boolean", true];
    };
};
export type SetPilotType = FromTypeTemplate<typeof setPilotResponseTemplate>;
export declare const syncPilotResponseTemplate: {
    method: ["string", true];
    env: ["string", true];
    id: ["number", false];
    params: {
        sceneId: ["number", false];
        speed: ["number", false];
        dimming: ["number", false];
        temp: ["number", false];
        r: ["number", false];
        g: ["number", false];
        b: ["number", false];
        c: ["number", false];
        w: ["number", false];
        state: ["boolean", false];
        mac: ["string", true];
        rssi: ["number", true];
        src: ["string", false];
        mqttCd: ["number", false];
        ts: ["number", false];
    };
};
export type SyncPilotResponse = FromTypeTemplate<typeof syncPilotResponseTemplate>;
export interface GenericMsg {
    method: string;
    params: Record<any, any>;
}
export interface SetPilotMsg extends GenericMsg {
    method: "setPilot";
    params: Pilot;
}
export interface GetPilotMsg extends GenericMsg {
    method: "getPilot";
    params: {};
}
export type SyncPilotMsg = SyncPilotResponse;
export interface SyncPilotAckMsg {
    method: "syncPilot";
    id?: number;
    env: string;
    result: {
        mac: string;
    };
}
export interface RegistrationMsg extends GenericMsg {
    method: "registration";
    id: number;
    version: number;
    params: {
        register: boolean;
        phoneIp: string;
        phoneMac: string;
    };
}
export type Message = SetPilotMsg | GetPilotMsg | SyncPilotMsg | SyncPilotAckMsg | RegistrationMsg | GenericMsg;
export {};
