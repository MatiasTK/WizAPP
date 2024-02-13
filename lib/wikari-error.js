"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikariError = void 0;
class WikariError extends Error {
    constructor(code, data, message) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
exports.WikariError = WikariError;
//# sourceMappingURL=wikari-error.js.map