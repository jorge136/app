"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIonicCLI = exports.capacitorDevicesCommand = exports.capacitorRun = void 0;
const fs_1 = require("fs");
const analyzer_1 = require("./analyzer");
const build_configuration_1 = require("./build-configuration");
const capacitor_platform_1 = require("./capacitor-platform");
const command_name_1 = require("./command-name");
const logging_1 = require("./logging");
const ionic_build_1 = require("./ionic-build");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const live_reload_1 = require("./live-reload");
const monorepo_1 = require("./monorepo");
const node_commands_1 = require("./node-commands");
const gradle_to_json_1 = require("./gradle-to-json");
const workspace_state_1 = require("./workspace-state");
const vscode_1 = require("vscode");
const path_1 = require("path");
/**
 * Creates the command line to run for Capacitor
 * @param  {CapacitorPlatform} platform
 * @param  {Project} project
 * @returns string
 */
async function capacitorRun(project, platform) {
    let preop = '';
    let rebuilt = false;
    let noSync = false;
    // If the user modified something in the editor then its likely they need to rebuild the app before running
    if (ionic_tree_provider_1.ionicState.projectDirty) {
        (0, logging_1.writeIonic)('Rebuilding as you changed your project...');
        preop = (await (0, ionic_build_1.ionicBuild)(project, undefined, platform)) + ' && ';
        rebuilt = true;
    }
    else {
        preop = (0, node_commands_1.preflightNPMCheck)(project);
    }
    noSync = ionic_tree_provider_1.ionicState.syncDone.includes(platform);
    ionic_tree_provider_1.ionicState.refreshDebugDevices = true;
    ionic_tree_provider_1.ionicState.lastRun = platform;
    switch (project.repoType) {
        case monorepo_1.MonoRepoType.none:
        case monorepo_1.MonoRepoType.folder:
        case monorepo_1.MonoRepoType.pnpm:
        case monorepo_1.MonoRepoType.yarn:
        case monorepo_1.MonoRepoType.lerna:
        case monorepo_1.MonoRepoType.npm:
            return preop + (await capRun(platform, project.repoType, rebuilt, noSync, project));
        case monorepo_1.MonoRepoType.nx:
            return preop + nxRun(platform, project.repoType, rebuilt, noSync, project);
        default:
            throw new Error('Unsupported Monorepo type');
    }
}
exports.capacitorRun = capacitorRun;
function capacitorDevicesCommand(platform, packageManager) {
    const ionic = useIonicCLI() ? 'ionic ' : '';
    return `${(0, node_commands_1.npx)(packageManager)} ${ionic}cap run ${platform} --list`;
}
exports.capacitorDevicesCommand = capacitorDevicesCommand;
function useIonicCLI() {
    if ((0, analyzer_1.exists)('@capacitor/cli')) {
        return false;
    }
    return (0, analyzer_1.exists)('@ionic/cli');
}
exports.useIonicCLI = useIonicCLI;
async function capRun(platform, repoType, noBuild, noSync, project) {
    let liveReload = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.liveReload);
    const externalIP = !(0, workspace_state_1.getExtSetting)(workspace_state_1.ExtensionSetting.internalAddress);
    const httpsForWeb = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.httpsForWeb);
    const prod = vscode_1.workspace.getConfiguration('ionic').get('buildForProduction');
    if (liveReload && project.repoType == monorepo_1.MonoRepoType.npm) {
        (0, logging_1.writeError)('Live Reload is not supported with npm workspaces. Ignoring the live reload option');
        liveReload = false;
    }
    let capRunFlags = liveReload ? ' --livereload' : '';
    if (liveReload && (0, analyzer_1.exists)('@ionic-enterprise/auth') && (0, analyzer_1.isLess)('@ionic-enterprise/auth', '3.9.4')) {
        capRunFlags = '';
        // @ionic-enterprise/auth gets a crypt error when running with an external IP address. So avoid the issue
        (0, logging_1.writeIonic)('Live Update was ignored as you have less than v3.9.4 of @ionic-enterprise/auth in your project');
    }
    const ionic = useIonicCLI() || liveReload ? 'ionic ' : '';
    if (externalIP) {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += '--external';
    }
    if (ionic != '' && prod) {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += '--prod';
    }
    // Live reload clashes with --no-build
    if (noBuild && !liveReload) {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += '--no-build';
    }
    if (noSync) {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += '--no-sync';
    }
    if (ionic_tree_provider_1.ionicState.project && ionic_tree_provider_1.ionicState.project != 'app') {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += `--project=${ionic_tree_provider_1.ionicState.project}`;
    }
    capRunFlags += (0, build_configuration_1.getConfigurationArgs)();
    const flavors = await getFlavors(platform, project);
    if (flavors == undefined)
        return;
    capRunFlags += flavors;
    capRunFlags += command_name_1.InternalCommand.publicHost;
    if (httpsForWeb) {
        if (capRunFlags.length >= 0)
            capRunFlags += ' ';
        capRunFlags += '--ssl';
        if (!(0, fs_1.existsSync)((0, live_reload_1.certPath)('crt'))) {
            (0, live_reload_1.liveReloadSSL)(project);
            return '';
        }
        capRunFlags += ` -- --ssl-cert='${(0, live_reload_1.certPath)('crt')}'`;
        capRunFlags += ` --ssl-key='${(0, live_reload_1.certPath)('key')}'`;
    }
    const pre = repoType == monorepo_1.MonoRepoType.npm ||
        repoType == monorepo_1.MonoRepoType.folder ||
        repoType == monorepo_1.MonoRepoType.pnpm ||
        repoType == monorepo_1.MonoRepoType.yarn ||
        repoType == monorepo_1.MonoRepoType.lerna
        ? command_name_1.InternalCommand.cwd
        : '';
    return `${pre}${(0, node_commands_1.npx)(project.packageManager)} ${ionic}cap run ${platform} --target=${command_name_1.InternalCommand.target} ${capRunFlags}`;
}
async function nxRun(platform, repoType, noBuild, noSync, project) {
    var _a;
    if ((_a = project.monoRepo) === null || _a === void 0 ? void 0 : _a.isNXStandalone) {
        return await capRun(platform, repoType, noBuild, noSync, project);
    }
    // Note: This may change, see: https://github.com/nxtend-team/nxtend/issues/490
    return `${(0, node_commands_1.npx)(project.packageManager)} nx run ${project.monoRepo.name}:cap --cmd "run ${platform} --target=${command_name_1.InternalCommand.target}"`;
}
async function getFlavors(platform, prj) {
    var _a;
    if (platform == capacitor_platform_1.CapacitorPlatform.ios) {
        return '';
    }
    if (ionic_tree_provider_1.ionicState.flavors == undefined) {
        ionic_tree_provider_1.ionicState.flavors = [];
        const buildGradle = (0, path_1.join)(prj.projectFolder(), 'android', 'app', 'build.gradle');
        const data = (0, gradle_to_json_1.gradleToJson)(buildGradle);
        if ((_a = data === null || data === void 0 ? void 0 : data.android) === null || _a === void 0 ? void 0 : _a.productFlavors) {
            const list = Object.keys(data.android.productFlavors);
            if ((list === null || list === void 0 ? void 0 : list.length) == 0) {
                return '';
            }
            ionic_tree_provider_1.ionicState.flavors = list;
        }
    }
    if (ionic_tree_provider_1.ionicState.flavors.length == 0) {
        return '';
    }
    const selection = await vscode_1.window.showQuickPick(ionic_tree_provider_1.ionicState.flavors, { placeHolder: 'Select the Android Flavor to run' });
    if (!selection)
        return undefined;
    return ` --flavor=${selection}`;
}
//# sourceMappingURL=capacitor-run.js.map