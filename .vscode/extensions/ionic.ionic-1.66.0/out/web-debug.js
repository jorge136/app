"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webDebugSetting = exports.getWebDebugSetting = exports.WebDebugSetting = void 0;
const vscode_1 = require("vscode");
const workspace_state_1 = require("./workspace-state");
var WebDebugSetting;
(function (WebDebugSetting) {
    WebDebugSetting["edge"] = "pwa-msedge";
    WebDebugSetting["chrome"] = "chrome";
})(WebDebugSetting = exports.WebDebugSetting || (exports.WebDebugSetting = {}));
function getWebDebugSetting() {
    const setting = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.debugBrowser);
    if (setting) {
        return setting;
    }
    else {
        return WebDebugSetting.edge;
    }
}
exports.getWebDebugSetting = getWebDebugSetting;
async function webDebugSetting() {
    const setting = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.debugBrowser);
    const configs = [
        check(WebDebugSetting.edge, setting, 'Microsoft Edge'),
        check(WebDebugSetting.chrome, setting, 'Google Chrome'),
    ];
    const selection = await vscode_1.window.showQuickPick(configs, {
        placeHolder: 'Select the debuggable Browser',
    });
    if (selection) {
        const value = selection.includes('Edge') ? WebDebugSetting.edge : WebDebugSetting.chrome;
        (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.debugBrowser, value);
    }
}
exports.webDebugSetting = webDebugSetting;
function check(msg, setting, title) {
    if (msg === setting) {
        return title + ` $(check)`;
    }
    return title;
}
//# sourceMappingURL=web-debug.js.map