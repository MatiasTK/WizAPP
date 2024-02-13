"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkType = exports.makeTypeTemplate = void 0;
/**
 * creates a {@link TypeTemplate}.
 * returns the argument it receives as-is.
 * only for some type haggling.
 */
const makeTypeTemplate = (v) => v;
exports.makeTypeTemplate = makeTypeTemplate;
function checkType(template, obj) {
    if (typeof obj != "object" || obj == null)
        return false;
    for (const [key, value] of Object.entries(template)) {
        if (Array.isArray(value)) {
            const ogType = typeof obj[key];
            const [type, required] = value;
            if (ogType != type)
                if (!(ogType == "undefined" && !required))
                    return false;
        }
        else {
            if (!checkType(value, obj[key]))
                return false;
        }
    }
    return true;
}
exports.checkType = checkType;
//# sourceMappingURL=type-checker.js.map