"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCapacitorPluginMigration = void 0;
const analyzer_1 = require("./analyzer");
const logging_1 = require("./logging");
const tip_1 = require("./tip");
const vscode_1 = require("vscode");
const utilities_1 = require("./utilities");
function checkCapacitorPluginMigration(project) {
    if ((0, analyzer_1.isGreaterOrEqual)('@capacitor/core', '4.0.0') && (0, analyzer_1.isLess)('@capacitor/core', '5.0.0')) {
        // Capacitor 4 to 5 plugin migration
        project.add(new tip_1.Tip('Migrate Plugin to Capacitor 5', undefined, tip_1.TipType.Error).setQueuedAction(migratePluginToCapacitor5, project));
    }
}
exports.checkCapacitorPluginMigration = checkCapacitorPluginMigration;
async function migratePluginToCapacitor5(queueFunction, project) {
    const txt = 'Migrate Plugin';
    const res = await vscode_1.window.showInformationMessage(`Your Capacitor 4 plugin can be migrated to Capacitor 5.`, txt, 'Exit');
    if (!res || res != txt)
        return;
    queueFunction();
    (0, logging_1.showOutput)();
    await (0, utilities_1.showProgress)('Migrating Plugin...', async () => {
        await project.run2('npx @capacitor/plugin-migration-v4-to-v5@latest', false);
        const msg = `Plugin has been migrated. Please read migration docs and verify your plugin before publishing.`;
        (0, logging_1.writeIonic)(msg);
        vscode_1.window.showInformationMessage(msg, 'OK');
    });
}
//# sourceMappingURL=rules-capacitor-plugins.js.map