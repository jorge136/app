"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommands = exports.removeNodeModules = exports.advancedActions = void 0;
const node_commands_1 = require("./node-commands");
const utilities_1 = require("./utilities");
const logging_1 = require("./logging");
const analyzer_1 = require("./analyzer");
const rules_angular_json_1 = require("./rules-angular-json");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const ignore_1 = require("./ignore");
const command_name_1 = require("./command-name");
const vscode_1 = require("vscode");
const path_1 = require("path");
const prettier_1 = require("./prettier");
var Features;
(function (Features) {
    Features["migrateToPNPM"] = "$(find-replace) Migrate to PNPM";
    Features["migrateToNX"] = "$(outline-view-icon) Migrate to NX";
    Features["reinstallNodeModules"] = "$(extensions-sync-enabled) Reinstall Node Modules";
    Features["angularESBuild"] = "$(test-view-icon) Switch from WebPack to ESBuild (experimental)";
    Features["migrateAngularControlFlow"] = "$(test-view-icon) Migrate to the built-in control flow syntax";
    Features["showIgnoredRecommendations"] = "$(light-bulb) Show Ignored Recommendations";
    Features["migrateAngularStandalone"] = "$(test-view-icon) Migrate to Ionic standalone components";
    Features["lintAndFormat"] = "$(test-view-icon) Lint and format on commit";
})(Features || (Features = {}));
async function advancedActions(project) {
    const picks = [];
    if (project.packageManager == node_commands_1.PackageManager.npm) {
        picks.push(Features.migrateToPNPM);
        if ((0, analyzer_1.isGreaterOrEqual)('@angular/core', '14.0.0')) {
            picks.push(Features.migrateToNX);
        }
        picks.push(Features.reinstallNodeModules);
    }
    if ((0, analyzer_1.isGreaterOrEqual)('@angular/core', '14.0.0')) {
        picks.push(Features.migrateAngularStandalone);
    }
    if ((0, analyzer_1.isGreaterOrEqual)('@angular/core', '17.0.0')) {
        picks.push(Features.migrateAngularControlFlow);
    }
    if (!(0, analyzer_1.exists)('husky') && project.isCapacitor && (0, analyzer_1.isGreaterOrEqual)('typescript', '4.0.0')) {
        picks.push(Features.lintAndFormat);
    }
    picks.push(Features.showIgnoredRecommendations);
    if ((0, analyzer_1.isGreaterOrEqual)('@angular-devkit/build-angular', '14.0.0')) {
        if (!(0, analyzer_1.isGreaterOrEqual)('@angular/core', '17.0.0')) {
            if (!angularUsingESBuild(project)) {
                picks.push(Features.angularESBuild);
            }
        }
    }
    const selection = await vscode_1.window.showQuickPick(picks, {});
    switch (selection) {
        case Features.migrateToPNPM:
            await runCommands(migrateToPNPM(), selection, project);
            break;
        case Features.migrateToNX:
            await vscode_1.window.showInformationMessage('Run the following command: npx nx init', 'OK');
            break;
        case Features.reinstallNodeModules:
            await runCommands(reinstallNodeModules(), selection, project);
            break;
        case Features.migrateAngularControlFlow:
            migrateAngularControlFlow(selection, project);
            break;
        case Features.angularESBuild:
            switchAngularToESBuild(project);
            break;
        case Features.migrateAngularStandalone:
            migrateToAngularStandalone(selection, project);
            break;
        case Features.showIgnoredRecommendations:
            showIgnoredRecommendations();
            break;
        case Features.lintAndFormat:
            (0, prettier_1.integratePrettier)(project);
            break;
    }
}
exports.advancedActions = advancedActions;
function migrateToPNPM() {
    return ['pnpm -v', 'rm -rf node_modules', 'pnpm import', 'pnpm install', 'rm package-lock.json'];
}
async function migrateAngularControlFlow(selection, project) {
    if (!(await (0, utilities_1.confirm)('This will change your Angular templates to use the new built-in control flow syntax. Are you sure?', 'Continue')))
        return;
    const commands = [`npx ng generate @angular/core:control-flow --interactive=false --defaults=true --path=".${path_1.sep}"`];
    await runCommands(commands, selection, project);
}
async function migrateToAngularStandalone(selection, project) {
    if (!(await (0, utilities_1.confirm)('This will replace IonicModule with individual Ionic components and icons in your project. Are you sure?', 'Continue')))
        return;
    const commands = ['npx @ionic/angular-standalone-codemods --non-interactive'];
    if ((0, analyzer_1.isGreaterOrEqual)('@ionic/angular', '7.0.0')) {
        if ((0, analyzer_1.isLess)('@ionic/angular', '7.5.1')) {
            commands.unshift((0, node_commands_1.npmInstall)('@ionic/angular@7.5.1'));
        }
    }
    else {
        (0, logging_1.writeError)('You must be using @ionic/angular version 7 or higher.');
        return;
    }
    if ((0, analyzer_1.isLess)('ionicons', '7.2.1')) {
        commands.unshift((0, node_commands_1.npmInstall)('ionicons@latest'));
    }
    await runCommands(commands, selection, project);
}
function removeNodeModules() {
    return (0, utilities_1.isWindows)() ? 'del node_modules /S /Q' : 'rm -rf node_modules';
}
exports.removeNodeModules = removeNodeModules;
function reinstallNodeModules() {
    return [removeNodeModules(), 'npm install'];
}
function showIgnoredRecommendations() {
    (0, ignore_1.clearIgnored)(ionic_tree_provider_1.ionicState.context);
    vscode_1.commands.executeCommand(command_name_1.CommandName.Refresh);
}
async function runCommands(commands, title, project) {
    try {
        if (title.includes(')')) {
            title = title.substring(title.indexOf(')') + 1);
        }
        await vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Notification, title, cancellable: false }, async () => {
            await run(commands, project.folder);
        });
        (0, logging_1.writeIonic)(`Completed ${title}`);
    }
    catch (err) {
        (0, logging_1.writeError)(`Failed ${title}: ${err}`);
    }
}
exports.runCommands = runCommands;
async function run(commands, folder) {
    for (const command of commands) {
        (0, logging_1.writeIonic)((0, utilities_1.replaceAll)(command, command_name_1.InternalCommand.cwd, ''));
        try {
            (0, logging_1.write)(await (0, utilities_1.getRunOutput)(command, folder));
        }
        catch (err) {
            //writeError(err);
            break;
        }
    }
}
function angularUsingESBuild(project) {
    var _a, _b, _c;
    try {
        const angular = (0, rules_angular_json_1.readAngularJson)(project);
        for (const prj of Object.keys(angular === null || angular === void 0 ? void 0 : angular.projects)) {
            if (((_c = (_b = (_a = angular.projects[prj]) === null || _a === void 0 ? void 0 : _a.architect) === null || _b === void 0 ? void 0 : _b.build) === null || _c === void 0 ? void 0 : _c.builder) == '@angular-devkit/build-angular:browser-esbuild') {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
function switchAngularToESBuild(project) {
    var _a, _b, _c;
    const angular = (0, rules_angular_json_1.readAngularJson)(project);
    let changes = false;
    if (!angular)
        return;
    for (const prj of Object.keys(angular === null || angular === void 0 ? void 0 : angular.projects)) {
        if (((_c = (_b = (_a = angular.projects[prj]) === null || _a === void 0 ? void 0 : _a.architect) === null || _b === void 0 ? void 0 : _b.build) === null || _c === void 0 ? void 0 : _c.builder) == '@angular-devkit/build-angular:browser') {
            angular.projects[prj].architect.build.builder = '@angular-devkit/build-angular:browser-esbuild';
            changes = true;
        }
    }
    if (changes) {
        (0, rules_angular_json_1.fixGlobalScss)(project);
        (0, rules_angular_json_1.writeAngularJson)(project, angular);
        vscode_1.window.showInformationMessage(`The Angular project has been changed to esbuild. Enjoy faster builds!`, 'OK');
    }
}
//# sourceMappingURL=advanced-actions.js.map