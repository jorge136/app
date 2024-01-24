"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalIonicConfig = exports.getIonicConfig = exports.sendTelemetryEvents = exports.sendTelemetryEvent = exports.TelemetryEventType = void 0;
const utilities_1 = require("./utilities");
const npm_model_1 = require("./npm-model");
const logging_1 = require("./logging");
const fs_1 = require("fs");
const path_1 = require("path");
const http_1 = require("http");
const os_1 = require("os");
var TelemetryEventType;
(function (TelemetryEventType) {
    TelemetryEventType["Packages"] = "VS Code Extension Packages";
    TelemetryEventType["Usage"] = "VS Code Extension Usage";
    TelemetryEventType["Login"] = "VS Code Extension Login";
    TelemetryEventType["SignUp"] = "VS Code Extension Sign Up";
})(TelemetryEventType = exports.TelemetryEventType || (exports.TelemetryEventType = {}));
function sendTelemetryEvent(folder, name, context) {
    const config = getIonicConfig(folder);
    if (!config.telemetry)
        return;
    sendTelemetry(config.telemetry, config.sessionId, name, {
        extension: context.extension.packageJSON.version,
    });
}
exports.sendTelemetryEvent = sendTelemetryEvent;
function sendTelemetryEvents(folder, project, packages, context) {
    var _a, _b;
    const config = getIonicConfig(folder);
    if (!config.telemetry)
        return;
    try {
        const sent = context.workspaceState.get(`packages-${project.name}`);
        if (sent != ((_a = project.modified) === null || _a === void 0 ? void 0 : _a.toUTCString())) {
            const packageList = [];
            const packageVersions = [];
            const plugins = [];
            if (packages != undefined) {
                for (const library of Object.keys(packages)) {
                    const info = packages[library];
                    packageVersions.push(`${library}@${info.version}`);
                    packageList.push(library);
                    if (info.depType == npm_model_1.PackageType.CordovaPlugin || info.depType == npm_model_1.PackageType.CapacitorPlugin) {
                        plugins.push(library);
                    }
                }
                sendTelemetry(config.telemetry, config.sessionId, TelemetryEventType.Packages, {
                    extension: context.extension.packageJSON.version,
                    name: project.name,
                    projectType: project.type,
                    packages: packageList,
                    packageVersions: packageVersions,
                    plugins: plugins,
                });
            }
            // Store the last time the package.json was modified so that we can send if it changes
            context.workspaceState.update(`packages-${project.name}`, (_b = project.modified) === null || _b === void 0 ? void 0 : _b.toUTCString());
        }
        const sentUsage = context.globalState.get(`lastusage`);
        if (!sentUsage || new Date().toLocaleDateString() !== sentUsage) {
            sendTelemetry(config.telemetry, config.sessionId, TelemetryEventType.Usage, {
                extension: context.extension.packageJSON.version,
            });
            // Store the last time the extension was used so we can report it daily
            context.globalState.update(`lastusage`, new Date().toLocaleDateString());
        }
    }
    catch (err) {
        (0, logging_1.writeWarning)(err);
    }
}
exports.sendTelemetryEvents = sendTelemetryEvents;
/**
 * Sends telemetry to Ionic
 * @param  {boolean} telemetry If false will not send
 * @param  {string} sessionId A session identifier
 * @param  {string} event_type Name of the event to send
 * @param  {any} payload Javascript object containing information to send
 */
function sendTelemetry(telemetry, sessionId, event_type, payload) {
    if (!telemetry)
        return;
    try {
        payload.event_type = event_type;
        payload.os_name = (0, os_1.platform)();
        payload.os_version = (0, os_1.release)();
        // Call POST https://api.ionicjs.com/events/metrics
        const now = new Date().toISOString();
        const metric = {
            name: 'vscode_ext',
            timestamp: now,
            session_id: sessionId,
            source: 'vscode_ext',
            value: payload,
        };
        const event = {
            metrics: [metric],
            sent_at: now,
        };
        const data = JSON.stringify(event);
        const options = {
            hostname: 'api.ionicjs.com',
            port: 443,
            path: '/events/metrics',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        };
        const req = (0, http_1.request)(options, (res) => {
            res.on('data', (d) => {
                console.log(d.toString());
            });
        });
        req.on('error', (error) => {
            console.error(error);
        });
        req.write(data);
        req.end();
    }
    catch (err) {
        console.error('Unable to send telemetry', err);
    }
}
/**
 * Gets the local folders ionic configuration to override telemetry if needed
 * @param  {string} folder
 * @returns IonicConfig
 */
function getIonicConfig(folder) {
    const config = getGlobalIonicConfig();
    const configFile = (0, path_1.join)(folder, 'ionic.config.json');
    if ((0, fs_1.existsSync)(configFile)) {
        const json = (0, fs_1.readFileSync)(configFile);
        const data = JSON.parse(json);
        if (data.telemetry) {
            config.telemetry = data.telemetry; // Override global with local setting
        }
    }
    config.sessionId = config['tokens.telemetry'];
    if (!config.sessionId) {
        config.sessionId = (0, utilities_1.generateUUID)();
    }
    return config;
}
exports.getIonicConfig = getIonicConfig;
/**
 * Look for ~/.ionic/config.json and return json object or default
 * @returns IonicConfig
 */
function getGlobalIonicConfig() {
    const configPath = (0, path_1.resolve)((0, os_1.homedir)(), '.ionic');
    const configFile = (0, path_1.join)(configPath, 'config.json');
    if ((0, fs_1.existsSync)(configFile)) {
        const json = (0, fs_1.readFileSync)(configFile);
        const data = JSON.parse(json);
        if (!data.telemetry) {
            data.telemetry = true; // Default is true for telemetry
        }
        return data;
    }
    else {
        return { telemetry: false, sessionId: undefined };
    }
}
exports.getGlobalIonicConfig = getGlobalIonicConfig;
/** INFO about telemtry
you can collect analytics/metrics/telemetry by posting an EventsSchema to https://api.ionicjs.com/events/metrics
the EventsSchema is defined here: https://github.com/ionic-team/appflow-core/blob/main/ionic_api_core/schema/schemas.py#L12-L24
the the CLI implementations are here: https://github.com/ionic-team/ionic-cli/blob/develop/packages/@ionic/cli/src/lib/telemetry.ts
https://github.com/ionic-team/capacitor/blob/main/cli/src/tasks/telemetry.ts
https://github.com/ionic-team/stencil/blob/main/src/cli/telemetry/telemetry.ts
the stencil CLI does something similar to collect a list of ionic (the company) packages: https://github.com/ionic-team/stencil/blob/main/src/cli/telemetry/telemetry.ts#L149-L192
{
  "metrics": [
    {
    "name": "vscode_ext",
    "session_id": "7257a836-8b5c-4250-844d-c9f01f0a0949",
    "source": "vscode_ext",
    "timestamp": "2022-02-24T19:56:56.773Z",
    "value": {
      "event_type": "actual_event_name",
      "os_name": "darwin",
      "os_version": "21.3.0",
  
      "arguments": ["--dev", "--watch", "--serve", "start"],
      "build": "20220124181123",
      "cpu_model": "Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz",
      "duration_ms": 56202,
      "has_app_pwa_config": false,
      "packages": ["@stencil/core@2.6.0", "@stencil/sass@1.4.1"],
      "packages_no_versions": ["@stencil/core", "@stencil/sass"],
      "rollup": "2.42.3",
      "stencil": "2.13.0",
      "system": "node 15.14.0",
      "system_major": "node 15",
      "targets": ["dist-custom-elements-bundle", "www", "dist-lazy", "copy", "dist-global-styles", "dist", "dist-types", "docs-readme", "angular"],
      "task": "build",
      "typescript": "4.3.5",
      "yarn": true
    }
    }
  ],
  "sent_at": "2022-02-24T19:56:56.773Z"
  }
*/
//# sourceMappingURL=telemetry.js.map