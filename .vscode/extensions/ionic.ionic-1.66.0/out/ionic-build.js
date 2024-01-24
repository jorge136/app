"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ionicBuild = void 0;
const monorepo_1 = require("./monorepo");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const command_name_1 = require("./command-name");
const node_commands_1 = require("./node-commands");
const analyzer_1 = require("./analyzer");
const build_configuration_1 = require("./build-configuration");
const vscode_1 = require("vscode");
/**
 * Creates the ionic build command
 * @param  {Project} project
 * @returns string
 */
async function ionicBuild(project, configurationArg, platform) {
    const preop = (0, node_commands_1.preflightNPMCheck)(project);
    ionic_tree_provider_1.ionicState.projectDirty = false;
    const prod = vscode_1.workspace.getConfiguration('ionic').get('buildForProduction');
    let args = configurationArg ? configurationArg : '';
    if (ionic_tree_provider_1.ionicState.project) {
        args += ` --project=${ionic_tree_provider_1.ionicState.project}`;
    }
    const additionalArgs = (0, build_configuration_1.getConfigurationArgs)(false);
    if (additionalArgs) {
        args += additionalArgs;
    }
    switch (project.repoType) {
        case monorepo_1.MonoRepoType.none:
            return `${preop}${ionicCLIBuild(prod, project, args, platform)}`;
        case monorepo_1.MonoRepoType.npm:
            return `${command_name_1.InternalCommand.cwd}${preop}${ionicCLIBuild(prod, project, args, platform)}`;
        case monorepo_1.MonoRepoType.nx:
            return `${preop}${nxBuild(prod, project, args)}`;
        case monorepo_1.MonoRepoType.folder:
        case monorepo_1.MonoRepoType.yarn:
        case monorepo_1.MonoRepoType.lerna:
        case monorepo_1.MonoRepoType.pnpm:
            return `${command_name_1.InternalCommand.cwd}${preop}${ionicCLIBuild(prod, project, args, platform)}`;
        default:
            throw new Error('Unsupported Monorepo type');
    }
}
exports.ionicBuild = ionicBuild;
function ionicCLIBuild(prod, project, configurationArg, platform) {
    let cmd = `${(0, node_commands_1.npx)(project.packageManager)} ionic build`;
    if (configurationArg) {
        cmd += ` ${configurationArg}`;
    }
    else if (prod) {
        cmd += ' --prod';
    }
    if (platform || (0, analyzer_1.exists)('@capacitor/ios') || (0, analyzer_1.exists)('@capacitor/android')) {
        cmd += ` && ${(0, node_commands_1.npx)(project.packageManager)} cap copy`;
        if (platform)
            cmd += ` ${platform}`;
    }
    return cmd;
}
function nxBuild(prod, project, configurationArg) {
    let cmd = `${(0, node_commands_1.npx)(project.packageManager)} nx build ${project.monoRepo.name}`;
    if (configurationArg) {
        cmd += ` ${configurationArg}`;
    }
    else if (prod) {
        cmd += ' --configuration=production';
    }
    return cmd;
}
//# sourceMappingURL=ionic-build.js.map