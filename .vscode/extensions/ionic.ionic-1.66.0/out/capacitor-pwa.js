"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integratePWA = void 0;
const vscode_1 = require("vscode");
const ignore_1 = require("./ignore");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const advanced_actions_1 = require("./advanced-actions");
const node_commands_1 = require("./node-commands");
async function integratePWA(queueFunction, project, tip) {
    const result = await vscode_1.window.showInformationMessage(`Progressive Web Application (PWA) Integration - This will add @angular/pwa to your project and make changes in your project to make it a PWA (manifest file, splash screen and icon resources).`, 'Apply Changes', 'Ignore');
    if (result == 'Ignore') {
        (0, ignore_1.ignore)(tip, ionic_tree_provider_1.ionicState.context);
        return;
    }
    if (!result) {
        return;
    }
    queueFunction();
    await (0, advanced_actions_1.runCommands)([`${(0, node_commands_1.npx)(project.packageManager)} ng add @angular/pwa --defaults --skip-confirmation true`], 'Adding @angular/pwa', project);
}
exports.integratePWA = integratePWA;
//# sourceMappingURL=capacitor-pwa.js.map