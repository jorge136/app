"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOperation = exports.isOpRegistered = exports.loadHandlers = void 0;
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const log_1 = require("../util/log");
async function loadHandlers() {
    const operations = {};
    const files = await (0, utils_fs_1.readdirp)(__dirname);
    for (const file of files) {
        const ext = (0, path_1.extname)(file);
        // Only load .js, .ts, or .mjs (no .d.ts) files
        if ((0, path_1.basename)(file).indexOf('.d.ts') >= 0 ||
            (ext !== '.js' && ext !== '.ts' && ext !== '.mjs')) {
            continue;
        }
        const stat = await (0, utils_fs_1.lstat)(file);
        if (stat.isDirectory()) {
            continue;
        }
        try {
            const f = await Promise.resolve().then(() => __importStar(require(file)));
            const meta = f.OPS;
            if (meta) {
                for (const id of meta) {
                    operations[id] = f.default;
                }
            }
        }
        catch (e) {
            (0, log_1.error)('Unable to import operation JS file', e);
        }
    }
    return operations;
}
exports.loadHandlers = loadHandlers;
function isOpRegistered(operations, opName) {
    return opName in operations;
}
exports.isOpRegistered = isOpRegistered;
const enabled = null; //['ios.plist'];
function runOperation(ctx, operations, op) {
    const handler = operations[op.id];
    if (enabled !== null && !enabled.find((e) => e === op.id)) {
        return Promise.resolve();
    }
    if (handler) {
        return handler(ctx, op);
    }
    else {
        return Promise.reject(`No handler for operation ${op.id}`);
    }
}
exports.runOperation = runOperation;
//# sourceMappingURL=index.js.map