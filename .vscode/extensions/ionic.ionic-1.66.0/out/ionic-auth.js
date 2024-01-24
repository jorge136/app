"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ionicSignup = exports.ionicLogin = void 0;
const context_variables_1 = require("./context-variables");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const telemetry_1 = require("./telemetry");
const logging_1 = require("./logging");
const vscode_1 = require("vscode");
const path_1 = require("path");
const child_process_1 = require("child_process");
/**
 * ionic login and signup commands
 * @param  {string} folder
 * @param  {vscode.ExtensionContext} context
 */
async function ionicLogin(folder, context) {
    const ifolder = (0, path_1.join)(folder, 'node_modules', '@ionic', 'cli', 'bin');
    try {
        if (vscode_1.env.uiKind == vscode_1.UIKind.Web) {
            vscode_1.window.showErrorMessage('The Codespaces browser editor has limited functionality. Click "Next" to continue.', 'Next');
            ionic_tree_provider_1.ionicState.skipAuth = true;
            await vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.isAnonymous, false);
            return;
        }
        await run(`npx ionic login --confirm`, ifolder);
        (0, telemetry_1.sendTelemetryEvent)(folder, telemetry_1.TelemetryEventType.Login, context);
    }
    catch (err) {
        vscode_1.window.showErrorMessage(err);
        ionic_tree_provider_1.ionicState.skipAuth = true;
        await vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.isAnonymous, false);
    }
}
exports.ionicLogin = ionicLogin;
async function ionicSignup(folder, context) {
    const ifolder = (0, path_1.join)(folder, 'node_modules', '@ionic', 'cli', 'bin');
    await run('npx ionic signup', ifolder);
    (0, telemetry_1.sendTelemetryEvent)(folder, telemetry_1.TelemetryEventType.SignUp, context);
}
exports.ionicSignup = ionicSignup;
async function run(command, folder) {
    return new Promise((resolve, reject) => {
        let out = '';
        const cmd = (0, child_process_1.exec)(command, { cwd: folder }, (error, stdout, stderror) => {
            if (stdout) {
                out += stdout;
                (0, logging_1.writeAppend)(out);
            }
            if (!error) {
                (0, logging_1.writeAppend)(out);
                resolve(out);
            }
            else {
                if (stderror) {
                    reject(stderror);
                }
                else {
                    resolve(out);
                }
            }
        });
        cmd.stdin.pipe(process.stdin);
    });
}
//# sourceMappingURL=ionic-auth.js.map