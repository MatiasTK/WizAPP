'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Bulb = void 0;
const dgram_1 = __importDefault(require('dgram'));
const events_1 = __importDefault(require('events'));
const constants_1 = require('./constants');
const type_checker_1 = require('./type-checker');
const types_1 = require('./types');
const utils_1 = require('./utils');
const wikari_error_1 = require('./wikari-error');
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
class Bulb {
  static get state() {
    return this._state;
  }
  constructor(address, options) {
    this.address = address;
    this.bulbPort = options.port ?? constants_1.WIZ_BULB_LISTEN_PORT;
    this.listenPort = options.listenPort ?? constants_1.UDP_BROADCAST_LISTEN_PORT;
    this.macIdentifier = options.macIdentifier ?? (0, utils_1.getRandomMac)();
    if (options.responseTimeout) this.responseTimeout = options.responseTimeout;
    if (Bulb.state == 0 /* WikariState.IDLE */) this.initClient();
  }
  static setInstanceState(state) {
    this._state = state;
    this.stateEmitter.emit('state-change', state);
  }
  // #######################################################
  //   High-level end-user oriented interaction functions
  // #######################################################
  /**
   * Calls the given function with the newly received
   * message as the argument.
   * @param fn callback for when a message is received
   */
  onMessage(fn) {
    Bulb.client.on('message', (bulbMsg, rinfo) => {
      if (rinfo.address != this.address) return;
      try {
        const msg = JSON.parse(bulbMsg.toString());
        fn(msg);
      } catch {}
    });
  }
  /**
   * After calling {@link this.subscribe}, the bulb will send
   * updates about it's state every 5 seconds. The provided
   * callback will be called whenever it does so.
   * @param fn callback for when a syncPilot message is received
   */
  onSync(fn) {
    Bulb.client.on('message', (bulbMsg, rinfo) => {
      if (rinfo.address != this.address) return;
      try {
        const msg = JSON.parse(bulbMsg.toString());
        if ((0, type_checker_1.checkType)(types_1.syncPilotResponseTemplate, msg)) fn(msg);
      } catch {}
    });
  }
  /**
   * Sends a subscription message to the bulb, which tells it to send us updates
   * about it's state every 5 seconds. You can intercept these updates with the
   * {@link this.onSync} function.
   *
   * @param networkInterface network interface connected to the network the bulb is on
   * @returns subscription message response on success, else a {@link WikariError}
   */
  async subscribe(networkInterface) {
    const listenIp = (0, utils_1.ipAddress)(networkInterface);
    if (!listenIp)
      throw new Error(
        `Unable to obtain the local IP address ${
          networkInterface ? ` for the network interface '${networkInterface}'` : ''
        }`
      );
    // Sends a subscription message to the bulb
    // It will now notify us about status changes
    const result = await this.sendRaw({
      method: 'registration',
      id: Math.floor(10000 * Math.random()) + 1,
      version: 1,
      params: {
        register: true,
        phoneIp: listenIp,
        phoneMac: this.macIdentifier,
      },
    });
    if (!(result instanceof wikari_error_1.WikariError)) {
      Bulb.client.addListener('message', (msg) => {
        try {
          const response = JSON.parse(msg.toString());
          // if we get a syncPilot message, we send back an
          // acknowledgement for it, which tells WiZ we are
          // still interested in it's status updates
          if ((0, type_checker_1.checkType)(types_1.syncPilotResponseTemplate, response)) {
            this.sendRaw(
              {
                method: 'syncPilot',
                id: response.id,
                env: response.env,
                result: {
                  mac: this.macIdentifier,
                },
              },
              false
            );
          }
        } catch {}
      });
    }
    return result;
  }
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
  async turn(state) {
    return await this.setPilot({
      state,
    });
  }
  /**
   * Turns the bulb on if it was off, and vice-versa.
   * @returns response from the bulb on success, {@link WikariError} otherwise
   */
  async toggle() {
    const pilot = await this.getPilot();
    if (pilot instanceof wikari_error_1.WikariError) return pilot;
    return this.setPilot({ state: !pilot.result.state });
  }
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
  async scene(sceneId, args = {}) {
    if (sceneId < 1 || sceneId > 32)
      return new wikari_error_1.WikariError(
        0 /* WikariErrorCode.ArgumentOutOfRange */,
        {
          argument: 'sceneId',
          lowerLimit: 1,
          higherLimit: 32,
          provided: sceneId,
        },
        'Scene ID must be in the range 1 <> 32'
      );
    for (const [key, value] of Object.entries(args)) {
      if (key == 'speed' || key == 'dimming') {
        const v = value;
        if (v < 1 || v > 100)
          return new wikari_error_1.WikariError(
            0 /* WikariErrorCode.ArgumentOutOfRange */,
            {
              argument: key,
              lowerLimit: 1,
              higherLimit: 100,
              provided: v,
            },
            `Optional argument ${key} must be in the range 1 <> 100`
          );
      }
    }
    return await this.setPilot({
      sceneId,
      ...args,
    });
  }
  async brightness(brightness) {
    if (brightness < 0 || brightness > 100)
      return new wikari_error_1.WikariError(
        0 /* WikariErrorCode.ArgumentOutOfRange */,
        {
          argument: 'brightness',
          lowerLimit: 0,
          higherLimit: 100,
          provided: brightness,
        },
        'Brightness must be in the range 0-100'
      );
    return await this.setPilot({ dimming: brightness });
  }
  /**
   * Changes the color to a certain temperature of white.
   * ```ts
   * bulb.white(5000);
   * ```
   * @param temp temperature, range 1000 to 10_000 (both inclusive)
   * @returns response from the bulb on success, {@link WikariError} otherwise
   */
  async white(temp) {
    if (temp < 1000 || temp > 10000)
      throw new wikari_error_1.WikariError(
        0 /* WikariErrorCode.ArgumentOutOfRange */,
        {
          argument: 'temp',
          lowerLimit: 1000,
          higherLimit: 10000,
          provided: temp,
        },
        'Temperature must be in the range 1000 <> 10_000'
      );
    return await this.setPilot({
      temp,
    });
  }
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
  async color(color) {
    if (typeof color == 'string') {
      const rgbColor = (0, utils_1.hexToRgb)(color);
      if (rgbColor instanceof Error) throw rgbColor;
      return await this.setPilot(rgbColor);
    } else {
      for (const [key, value] of Object.entries(color)) {
        if (value < 0 || value > 255) {
          throw new wikari_error_1.WikariError(
            0 /* WikariErrorCode.ArgumentOutOfRange */,
            {
              argument: key,
              lowerLimit: 0,
              higherLimit: 255,
              provided: value,
            },
            `'${key}' must be in the range 0 <> 255`
          );
        }
      }
      return await this.setPilot(color);
    }
  }
  // ######################################
  //   Lower-level interaction functions
  // ######################################
  isReadyToSend(waitForResponse) {
    const getError = (msg) => {
      return new wikari_error_1.WikariError(
        2 /* WikariErrorCode.InvalidBulbState */,
        {
          state: Bulb.state,
          expectedState: [2 /* WikariState.READY */],
        },
        msg
      );
    };
    if (Bulb.state != 2 /* WikariState.READY */) {
      if (Bulb.state == 1 /* WikariState.BINDING */)
        return getError('Still waiting for port binding to finish');
      if (Bulb.state == 3 /* WikariState.CLOSED */)
        return getError('This bulb instance has been closed');
      if (Bulb.state == 4 /* WikariState.AWAITING_RESPONSE */ && waitForResponse)
        return getError('Already waiting on a response');
    }
  }
  sendWithWait(message) {
    Bulb.setInstanceState(4 /* WikariState.AWAITING_RESPONSE */);
    return new Promise((resolve, reject) => {
      let timer;
      const messageListener = (msg, rinfo) => {
        // if the message is not from the bulb IP, ignore it
        if (rinfo.address != this.address) return;
        try {
          const response = JSON.parse(msg.toString());
          if ('method' in response) {
            // not the response to the request we sent
            if (response['method'] != message['method']) return;
          }
          if (timer) clearTimeout(timer);
          Bulb.client.off('message', messageListener);
          if ('error' in response) {
            reject(
              new wikari_error_1.WikariError(
                7 /* WikariErrorCode.BulbReturnedFailure */,
                { response },
                'Bulb returned failure'
              )
            );
          } else resolve(response);
          Bulb.setInstanceState(2 /* WikariState.READY */);
        } catch (error) {
          reject(
            new wikari_error_1.WikariError(
              4 /* WikariErrorCode.ResponseParseFailed */,
              { response: msg.toString(), error: error },
              'Failed to parse response JSON'
            )
          );
        }
      };
      Bulb.client.on('message', messageListener);
      Bulb.client.send(JSON.stringify(message), this.bulbPort, this.address, (error) => {
        if (error) {
          if (timer) clearTimeout(timer);
          Bulb.setInstanceState(2 /* WikariState.READY */);
          reject(
            new wikari_error_1.WikariError(
              5 /* WikariErrorCode.RequestSendError */,
              { error },
              'Failed to send request to bulb'
            )
          );
        }
      });
      // if the request takes longer than the timeout wait,
      // we can assume the packet has been lost
      const getResponseTimeout = () => this.responseTimeout ?? constants_1.DEFAULT_RESPONSE_WAIT_MS;
      timer = setTimeout(() => {
        Bulb.client.off('message', messageListener);
        reject(
          new wikari_error_1.WikariError(
            6 /* WikariErrorCode.RequestTimedOut */,
            {
              responseWaitMs: getResponseTimeout(),
            },
            'Timed out'
          )
        );
      }, getResponseTimeout());
    });
  }
  sendWithoutWaiting(message) {
    // if we're not waiting for a response, we can just wait to see
    // if there's no errors in the error callback
    return new Promise((resolve, reject) => {
      Bulb.client.send(JSON.stringify(message), this.bulbPort, this.address, (error) => {
        if (error)
          reject(
            new wikari_error_1.WikariError(
              5 /* WikariErrorCode.RequestSendError */,
              { error },
              'Failed to send request to bulb'
            )
          );
        else resolve(message);
      });
    });
  }
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
  async sendRaw(message, waitForResponse = true) {
    const error = this.isReadyToSend(waitForResponse);
    if (error) throw error;
    if (waitForResponse) {
      return this.sendWithWait(message);
    } else {
      return this.sendWithoutWaiting(message);
    }
  }
  /**
   * Fetches the current pilot/state from the bulb.
   * @returns the bulb pilot response
   */
  async getPilot() {
    const pilot = await this.sendRaw({ method: 'getPilot', params: {} });
    if ((0, type_checker_1.checkType)(types_1.getPilotResponseTemplate, pilot)) return pilot;
    else
      throw new wikari_error_1.WikariError(
        3 /* WikariErrorCode.ResponseValidationFailed */,
        { response: pilot },
        'Response validation failed'
      );
  }
  /**
   * Sets the bulb pilot/state.
   *
   * This is a low level function to be used if you want more
   * control. You should usually find the higher-level
   * functions (such as {@link Bulb.color}) enough.
   *
   * @returns the bulb pilot response
   */
  async setPilot(pilot) {
    const response = await this.sendRaw({ method: 'setPilot', params: pilot });
    if ((0, type_checker_1.checkType)(types_1.setPilotResponseTemplate, response)) return response;
    else
      throw new wikari_error_1.WikariError(
        3 /* WikariErrorCode.ResponseValidationFailed */,
        { response },
        'Response validation failed'
      );
  }
  // ##################################
  //   UDP Client related functions
  // ##################################
  async initClient() {
    Bulb.setInstanceState(1 /* WikariState.BINDING */);
    return new Promise((resolve, reject) => {
      const listeningCallback = () => {
        Bulb.setInstanceState(2 /* WikariState.READY */);
        resolve();
      };
      Bulb.client.on('listening', listeningCallback);
      const errorCallback = (error) => {
        Bulb.client.off('listening', listeningCallback);
        reject(
          new wikari_error_1.WikariError(
            1 /* WikariErrorCode.SocketBindFailed */,
            { error },
            `Failed to bind to port ${this.listenPort}`
          )
        );
      };
      Bulb.client.on('error', errorCallback);
      Bulb.client.bind(this.listenPort, undefined, () => {
        Bulb.client.off('listening', listeningCallback);
        Bulb.client.off('error', errorCallback);
      });
    });
  }
  closeConnection() {
    if (Bulb.state == 3 /* WikariState.CLOSED */) return;
    Bulb.setInstanceState(3 /* WikariState.CLOSED */);
    Bulb.stateEmitter.removeAllListeners();
    Bulb.client.removeAllListeners();
    Bulb.client.close();
  }
}
exports.Bulb = Bulb;
Bulb.stateEmitter = new events_1.default();
Bulb.client = dgram_1.default.createSocket('udp4');
Bulb._state = 0 /* WikariState.IDLE */;
//# sourceMappingURL=bulb.js.map
