"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequest = exports.showProgress = exports.toTitleCase = exports.showMessage = exports.pluralize = exports.doDoes = exports.plural = exports.asAppId = exports.generateUUID = exports.replaceStringIn = exports.replaceAllStringIn = exports.setAllStringIn = exports.setStringIn = exports.getStringFrom = exports.alt = exports.getPackageJSON = exports.runWithProgress = exports.channelShow = exports.getRunOutput = exports.stripJSON = exports.debugSkipFiles = exports.openUri = exports.replaceAll = exports.delay = exports.run = exports.passesFilter = exports.passesRemoteFilter = exports.stopPublishing = exports.isWindows = exports.confirm = exports.estimateRunTime = void 0;
const tip_1 = require("./tip");
const editor_preview_1 = require("./editor-preview");
const error_handler_1 = require("./error-handler");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const monorepo_1 = require("./monorepo");
const command_name_1 = require("./command-name");
const analyzer_1 = require("./analyzer");
const ionic_init_1 = require("./ionic-init");
const https_1 = require("https");
const workspace_state_1 = require("./workspace-state");
const logging_1 = require("./logging");
const web_configuration_1 = require("./web-configuration");
const discovery_1 = require("./discovery");
const path_1 = require("path");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const log_server_1 = require("./log-server");
const nexus_browser_1 = require("./nexus-browser");
const vscode_1 = require("vscode");
const opTiming = {};
let pub;
// Any logged lines that start with these are filtered out
const filteredLines = [
    '▲ [WARNING] The glob pattern import("./**/*.entry.js*") ',
    '  :host-context([dir=rtl])',
    '  .ion-float-start:dir(rtl)',
    '▲ [WARNING] 20 rules skipped',
];
function estimateRunTime(command) {
    const idx = command.replace(command_name_1.InternalCommand.cwd, '');
    if (opTiming[idx]) {
        return opTiming[idx];
    }
    else {
        return undefined;
    }
}
exports.estimateRunTime = estimateRunTime;
async function confirm(message, confirmButton) {
    const selection = await vscode_1.window.showInformationMessage(message, confirmButton, 'Cancel');
    return selection == confirmButton;
}
exports.confirm = confirm;
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
function runOptions(command, folder, shell) {
    const env = { ...process.env };
    const javaHome = (0, workspace_state_1.getExtSetting)(workspace_state_1.ExtensionSetting.javaHome);
    // Cocoapods required lang set to en_US.UTF-8 (when capacitor sync or run ios is done)
    if (!env.LANG) {
        env.LANG = 'en_US.UTF-8';
    }
    if (javaHome) {
        env.JAVA_HOME = javaHome;
    }
    else if (!env.JAVA_HOME && !isWindows()) {
        const jHome = '/Applications/Android Studio.app/Contents/jre/Contents/Home';
        if ((0, fs_1.existsSync)(jHome)) {
            env.JAVA_HOME = jHome;
        }
    }
    return { cwd: folder, shell: shell ? shell : ionic_tree_provider_1.ionicState.shell, encoding: 'utf8', env: env, maxBuffer: 10485760 };
}
function stopPublishing() {
    if (pub) {
        pub.stop();
    }
}
exports.stopPublishing = stopPublishing;
function passesRemoteFilter(msg, logFilters) {
    return passesFilter(msg, logFilters, true);
}
exports.passesRemoteFilter = passesRemoteFilter;
function passesFilter(msg, logFilters, isRemote) {
    for (const filteredLine of filteredLines) {
        if (msg.startsWith(filteredLine)) {
            return false;
        }
    }
    if (!logFilters)
        return true;
    for (const logFilter of logFilters) {
        if (logFilter == '' && !isRemote) {
            // If we're filtering out most logs then provide exception
            if (!msg.startsWith('[') || msg.startsWith('[info]') || msg.startsWith('[INFO]')) {
                if (new RegExp('Warn|warn|Error|error').test(msg)) {
                    // Its not info so allow
                }
                else {
                    return false;
                }
            }
        }
        else if (logFilter == 'console' && isRemote) {
            // Remote logging sends console statements as [info|warn|error]
            if (msg.startsWith('[info]') || msg.startsWith('[warn]') || msg.startsWith('[error]')) {
                return false;
            }
        }
        else {
            if (msg === null || msg === void 0 ? void 0 : msg.includes(logFilter)) {
                return false;
            }
        }
    }
    return true;
}
exports.passesFilter = passesFilter;
async function run(folder, command, cancelObject, features, runPoints, progress, ionicProvider, output, suppressInfo, auxData) {
    if (command == command_name_1.InternalCommand.removeCordova) {
        return await removeCordovaFromPackageJSON(folder);
    }
    if (command == command_name_1.InternalCommand.ionicInit) {
        await (0, ionic_init_1.ionicInit)(folder);
        return false;
    }
    if (command.includes(command_name_1.InternalCommand.cwd)) {
        command = replaceAll(command, command_name_1.InternalCommand.cwd, '');
        // Change the work directory for monorepos as folder is the root folder
        folder = (0, monorepo_1.getMonoRepoFolder)(ionic_tree_provider_1.ionicState.workspace, folder);
    }
    command = qualifyCommand(command, folder);
    let findLocalUrl = features.includes(tip_1.TipFeature.debugOnWeb) || features.includes(tip_1.TipFeature.welcome);
    let findExternalUrl = features.includes(tip_1.TipFeature.welcome);
    let localUrl;
    let externalUrl;
    let launched = false;
    async function launchUrl() {
        if (localUrl && externalUrl) {
            launched = true;
            launch(localUrl, externalUrl);
        }
        else if (!externalUrl) {
            await delay(500);
            if (!launched) {
                launched = true;
                launch(localUrl, externalUrl);
            }
        }
    }
    function launch(localUrl, externalUrl) {
        const config = (0, web_configuration_1.getWebConfiguration)();
        if (externalUrl) {
            if (pub) {
                pub.stop();
            }
            else {
                pub = new discovery_1.Publisher('devapp', auxData, portFrom(externalUrl), externalUrl.startsWith('https'));
            }
            pub.start().then(() => {
                if (config == web_configuration_1.WebConfigSetting.welcome || config == web_configuration_1.WebConfigSetting.welcomeNoBrowser) {
                    (0, nexus_browser_1.qrView)(externalUrl);
                }
            });
        }
        // Make sure remote logger service is running
        (0, log_server_1.startStopLogServer)(undefined);
        if (features.includes(tip_1.TipFeature.debugOnWeb)) {
            (0, editor_preview_1.debugBrowser)(localUrl, true);
            return;
        }
        switch (config) {
            case web_configuration_1.WebConfigSetting.editor:
                (0, editor_preview_1.viewInEditor)(localUrl);
                break;
            case web_configuration_1.WebConfigSetting.browser:
                break;
            default: {
                //qrView(externalUrl);
                //viewAsQR(localUrl, externalUrl);
                break;
            }
        }
    }
    function portFrom(externalUrl) {
        const tmp = externalUrl.split(':');
        if (tmp.length < 3)
            return 8100;
        return parseInt(tmp[2]);
    }
    const logFilters = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.logFilter);
    let logs = [];
    return new Promise((resolve, reject) => {
        const start_time = process.hrtime();
        const interval = setInterval(() => {
            if (cancelObject === null || cancelObject === void 0 ? void 0 : cancelObject.cancelled) {
                clearInterval(interval);
                reject(`${command} Cancelled`);
            }
        }, 500);
        const proc = (0, child_process_1.exec)(command, runOptions(command, folder), async (error, stdout, stdError) => {
            let retry = false;
            if (error) {
                console.error(error);
            }
            // Quirk of windows robocopy is that it logs errors/exit code on success
            if (!error || command.includes('robocopy')) {
                const end_time = process.hrtime(start_time);
                if (!(cancelObject === null || cancelObject === void 0 ? void 0 : cancelObject.cancelled)) {
                    opTiming[command] = end_time[0]; // Number of seconds
                }
                // Allows handling of linting and tests
                retry = await (0, error_handler_1.handleError)(undefined, logs, folder);
                clearInterval(interval);
                if (output) {
                    output.success = true;
                }
                resolve(retry);
            }
            else {
                if (!(cancelObject === null || cancelObject === void 0 ? void 0 : cancelObject.cancelled)) {
                    retry = await (0, error_handler_1.handleError)(stdError, logs, folder);
                }
                clearInterval(interval);
                if (retry) {
                    if (output) {
                        output.success = true;
                    }
                    resolve(retry);
                }
                else {
                    if (output) {
                        output.success = false;
                    }
                    reject(`${command} Failed`);
                }
            }
        });
        proc.stdout.on('data', (data) => {
            if (data) {
                if (output) {
                    output.output += data;
                }
                const logLines = data.split('\n');
                logs = logs.concat(logLines);
                if (findLocalUrl) {
                    if (data.includes('http')) {
                        const url = checkForUrls(data, [
                            'Local:',
                            'On Your Network:',
                            'open your browser on ',
                            '> Local:',
                            '➜  Local:', // AnalogJs
                        ]);
                        if (url) {
                            findLocalUrl = false;
                            localUrl = url;
                            launchUrl();
                        }
                    }
                }
                if (findExternalUrl) {
                    if (data.includes('http')) {
                        const url = checkForUrls(data, [
                            'External:',
                            'On Your Network:',
                            '> Network:',
                            '➜  Network:',
                            'open your browser on ', // NX
                        ]);
                        if (url) {
                            findExternalUrl = false;
                            externalUrl = url;
                            launchUrl();
                        }
                    }
                }
                // Based on found text logged change the progress message in the status bar
                if (runPoints) {
                    for (const runPoint of runPoints) {
                        if (data.includes(runPoint.text)) {
                            progress.report({ message: runPoint.title });
                            if (runPoint.refresh && ionicProvider) {
                                ionicProvider.refresh();
                            }
                        }
                    }
                }
                for (const logLine of logLines) {
                    if (logLine.startsWith('[capacitor]')) {
                        if (!suppressInfo && passesFilter(logLine, logFilters, false)) {
                            (0, logging_1.write)(logLine.replace('[capacitor]', ''));
                        }
                    }
                    else if (logLine && !suppressInfo) {
                        const uncolored = logLine.replace(/[\033\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                        if (passesFilter(uncolored, logFilters, false)) {
                            (0, logging_1.write)(uncolored);
                        }
                    }
                }
                focusOutput();
            }
        });
        proc.stderr.on('data', (data) => {
            if (!suppressInfo) {
                const uncolored = data.replace(/[\033\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                if (passesFilter(uncolored, logFilters, false)) {
                    (0, logging_1.write)(uncolored);
                }
            }
            focusOutput();
        });
        if (cancelObject) {
            cancelObject.proc = proc;
        }
    });
}
exports.run = run;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
function checkForUrls(data, list) {
    const colorLess = stripColors(data);
    const lines = colorLess.split('\n');
    for (const line of lines) {
        for (const text of list) {
            const url = checkForUrl(line, text);
            if (url) {
                return url;
            }
        }
    }
}
function checkForUrl(data, text) {
    if (data.includes(text) && data.includes('http')) {
        let url = getStringFrom(data, text, '\n').trim();
        if (url && url.endsWith(' **')) {
            // This is for NX which logs urls like http://192.168.0.1:4200/ **
            url = url.substring(0, url.length - 3);
        }
        if (url && url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        if (url && url.startsWith('http://[')) {
            return undefined; // IPV6 is not supported (nuxt/vite projects emit this)
        }
        return url;
    }
}
function stripColors(s) {
    // [36mhttp://localhost:[1m3002[22m/[39m
    return replaceAllStringIn(s, '[', 'm', '');
}
/**
 * This ensures that the focus is not pushed to the output window while you are editing a document
 */
function focusOutput() {
    if (ionic_tree_provider_1.ionicState.outputIsFocused)
        return;
    channelShow();
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
}
exports.replaceAll = replaceAll;
// This will use the local @ionic/cli from the extension if one is not installed locally
function qualifyCommand(command, folder) {
    if (command.startsWith('npx ionic')) {
        if (!(0, analyzer_1.exists)('@ionic/cli')) {
            const cli = (0, path_1.join)(ionic_tree_provider_1.ionicState.context.extensionPath, 'node_modules/@ionic/cli/bin');
            if ((0, fs_1.existsSync)(cli)) {
                command = command.replace('npx ionic', 'node "' + (0, path_1.join)(cli, 'ionic') + '"');
            }
        }
    }
    if (process.env.NVM_DIR) {
        if (!ionic_tree_provider_1.ionicState.nvm) {
            const nvmrc = (0, path_1.join)(folder, '.nvmrc');
            if ((0, fs_1.existsSync)(nvmrc)) {
                const txt = (0, fs_1.readFileSync)(nvmrc, 'utf-8').replace('\n', '');
                ionic_tree_provider_1.ionicState.nvm = `source ${process.env.NVM_DIR}/nvm.sh && nvm use`;
                (0, logging_1.writeIonic)(`Detected nvm (${txt}) for this project.`);
            }
        }
        if (ionic_tree_provider_1.ionicState.nvm) {
            return `${ionic_tree_provider_1.ionicState.nvm} && ${command}`;
        }
    }
    return command;
}
async function openUri(uri) {
    const ob = (uri === null || uri === void 0 ? void 0 : uri.includes('//')) ? vscode_1.Uri.parse(uri) : vscode_1.Uri.file(uri);
    await vscode_1.commands.executeCommand('vscode.open', ob);
}
exports.openUri = openUri;
function debugSkipFiles() {
    try {
        let debugSkipFiles = vscode_1.workspace.getConfiguration('ionic').get('debugSkipFiles');
        if (!debugSkipFiles) {
            return undefined;
        }
        if (debugSkipFiles.includes("'")) {
            debugSkipFiles = debugSkipFiles.replace(/'/g, '"');
        }
        const list = JSON.parse(debugSkipFiles);
        if (!Array.isArray(list)) {
            throw new Error('debugSkipFiles not a valid array');
        }
    }
    catch (error) {
        vscode_1.window.showErrorMessage(`Unable to parse debugSkipFiles variable. Ensure it is a valid JSON array. ${error}`);
        return undefined;
    }
}
exports.debugSkipFiles = debugSkipFiles;
function stripJSON(txt, startText) {
    // This removed output from nvm from json
    const idx = txt.indexOf(startText);
    if (idx != -1) {
        return txt.substring(idx);
    }
    return txt;
}
exports.stripJSON = stripJSON;
async function getRunOutput(command, folder, shell, hideErrors, ignoreErrors) {
    return new Promise((resolve, reject) => {
        let out = '';
        if (command.includes(command_name_1.InternalCommand.cwd)) {
            command = replaceAll(command, command_name_1.InternalCommand.cwd, '');
            // Change the work directory for monorepos as folder is the root folder
            folder = (0, monorepo_1.getMonoRepoFolder)(ionic_tree_provider_1.ionicState.workspace, folder);
        }
        command = qualifyCommand(command, folder);
        console.log(`> ${replaceAll(command, command_name_1.InternalCommand.cwd, '')}`);
        (0, child_process_1.exec)(command, runOptions(command, folder, shell), (error, stdout, stdError) => {
            if (stdout) {
                out += stdout;
            }
            if (!error) {
                if (out == '' && stdError) {
                    out += stdError;
                }
                resolve(out);
            }
            else {
                if (stdError) {
                    if (!hideErrors) {
                        (0, logging_1.writeError)(stdError);
                    }
                    else {
                        console.error(stdError);
                    }
                    if (ignoreErrors) {
                        resolve(out);
                    }
                    else {
                        reject(stdError);
                    }
                }
                else {
                    // This is to fix a bug in npm outdated where it returns an exit code when it succeeds
                    resolve(out);
                }
            }
        });
    });
}
exports.getRunOutput = getRunOutput;
function channelShow() {
    if (ionic_tree_provider_1.ionicState.channelFocus) {
        (0, logging_1.showOutput)();
        ionic_tree_provider_1.ionicState.channelFocus = false;
    }
}
exports.channelShow = channelShow;
async function runWithProgress(command, title, folder, output) {
    let result = false;
    await vscode_1.window.withProgress({
        location: vscode_1.ProgressLocation.Notification,
        title,
        cancellable: true,
    }, async (progress, token) => {
        const cancelObject = { proc: undefined, cancelled: false };
        result = await run(folder, command, cancelObject, [], [], progress, undefined, output, false);
    });
    return result;
}
exports.runWithProgress = runWithProgress;
function getPackageJSON(folder) {
    const filename = (0, monorepo_1.getPackageJSONFilename)(folder);
    if (!(0, fs_1.existsSync)(filename)) {
        return { name: undefined, displayName: undefined, description: undefined, version: undefined, scripts: {} };
    }
    return JSON.parse((0, fs_1.readFileSync)(filename, 'utf8'));
}
exports.getPackageJSON = getPackageJSON;
function alt(key) {
    return isWindows() ? `Alt+${key}` : `⌥+${key}`;
}
exports.alt = alt;
function getStringFrom(data, start, end) {
    const foundIdx = data.lastIndexOf(start);
    if (foundIdx == -1) {
        return undefined;
    }
    const idx = foundIdx + start.length;
    const edx = data.indexOf(end, idx);
    if (edx == -1)
        return data.substring(idx);
    return data.substring(idx, edx);
}
exports.getStringFrom = getStringFrom;
function setStringIn(data, start, end, replacement) {
    const foundIdx = data.lastIndexOf(start);
    if (foundIdx == -1) {
        return data;
    }
    const idx = foundIdx + start.length;
    return data.substring(0, idx) + replacement + data.substring(data.indexOf(end, idx));
}
exports.setStringIn = setStringIn;
function setAllStringIn(data, start, end, replacement) {
    let position = 0;
    let result = data;
    let replaced = true;
    while (replaced) {
        const foundIdx = result.indexOf(start, position);
        if (foundIdx == -1) {
            replaced = false;
        }
        else {
            const idx = foundIdx + start.length;
            position = idx + replacement.length;
            const ndx = result.indexOf(end, idx);
            if (ndx == -1) {
                replaced = false;
            }
            else {
                result = result.substring(0, idx) + replacement + result.substring(ndx);
            }
        }
    }
    return result;
}
exports.setAllStringIn = setAllStringIn;
function replaceAllStringIn(data, start, end, replacement) {
    let position = 0;
    let result = data;
    let replaced = true;
    while (replaced) {
        const foundIdx = result.indexOf(start, position);
        if (foundIdx == -1) {
            replaced = false;
        }
        else {
            const idx = foundIdx;
            position = idx + replacement.length;
            result = result.substring(0, idx) + replacement + result.substring(result.indexOf(end, idx) + end.length);
        }
    }
    return result;
}
exports.replaceAllStringIn = replaceAllStringIn;
function replaceStringIn(data, start, end, replacement) {
    const foundIdx = data.lastIndexOf(start);
    if (foundIdx == -1) {
        return data;
    }
    const idx = foundIdx;
    return data.substring(0, idx) + replacement + data.substring(data.indexOf(end, idx) + end.length);
}
exports.replaceStringIn = replaceStringIn;
function generateUUID() {
    return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
}
exports.generateUUID = generateUUID;
/**
 * Given user input convert to a usable app identifier
 * @param  {string} name
 * @returns string
 */
function asAppId(name) {
    if (!name)
        return 'Unknown';
    name = name.split('-').join('.');
    name = name.split(' ').join('.');
    if (!name.includes('.')) {
        name = 'com.' + name; // Must have at least a . in the name
    }
    return name;
}
exports.asAppId = asAppId;
function plural(name, count) {
    if (count <= 1) {
        if (name == 'are')
            return 'is';
    }
    if (name == 'Dependency') {
        return 'Dependencies';
    }
    else if (name == 'Plugin') {
        return 'Cordova Plugins';
    }
    return name + 's';
}
exports.plural = plural;
function doDoes(count) {
    return count > 1 ? 'does' : 'do';
}
exports.doDoes = doDoes;
function pluralize(name, count) {
    if (count) {
        return count <= 1 ? `${count} ${name}` : `${count} ${name}s`;
    }
}
exports.pluralize = pluralize;
async function showMessage(message, ms) {
    vscode_1.window.withProgress({
        location: vscode_1.ProgressLocation.Notification,
        title: message,
        cancellable: false,
    }, async () => {
        await timeout(ms); // Show the message for 3 seconds
    });
}
exports.showMessage = showMessage;
function toTitleCase(text) {
    return text
        .replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    })
        .trim();
}
exports.toTitleCase = toTitleCase;
async function showProgress(message, func) {
    return await vscode_1.window.withProgress({
        location: vscode_1.ProgressLocation.Notification,
        title: `${message}`,
        cancellable: false,
    }, async (progress, token) => {
        return await func();
    });
}
exports.showProgress = showProgress;
function httpRequest(method, host, path, postData) {
    const params = {
        host,
        port: 443,
        method,
        path,
    };
    return new Promise(function (resolve, reject) {
        const req = (0, https_1.request)(params, function (res) {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            let body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('close', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                }
                catch (e) {
                    reject(e);
                }
                resolve(body);
            });
            res.on('end', function () {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                }
                catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        req.setHeader('User-Agent', 'Ionic VS Code Extension (https://capacitorjs.com/docs/vscode/getting-started)');
        req.setHeader('Accept', '*/*');
        req.on('error', function (err) {
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}
exports.httpRequest = httpRequest;
function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function removeCordovaFromPackageJSON(folder) {
    return new Promise((resolve, reject) => {
        try {
            const filename = (0, path_1.join)(folder, 'package.json');
            const packageFile = JSON.parse((0, fs_1.readFileSync)(filename, 'utf8'));
            packageFile.cordova = undefined;
            (0, fs_1.writeFileSync)(filename, JSON.stringify(packageFile, undefined, 2));
            // Also replace cordova in ionic.config.json
            const iFilename = (0, path_1.join)(folder, 'ionic.config.json');
            if ((0, fs_1.existsSync)(iFilename)) {
                const ionicConfig = JSON.parse((0, fs_1.readFileSync)(iFilename, 'utf8'));
                if (ionicConfig.integrations.cordova) {
                    delete ionicConfig.integrations.cordova;
                    ionicConfig.integrations.capacitor = new Object();
                }
                (0, fs_1.writeFileSync)(iFilename, JSON.stringify(ionicConfig, undefined, 2));
            }
            resolve(false);
        }
        catch (err) {
            reject(err);
        }
    });
}
//# sourceMappingURL=utilities.js.map