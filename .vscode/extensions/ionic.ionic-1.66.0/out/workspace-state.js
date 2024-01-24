"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalSetting = exports.getGlobalSetting = exports.getExtSetting = exports.setSetting = exports.getSetting = exports.GlobalSetting = exports.ExtensionSetting = exports.WorkspaceSetting = void 0;
const vscode_1 = require("vscode");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
var WorkspaceSetting;
(function (WorkspaceSetting) {
    WorkspaceSetting["liveReload"] = "liveReload";
    WorkspaceSetting["httpsForWeb"] = "httpsForWeb";
    WorkspaceSetting["pluginDrift"] = "pluginDrift";
    WorkspaceSetting["webAction"] = "webAction";
    WorkspaceSetting["logFilter"] = "logFilter";
    WorkspaceSetting["tips"] = "tipsShown";
    WorkspaceSetting["lastIPAddress"] = "lastIPAddress";
    WorkspaceSetting["debugBrowser"] = "debugBrowser";
    WorkspaceSetting["cocoaPods"] = "cocoaPods2";
})(WorkspaceSetting = exports.WorkspaceSetting || (exports.WorkspaceSetting = {}));
var ExtensionSetting;
(function (ExtensionSetting) {
    ExtensionSetting["internalAddress"] = "internalAddress";
    ExtensionSetting["javaHome"] = "javaHome";
    ExtensionSetting["manualNewProjects"] = "manualNewProjects";
})(ExtensionSetting = exports.ExtensionSetting || (exports.ExtensionSetting = {}));
var GlobalSetting;
(function (GlobalSetting) {
    GlobalSetting["lastTipsShown"] = "lastTipsShown";
    GlobalSetting["projectsFolder"] = "projectsFolder";
})(GlobalSetting = exports.GlobalSetting || (exports.GlobalSetting = {}));
function getSetting(key) {
    return ionic_tree_provider_1.ionicState.context.workspaceState.get(key);
}
exports.getSetting = getSetting;
async function setSetting(key, value) {
    await ionic_tree_provider_1.ionicState.context.workspaceState.update(key, value);
}
exports.setSetting = setSetting;
function getExtSetting(key) {
    return vscode_1.workspace.getConfiguration('ionic').get(key);
}
exports.getExtSetting = getExtSetting;
function getGlobalSetting(key) {
    return ionic_tree_provider_1.ionicState.context.globalState.get(key);
}
exports.getGlobalSetting = getGlobalSetting;
async function setGlobalSetting(key, value) {
    return await ionic_tree_provider_1.ionicState.context.globalState.update(key, value);
}
exports.setGlobalSetting = setGlobalSetting;
//# sourceMappingURL=workspace-state.js.map