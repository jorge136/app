"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webProject = void 0;
const analyzer_1 = require("./analyzer");
const command_name_1 = require("./command-name");
const monorepo_1 = require("./monorepo");
const node_commands_1 = require("./node-commands");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const rules_capacitor_plugins_1 = require("./rules-capacitor-plugins");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Web projects are not using Capacitor or Cordova
 * @param  {Project} project
 */
function webProject(project) {
    let outFolder = 'www';
    // If there is a build folder and not a www folder then...
    if (!(0, fs_1.existsSync)((0, path_1.join)(project.projectFolder(), 'www'))) {
        if ((0, fs_1.existsSync)((0, path_1.join)(project.projectFolder(), 'build')) || (0, analyzer_1.exists)('react')) {
            outFolder = 'build'; // use build folder (usually react)
        }
        else if ((0, fs_1.existsSync)((0, path_1.join)(project.projectFolder(), 'dist')) || (0, analyzer_1.exists)('vue')) {
            outFolder = 'dist'; /// use dist folder (usually vue)
        }
    }
    const pre = project.repoType != monorepo_1.MonoRepoType.none ? command_name_1.InternalCommand.cwd : '';
    if (project.isCapacitorPlugin) {
        (0, rules_capacitor_plugins_1.checkCapacitorPluginMigration)(project);
    }
    if (!project.isCapacitorPlugin) {
        project.tip(new tip_1.Tip('Add Capacitor Integration', '', tip_1.TipType.Capacitor, 'Integrate Capacitor with this project to make it native mobile?', [
            (0, node_commands_1.npmInstall)(`@capacitor/core`),
            (0, node_commands_1.npmInstall)(`@capacitor/cli`),
            (0, node_commands_1.npmInstall)(`@capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar`),
            `${pre}${(0, node_commands_1.npx)(project.packageManager)} capacitor init "${project.name}" "${(0, utilities_1.asAppId)(project.name)}" --web-dir ${outFolder}`,
            command_name_1.InternalCommand.ionicInit,
        ], 'Add Capacitor', 'Capacitor added to this project', 'https://capacitorjs.com'));
    }
}
exports.webProject = webProject;
//# sourceMappingURL=rules-web-project.js.map