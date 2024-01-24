"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectExternalIPAddress = exports.ionicServe = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const build_configuration_1 = require("./build-configuration");
const command_name_1 = require("./command-name");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const live_reload_1 = require("./live-reload");
const monorepo_1 = require("./monorepo");
const node_commands_1 = require("./node-commands");
const live_reload_2 = require("./live-reload");
const workspace_state_1 = require("./workspace-state");
const web_configuration_1 = require("./web-configuration");
const vscode_1 = require("vscode");
/**
 * Create the ionic serve command
 * @returns string
 */
async function ionicServe(project, dontOpenBrowser) {
    ionic_tree_provider_1.ionicState.lastRun = undefined;
    switch (project.repoType) {
        case monorepo_1.MonoRepoType.none:
            return ionicCLIServe(project, dontOpenBrowser);
        case monorepo_1.MonoRepoType.nx:
            return nxServe(project);
        case monorepo_1.MonoRepoType.npm:
        case monorepo_1.MonoRepoType.yarn:
        case monorepo_1.MonoRepoType.lerna:
        case monorepo_1.MonoRepoType.pnpm:
        case monorepo_1.MonoRepoType.folder:
            return command_name_1.InternalCommand.cwd + ionicCLIServe(project, dontOpenBrowser);
        default:
            throw new Error('Unsupported Monorepo type');
    }
}
exports.ionicServe = ionicServe;
function ionicCLIServe(project, dontOpenBrowser) {
    const preop = (0, node_commands_1.preflightNPMCheck)(project);
    const httpsForWeb = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.httpsForWeb);
    const webConfig = (0, web_configuration_1.getWebConfiguration)();
    const externalIP = !(0, workspace_state_1.getExtSetting)(workspace_state_1.ExtensionSetting.internalAddress);
    const defaultPort = vscode_1.workspace.getConfiguration('ionic').get('defaultPort');
    let serveFlags = '';
    if (webConfig == web_configuration_1.WebConfigSetting.editor || webConfig == web_configuration_1.WebConfigSetting.welcomeNoBrowser || dontOpenBrowser) {
        serveFlags += ' --no-open';
    }
    if (externalIP) {
        serveFlags += ' --external';
    }
    if (defaultPort && defaultPort !== 8100) {
        serveFlags += ` --port=${defaultPort}`;
    }
    if (ionic_tree_provider_1.ionicState.project) {
        serveFlags += ` --project=${ionic_tree_provider_1.ionicState.project}`;
    }
    serveFlags += (0, build_configuration_1.getConfigurationArgs)(dontOpenBrowser);
    if (httpsForWeb) {
        serveFlags += ' --ssl';
        if (!(0, fs_1.existsSync)((0, live_reload_1.certPath)('crt'))) {
            (0, live_reload_2.liveReloadSSL)(project);
            return '';
        }
        serveFlags += ` -- --ssl-cert='${(0, live_reload_1.certPath)('crt')}'`;
        serveFlags += ` --ssl-key='${(0, live_reload_1.certPath)('key')}'`;
    }
    return `${preop}${(0, node_commands_1.npx)(project.packageManager)} ionic serve${serveFlags}`;
}
function nxServe(project) {
    let serveFlags = '';
    const externalIP = !(0, workspace_state_1.getExtSetting)(workspace_state_1.ExtensionSetting.internalAddress);
    if (externalIP) {
        const list = getAddresses();
        if (list.length == 1) {
            serveFlags += ` --host=${list[0]}`;
        }
        else {
            serveFlags += ' --host=0.0.0.0';
        }
    }
    return `${(0, node_commands_1.npx)(project.packageManager)} nx serve ${project.monoRepo.name}${serveFlags}`;
}
async function selectExternalIPAddress() {
    const liveReload = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.liveReload);
    const externalIP = !(0, workspace_state_1.getExtSetting)(workspace_state_1.ExtensionSetting.internalAddress);
    if (!externalIP && !liveReload) {
        return;
    }
    const list = getAddresses();
    if (list.length <= 1) {
        return;
    }
    const lastIPAddress = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.lastIPAddress);
    for (const address of list) {
        if (address == lastIPAddress) {
            return lastIPAddress;
        }
    }
    const selected = await vscode_1.window.showQuickPick(list, {
        placeHolder: 'Select the external network address to use',
    });
    if (selected) {
        (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.lastIPAddress, selected);
    }
    return selected;
}
exports.selectExternalIPAddress = selectExternalIPAddress;
function getAddresses() {
    const nets = (0, os_1.networkInterfaces)();
    const result = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // Skip over link-local addresses (same as Ionic CLI)
            if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
                result.push(net.address);
            }
        }
    }
    return result;
}
//# sourceMappingURL=ionic-serve.js.map