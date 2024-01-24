"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webConfiguration = exports.getWebConfiguration = exports.WebConfigSetting = void 0;
const vscode_1 = require("vscode");
const workspace_state_1 = require("./workspace-state");
var WebConfigSetting;
(function (WebConfigSetting) {
    WebConfigSetting["welcome"] = "Show preview and open web browser";
    WebConfigSetting["welcomeNoBrowser"] = "Show preview without opening browser";
    WebConfigSetting["browser"] = "Open web browser";
    WebConfigSetting["editor"] = "Open app in editor";
})(WebConfigSetting = exports.WebConfigSetting || (exports.WebConfigSetting = {}));
function getWebConfiguration() {
    const setting = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.webAction);
    if (setting) {
        return setting;
    }
    else {
        return WebConfigSetting.welcome;
    }
}
exports.getWebConfiguration = getWebConfiguration;
async function webConfiguration(project) {
    const setting = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.webAction);
    const configs = [
        check(WebConfigSetting.welcome, setting),
        check(WebConfigSetting.welcomeNoBrowser, setting),
        check(WebConfigSetting.browser, setting),
        check(WebConfigSetting.editor, setting),
    ];
    const selection = await vscode_1.window.showQuickPick(configs, {
        placeHolder: 'Select the default action when running for web',
    });
    if (selection) {
        (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.webAction, selection);
    }
    return selection;
}
exports.webConfiguration = webConfiguration;
function check(msg, setting) {
    if (msg === setting) {
        return msg + ` $(check)`;
    }
    return msg;
}
//# sourceMappingURL=web-configuration.js.map