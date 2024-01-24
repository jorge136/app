"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capacitorOpen = void 0;
const monorepo_1 = require("./monorepo");
const analyzer_1 = require("./analyzer");
const capacitor_platform_1 = require("./capacitor-platform");
const command_name_1 = require("./command-name");
const capacitor_run_1 = require("./capacitor-run");
const node_commands_1 = require("./node-commands");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Capacitor open command
 * @param  {Project} project
 * @param  {CapacitorPlatform} platform ios or android
 * @returns string
 */
async function capacitorOpen(project, platform) {
    const ionicCLI = (0, capacitor_run_1.useIonicCLI)();
    if (platform == capacitor_platform_1.CapacitorPlatform.android) {
        checkAndroidStudioJDK(project.projectFolder());
    }
    switch (project.repoType) {
        case monorepo_1.MonoRepoType.none:
            return ionicCLI ? ionicCLIOpen(platform, project.packageManager) : capCLIOpen(platform, project.packageManager);
        case monorepo_1.MonoRepoType.folder:
        case monorepo_1.MonoRepoType.pnpm:
        case monorepo_1.MonoRepoType.yarn:
        case monorepo_1.MonoRepoType.lerna:
        case monorepo_1.MonoRepoType.npm:
            return (command_name_1.InternalCommand.cwd +
                (ionicCLI ? ionicCLIOpen(platform, project.packageManager) : capCLIOpen(platform, project.packageManager)));
        case monorepo_1.MonoRepoType.nx:
            return nxOpen(project, platform);
        default:
            throw new Error('Unsupported Monorepo type');
    }
}
exports.capacitorOpen = capacitorOpen;
function capCLIOpen(platform, packageManager) {
    return `${(0, node_commands_1.npx)(packageManager)} cap open ${platform}`;
}
function ionicCLIOpen(platform, packageManager) {
    return `${(0, node_commands_1.npx)(packageManager)} ionic cap open ${platform}`;
}
function nxOpen(project, platform) {
    if (project.monoRepo.isNXStandalone) {
        return capCLIOpen(platform, project.packageManager);
    }
    return `${(0, node_commands_1.npx)(project.packageManager)} nx run ${project.monoRepo.name}:open:${platform}`;
}
// This will create the default files that specify the JDK version to use for a project that has never been opened in Android Studio
function checkAndroidStudioJDK(folder) {
    if ((0, analyzer_1.isGreaterOrEqual)('@capacitor/android', '5.0.0')) {
        if ((0, fs_1.existsSync)((0, path_1.join)(folder, 'android'))) {
            const ideaFolder = (0, path_1.join)(folder, 'android', '.idea');
            if (!(0, fs_1.existsSync)(ideaFolder)) {
                (0, fs_1.mkdirSync)(ideaFolder);
                (0, fs_1.writeFileSync)((0, path_1.join)(ideaFolder, 'compiler.xml'), `<?xml version="1.0" encoding="UTF-8"?>
        <project version="4">
          <component name="CompilerConfiguration">
            <bytecodeTargetLevel target="17" />
          </component>
        </project>`);
            }
        }
    }
}
//# sourceMappingURL=capacitor-open.js.map