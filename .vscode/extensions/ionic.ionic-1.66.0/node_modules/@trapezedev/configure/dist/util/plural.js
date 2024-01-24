"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluralize = void 0;
function pluralize(v, msg) {
    if (v === 0 || v > 1) {
        return `${msg}s`;
    }
    return msg;
}
exports.pluralize = pluralize;
//# sourceMappingURL=plural.js.map