"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfiguration = exports.getConfigurationArgs = exports.getConfigurationName = void 0;
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const vscode_1 = require("vscode");
const fs_1 = require("fs");
const path_1 = require("path");
function getConfigurationName() {
    if (!ionic_tree_provider_1.ionicState.configuration || ionic_tree_provider_1.ionicState.configuration == 'default') {
        return '';
    }
    else {
        return `(${ionic_tree_provider_1.ionicState.configuration})`;
    }
}
exports.getConfigurationName = getConfigurationName;
function getConfigurationArgs(isDebugging) {
    let config = ionic_tree_provider_1.ionicState.configuration;
    if (isDebugging) {
        // If we are debugging and its an Angular project without a selected build config
        // then choose "development" so that source maps work
        if (config == 'production') {
            config = 'development'; // Assume we have this configuration
        }
    }
    if (!config || config == 'default') {
        return '';
    }
    else {
        return ` --configuration=${config}`;
    }
}
exports.getConfigurationArgs = getConfigurationArgs;
async function buildConfiguration(folder, context, project) {
    let configs = [];
    const filename = (0, path_1.join)(project.projectFolder(), 'angular.json');
    if ((0, fs_1.existsSync)(filename)) {
        configs = getAngularBuildConfigs(filename);
    }
    if (configs.length == 0) {
        vscode_1.window.showInformationMessage('No build configurations found in this project');
        return;
    }
    configs.unshift('default');
    const selection = vscode_1.window.showQuickPick(configs, { placeHolder: 'Select a build configuration to use' });
    return selection;
}
exports.buildConfiguration = buildConfiguration;
function getAngularBuildConfigs(filename) {
    try {
        const result = [];
        const angular = JSON.parse((0, fs_1.readFileSync)(filename, 'utf8'));
        for (const config of Object.keys(angular.projects.app.architect.build.configurations)) {
            result.push(config);
        }
        return result;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=build-configuration.js.map