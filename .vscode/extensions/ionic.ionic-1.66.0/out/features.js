"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showTips = exports.features = void 0;
const vscode_1 = require("vscode");
const workspace_state_1 = require("./workspace-state");
const utilities_1 = require("./utilities");
// Feature Flags for experimental options
exports.features = {
    debugAndroid: true,
    pluginExplorer: true, // Whether the plugin explorer is shown
};
function showTips() {
    const tips = (0, workspace_state_1.getGlobalSetting)(workspace_state_1.GlobalSetting.lastTipsShown);
    const shownAt = tips ? Date.parse(tips) : 0;
    const days = (new Date().getTime() - shownAt) / (1000 * 3600 * 24);
    if (days > 30) {
        vscode_1.window.showInformationMessage(`Ionic Tip: Press ${(0, utilities_1.alt)('D')} to debug your app and ${(0, utilities_1.alt)('R')} to run it!`, 'OK');
        (0, workspace_state_1.setGlobalSetting)(workspace_state_1.GlobalSetting.lastTipsShown, new Date().toISOString());
    }
}
exports.showTips = showTips;
//# sourceMappingURL=features.js.map