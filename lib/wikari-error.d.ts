import { WikariState } from "./bulb";
export declare const enum WikariErrorCode {
    ArgumentOutOfRange = 0,
    SocketBindFailed = 1,
    InvalidBulbState = 2,
    ResponseValidationFailed = 3,
    ResponseParseFailed = 4,
    RequestSendError = 5,
    RequestTimedOut = 6,
    BulbReturnedFailure = 7
}
export type WErrorArgMap = {
    [WikariErrorCode.ArgumentOutOfRange]: {
        argument: string;
        lowerLimit: number;
        higherLimit: number;
        provided: number;
    };
    [WikariErrorCode.SocketBindFailed]: {
        error: Error;
    };
    [WikariErrorCode.InvalidBulbState]: {
        state: WikariState;
        expectedState: WikariState[];
    };
    [WikariErrorCode.ResponseValidationFailed]: {
        response: Record<any, any>;
    };
    [WikariErrorCode.ResponseParseFailed]: {
        response: string;
        error: Error;
    };
    [WikariErrorCode.RequestSendError]: {
        error: Error;
    };
    [WikariErrorCode.RequestTimedOut]: {
        responseWaitMs: number;
    };
    [WikariErrorCode.BulbReturnedFailure]: {
        response: Record<any, any>;
    };
};
type WikariErrorData = WErrorArgMap[WikariErrorCode];
export declare class WikariError<T extends WikariErrorCode = WikariErrorCode> extends Error {
    code: WikariErrorCode;
    data: WikariErrorData;
    constructor(code: T, data: WErrorArgMap[T], message: string);
}
export {};
