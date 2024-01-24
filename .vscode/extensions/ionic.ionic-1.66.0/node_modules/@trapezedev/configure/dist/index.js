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
exports.runProgram = exports.run = void 0;
const commander_1 = require("commander");
const ctx_1 = require("./ctx");
const log_1 = require("./util/log");
const cli_1 = require("./util/cli");
async function run() {
    try {
        (0, ctx_1.initLogging)(process.argv);
        const ctx = await (0, ctx_1.loadContext)();
        runProgram(ctx);
    }
    catch (e) {
        process.exitCode = 1;
        log_1.logger.error(e.message ? e.message : String(e));
        throw e;
    }
}
exports.run = run;
function runProgram(ctx) {
    // program.version(env.package.version);
    const program = new commander_1.Command();
    program
        .command('run [configFile]')
        .description(`Run project modification`)
        .option('--dry-run', 'Show changes before making them')
        .option('-y', 'Non-interactive')
        .option('--diff', 'Show a diff of each file')
        .option('--verbose', 'Verbose output')
        .option('--android-project', 'Path to the root of the Android project (default: \'android\')')
        .option('--ios-project', 'Path to the root of the iOS project (default: \'ios/App\')')
        .option('--ios', 'Explicitly run iOS operations. This is exclusive, meaning other platforms not specified won\'t run when this flag is used')
        .option('--android', 'Explicitly run Android operations. This is exclusive, meaning other platforms not specified won\'t run when this flag is used')
        .action((0, cli_1.wrapAction)(async (configFile, args = {}) => {
        (0, ctx_1.setArguments)(ctx, args);
        const { runCommand } = await Promise.resolve().then(() => __importStar(require('./tasks/run')));
        try {
            await runCommand(ctx, configFile);
        }
        catch (e) {
            (0, log_1.fatal)('Error running command', e);
        }
    }));
    program.addHelpCommand();
    program.arguments('[command]').action((0, cli_1.wrapAction)((_) => {
        program.outputHelp();
    }));
    program.parse(process.argv);
}
exports.runProgram = runProgram;
//# sourceMappingURL=index.js.map