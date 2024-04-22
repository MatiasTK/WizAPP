import { Bulb } from "./bulb";
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
export declare function discover({ addr, port, waitMs, }: {
    addr?: string | undefined;
    port?: number | undefined;
    waitMs?: number | undefined;
}): Promise<Bulb[]>;
