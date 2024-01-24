"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fatal = exports.error = exports.warn = exports.log = exports.debug = exports.logger = exports.output = void 0;
const cli_framework_output_1 = require("@ionic/cli-framework-output");
const term_1 = require("./term");
const colors_1 = __importDefault(require("../colors"));
const kleur_1 = __importDefault(require("kleur"));
const options = {
    colors: colors_1.default,
    stream: process.argv.includes('--json') ? process.stderr : process.stdout,
};
exports.output = (0, term_1.isInteractive)()
    ? new cli_framework_output_1.TTYOutputStrategy(options)
    : new cli_framework_output_1.StreamOutputStrategy(options);
exports.logger = (0, cli_framework_output_1.createDefaultLogger)({
    output: exports.output,
    formatterOptions: {
        titleize: false,
        tags: new Map([
            [cli_framework_output_1.LOGGER_LEVELS.DEBUG, colors_1.default.log.DEBUG('[debug]')],
            [cli_framework_output_1.LOGGER_LEVELS.INFO, colors_1.default.log.INFO('[info]')],
            [cli_framework_output_1.LOGGER_LEVELS.WARN, colors_1.default.log.WARN('[warn]')],
            [cli_framework_output_1.LOGGER_LEVELS.ERROR, colors_1.default.log.ERROR('[error]')],
        ]),
    },
});
function debug(...args) {
    if (process.env.VERBOSE !== 'false') {
        console.log(...args);
    }
}
exports.debug = debug;
function log(...args) {
    console.log(...args);
}
exports.log = log;
function warn(...args) {
    console.warn(...args);
}
exports.warn = warn;
function error(...args) {
    console.warn(...args);
}
exports.error = error;
function fatal(msg, exc) {
    console.error(kleur_1.default.bold(colors_1.default.failure(`Fatal error: ${msg}`)));
    if (exc) {
        console.error(exc);
    }
    process.exit(1);
}
exports.fatal = fatal;
//# sourceMappingURL=log.js.map