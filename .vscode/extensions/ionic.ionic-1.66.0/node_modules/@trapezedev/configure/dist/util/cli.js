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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPrompt = exports.wrapAction = void 0;
const log_1 = require("./log");
const colors_1 = __importDefault(require("../colors"));
function wrapAction(action) {
    return async (...args) => {
        try {
            await action(...args);
        }
        catch (e) {
            log_1.logger.error(e.message);
            throw e;
        }
    };
}
exports.wrapAction = wrapAction;
async function logPrompt(msg, promptObject) {
    const { wordWrap } = await Promise.resolve().then(() => __importStar(require('@ionic/cli-framework-output')));
    const prompt = await Promise.resolve().then(() => __importStar(require('prompts')));
    log_1.logger.log({
        msg: `${colors_1.default.input(`[?]`)} ${wordWrap(msg, { indentation: 4 })}`,
        logger: log_1.logger,
        format: false,
    });
    return prompt.default(promptObject, { onCancel: () => process.exit(1) });
}
exports.logPrompt = logPrompt;
//# sourceMappingURL=cli.js.map