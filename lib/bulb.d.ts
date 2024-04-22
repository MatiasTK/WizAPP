/// <reference types="node" />
/// <reference types="node" />
import dgram from "dgram";
import EventEmitter from "events";
import { GetPilotResponse, Message, Pilot, GetSceneArgs, GenericResponse, SyncPilotResponse } from "./types";
import { WikariError, WikariErrorCode } from "./wikari-error";
export declare const enum WikariState {
    IDLE = 0,
    BINDING = 1,
    READY = 2,
    CLOSED = 3,
    AWAITING_RESPONSE = 4
}
/**
 * Allows you to interact with a bulb.
 *
 * Note that upon creation, it will have the state {@link WikariState.IDLE}.
 * When the first instance of {@link Bulb} is created, it will try to bind
 * to the port that WiZ bulbs broadcast updates to, and will set it's state
 * to {@link WikariState.BINDING} while this happens.
 *
 * Once it's done, this instance along with all future instances are ready
 * for communication with the bulb, and the state is set to
 * {@link WikariState.READY}.
 *
 * Whenever the state of the instance changes, it will emit a "state-change"
 * event on {@link Bulb.stateEmitter} with the new state as the argument.
 *
 * Every bulb instance uses the same {@link dgram.Socket} object since each
 * bulb instance requires updates from the same port, we can only bind one
 * socket to the port.
 */
export declare class Bulb {
    static readonly stateEmitter: EventEmitter;
    static client: dgram.Socket;
    private static _state;
    static get state(): WikariState;
    responseTimeout: number | undefined;
    listenPort: number;
    bulbPort: number;
    readonly macIdentifier: string;
    readonly address: string;
    constructor(address: string, options: {
        port?: number;
        listenPort?: number;
        responseTimeout?: number;
        macIdentifier?: string;
    });
    static setInstanceState(state: WikariState): void;
    /**
     * Calls the given function with the newly received
     * message as the argument.
     * @param fn callback for when a message is received
     */
    onMessage(fn: (msg: Message) => void): void;
    /**
     * After calling {@link this.subscribe}, the bulb will send
     * updates about it's state every 5 seconds. The provided
     * callback will be called whenever it does so.
     * @param fn callback for when a syncPilot message is received
     */
    onSync(fn: (msg: SyncPilotResponse) => void): void;
    /**
     * Sends a subscription message to the bulb, which tells it to send us updates
     * about it's state every 5 seconds. You can intercept these updates with the
     * {@link this.onSync} function.
     *
     * @param networkInterface network interface connected to the network the bulb is on
     * @returns subscription message response on success, else a {@link WikariError}
     */
    subscribe(networkInterface?: string): Promise<GenericResponse>;
    /**
     * Turns the bulb on or off
     *
     * @example
     * ```ts
     * // turn on the bulb
     * await bulb.state(true);
     *
     * // turn off the bulb
     * await bulb.state(false);
     * ```
     *
     * @param state new state of the bulb
     * @returns response from the bulb on success, {@link WikariError} otherwise
     */
    turn(state: boolean): Promise<GenericResponse>;
    /**
     * Turns the bulb on if it was off, and vice-versa.
     * @returns response from the bulb on success, {@link WikariError} otherwise
     */
    toggle(): Promise<GenericResponse | ({
        method: string;
        env: string;
        result: {
            mac: string;
            rssi: number;
            state: boolean;
            sceneId: number;
            src?: string | undefined;
            temp?: number | undefined;
            speed?: number | undefined;
            r?: number | undefined;
            g?: number | undefined;
            b?: number | undefined;
            c?: number | undefined;
            w?: number | undefined;
            dimming?: number | undefined;
        };
    } & WikariError<any>)>;
    /**
     * Allows you to change the scene. If you're not familiar with the
     * numerical scene IDs of the bulb, you can use the {@link SCENES}
     * object to determine it.
     *
     * ```ts
     * bulb.setScene(SCENES["Christmas"], { speed: 30, dimming: 25 })
     * ```
     *
     * Note that the second argument is strongly typed, and will not let
     * you set speed or dimming on scenes that do not support them.
     *
     * @param sceneId scene ID from 1 to 32 (both inclusive)
     * @param args arguments associated with @param sceneId
     * @returns response from the bulb on success, {@link WikariError} otherwise
     */
    scene<T extends number>(sceneId: T, args?: GetSceneArgs<T>): Promise<GenericResponse | WikariError<WikariErrorCode.ArgumentOutOfRange>>;
    brightness(brightness: number): Promise<GenericResponse | WikariError<WikariErrorCode.ArgumentOutOfRange>>;
    /**
     * Changes the color to a certain temperature of white.
     * ```ts
     * bulb.white(5000);
     * ```
     * @param temp temperature, range 1000 to 10_000 (both inclusive)
     * @returns response from the bulb on success, {@link WikariError} otherwise
     */
    white(temp: number): Promise<GenericResponse>;
    /**
     * Sets the bulb to a certain color.
     *
     * ```ts
     * // set the bulb to red color
     * await bulb.color("#f44336");
     *
     * // set the bulb to some red and some warm white
     * await bulb.color({ r: 100, w: 50 });
     * ```
     *
     * Here, c is the cool white component and w is the warm white
     * component.
     *
     * When passing an object, each value must be in the range 0-255
     * (both inclusive).
     *
     * @param color a hex color code, or an rgbcw object
     * @returns response from the bulb on success, {@link WikariError} otherwise
     */
    color(color: {
        r?: number;
        g?: number;
        b?: number;
        c?: number;
        w?: number;
    } | `#${string}`): Promise<GenericResponse>;
    private isReadyToSend;
    private sendWithWait;
    private sendWithoutWaiting;
    /**
     * If you want more control over the sent messages, you can
     * use this function. All the higher-level bulb control
     * functions (like {@link Bulb.toggle} or {@link Bulb.color})
     * internally use this function.
     *
     * @param message the message to send to the bulb
     * @param waitForResponse whether to wait for a response
     * @returns if waitForResponse is true, the response from the
     * bulb, otherwise the message to be sent itself
     */
    sendRaw(message: Message, waitForResponse?: boolean): Promise<GenericResponse>;
    /**
     * Fetches the current pilot/state from the bulb.
     * @returns the bulb pilot response
     */
    getPilot(): Promise<GetPilotResponse>;
    /**
     * Sets the bulb pilot/state.
     *
     * This is a low level function to be used if you want more
     * control. You should usually find the higher-level
     * functions (such as {@link Bulb.color}) enough.
     *
     * @returns the bulb pilot response
     */
    setPilot(pilot: Pilot): Promise<GenericResponse>;
    private initClient;
    closeConnection(): void;
}
