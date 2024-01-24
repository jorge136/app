'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.fixIssue = void 0;
const context_variables_1 = require("./context-variables");
const ionic_auth_1 = require("./ionic-auth");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const process_packages_1 = require("./process-packages");
const project_1 = require("./project");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const ignore_1 = require("./ignore");
const command_name_1 = require("./command-name");
const rules_package_upgrade_1 = require("./rules-package-upgrade");
const ionic_projects_provider_1 = require("./ionic-projects-provider");
const build_configuration_1 = require("./build-configuration");
const web_configuration_1 = require("./web-configuration");
const capacitor_device_1 = require("./capacitor-device");
const monorepo_1 = require("./monorepo");
const android_debug_bridge_1 = require("./android-debug-bridge");
const android_debug_provider_1 = require("./android-debug-provider");
const ionic_devserver_provider_1 = require("./ionic-devserver-provider");
const android_debug_1 = require("./android-debug");
const capacitor_platform_1 = require("./capacitor-platform");
const process_list_1 = require("./process-list");
const ionic_serve_1 = require("./ionic-serve");
const advanced_actions_1 = require("./advanced-actions");
const plugin_explorer_1 = require("./plugin-explorer");
const features_1 = require("./features");
const web_debug_1 = require("./web-debug");
const logging_1 = require("./logging");
const tasks_1 = require("./tasks");
const recommend_1 = require("./recommend");
const ionic_start_1 = require("./ionic-start");
const vscode_1 = require("vscode");
const fs_1 = require("fs");
/**
 * Runs the command while showing a vscode window that can be cancelled
 * @param  {string|string[]} command Node command
 * @param  {string} rootPath path to run the command
 * @param  {IonicTreeProvider} ionicProvider? the provide which will be refreshed on completion
 * @param  {string} successMessage? Message to display if successful
 */
async function fixIssue(command, rootPath, ionicProvider, tip, successMessage, title) {
    const hasRunPoints = tip && tip.runPoints && tip.runPoints.length > 0;
    if (command == tip_1.Command.NoOp) {
        await tip.executeAction();
        ionicProvider === null || ionicProvider === void 0 ? void 0 : ionicProvider.refresh();
        return;
    }
    // If the task is already running then cancel it
    const didCancel = await (0, tasks_1.cancelIfRunning)(tip);
    if (didCancel)
        return;
    (0, tasks_1.markOperationAsRunning)(tip);
    let msg = tip.commandProgress ? tip.commandProgress : tip.commandTitle ? tip.commandTitle : command;
    if (title)
        msg = title;
    let failed = false;
    await vscode_1.window.withProgress({
        location: tip.progressDialog ? vscode_1.ProgressLocation.Notification : vscode_1.ProgressLocation.Window,
        title: `${msg}`,
        cancellable: true,
    }, async (progress, token) => {
        const cancelObject = { proc: undefined, cancelled: false };
        let increment = undefined;
        let percentage = undefined;
        const interval = setInterval(async () => {
            // Kill the process if the user cancels
            if (token.isCancellationRequested || tip.cancelRequested) {
                tip.cancelRequested = false;
                (0, logging_1.writeIonic)(`Stopped "${tip.title}"`);
                if (tip.features.includes(tip_1.TipFeature.welcome)) {
                    vscode_1.commands.executeCommand(command_name_1.CommandName.hideDevServer);
                }
                if (tip.title.toLowerCase() == capacitor_platform_1.CapacitorPlatform.ios) {
                    ionic_tree_provider_1.ionicState.selectedIOSDeviceName = '';
                }
                if (tip.title.toLowerCase() == capacitor_platform_1.CapacitorPlatform.android) {
                    ionic_tree_provider_1.ionicState.selectedAndroidDeviceName = '';
                }
                //channelShow();
                clearInterval(interval);
                (0, tasks_1.finishCommand)(tip);
                cancelObject.cancelled = true;
                console.log(`Killing process ${cancelObject.proc.pid}`);
                await (0, process_list_1.kill)(cancelObject.proc, rootPath);
                if (ionicProvider) {
                    ionicProvider.refresh();
                }
            }
            else {
                if (increment && !hasRunPoints) {
                    percentage += increment;
                    const msg = percentage > 100 ? ' ' : `${parseInt(percentage)}%`;
                    progress.report({ message: msg, increment: increment });
                }
            }
        }, 1000);
        const commandList = Array.isArray(command) ? command : [command];
        let clear = true;
        for (const cmd of commandList) {
            (0, tasks_1.startCommand)(tip, cmd, clear);
            clear = false;
            const secondsTotal = (0, utilities_1.estimateRunTime)(cmd);
            if (secondsTotal) {
                increment = 100.0 / secondsTotal;
                percentage = 0;
            }
            try {
                let retry = true;
                while (retry) {
                    try {
                        retry = await (0, utilities_1.run)(rootPath, cmd, cancelObject, tip.features, tip.runPoints, progress, ionicProvider, undefined, undefined, tip.data);
                    }
                    catch (err) {
                        retry = false;
                        failed = true;
                        (0, logging_1.writeError)(err);
                    }
                }
            }
            finally {
                (0, tasks_1.finishCommand)(tip);
            }
        }
        return true;
    });
    if (ionicProvider) {
        ionicProvider.refresh();
    }
    if (successMessage) {
        (0, logging_1.write)(successMessage);
    }
    if (tip.title) {
        if (failed) {
            (0, logging_1.writeError)(`${tip.title} Failed.`);
        }
        else {
            (0, logging_1.writeIonic)(`${tip.title} Completed.`);
        }
        (0, logging_1.write)('');
        (0, logging_1.showOutput)();
    }
    if (tip.syncOnSuccess) {
        if (!ionic_tree_provider_1.ionicState.syncDone.includes(tip.syncOnSuccess)) {
            ionic_tree_provider_1.ionicState.syncDone.push(tip.syncOnSuccess);
        }
    }
}
exports.fixIssue = fixIssue;
async function activate(context) {
    const rootPath = vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length > 0
        ? vscode_1.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    // Ionic Tree View
    const ionicProvider = new ionic_tree_provider_1.IonicTreeProvider(rootPath, context);
    const view = vscode_1.window.createTreeView('ionic-tree', { treeDataProvider: ionicProvider });
    //IonicStartPanel.init(context.extensionUri, this.workspaceRoot, context);
    // Project List Panel
    const ionicProjectsProvider = new ionic_projects_provider_1.IonicProjectsreeProvider(rootPath, context);
    const projectsView = vscode_1.window.createTreeView('ionic-zprojects', { treeDataProvider: ionicProjectsProvider });
    // Dev Server Running Panel
    const ionicDevServerProvider = new ionic_devserver_provider_1.IonicDevServerProvider(rootPath, context);
    context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('ionic-devserver', ionicDevServerProvider, {
        webviewOptions: { retainContextWhenHidden: false },
    }));
    ionic_tree_provider_1.ionicState.view = view;
    ionic_tree_provider_1.ionicState.projectsView = projectsView;
    ionic_tree_provider_1.ionicState.context = context;
    if (rootPath == undefined) {
        ionic_start_1.IonicStartPanel.init(context.extensionUri, this.workspaceRoot, context);
    }
    ionic_tree_provider_1.ionicState.shell = context.workspaceState.get(context_variables_1.Context.shell);
    const shellOverride = vscode_1.workspace.getConfiguration('ionic').get('shellPath');
    if (shellOverride && shellOverride.length > 0) {
        ionic_tree_provider_1.ionicState.shell = shellOverride;
    }
    trackProjectChange();
    vscode_1.commands.registerCommand(command_name_1.CommandName.Refresh, () => {
        (0, process_packages_1.clearRefreshCache)(context);
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Add, async () => {
        if (features_1.features.pluginExplorer) {
            plugin_explorer_1.PluginExplorerPanel.init(context.extensionUri, rootPath, context, ionicProvider);
        }
        else {
            await (0, project_1.installPackage)(context.extensionPath, rootPath);
            if (ionicProvider) {
                ionicProvider.refresh();
            }
        }
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Stop, async (recommendation) => {
        recommendation.tip.data = context_variables_1.Context.stop;
        await fixIssue(undefined, context.extensionPath, ionicProvider, recommendation.tip);
        recommendation.setContext(undefined);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.SignUp, async () => {
        await (0, ionic_auth_1.ionicSignup)(context.extensionPath, context);
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Upgrade, async (recommendation) => {
        await (0, rules_package_upgrade_1.packageUpgrade)(recommendation.tip.data, (0, monorepo_1.getLocalFolder)(rootPath));
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Login, async () => {
        await vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.isLoggingIn, true);
        await (0, ionic_auth_1.ionicLogin)(context.extensionPath, context);
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.RefreshDebug, async () => {
        ionic_tree_provider_1.ionicState.refreshDebugDevices = true;
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.SelectAction, async (r) => {
        await (0, advanced_actions_1.advancedActions)(r.getData());
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.WebConfig, async (r) => {
        (0, web_configuration_1.webConfiguration)(r.tip.actionArg(0));
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.BuildConfig, async (r) => {
        const config = await (0, build_configuration_1.buildConfiguration)(context.extensionPath, context, r.tip.actionArg(0));
        if (!config)
            return;
        if (config != 'default') {
            r.tip.addActionArg(`--configuration=${config}`);
        }
        ionic_tree_provider_1.ionicState.configuration = config;
        runAction(r.tip, ionicProvider, rootPath);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.NewProject, async () => {
        ionic_start_1.IonicStartPanel.init(ionic_tree_provider_1.ionicState.context.extensionUri, this.workspaceRoot, ionic_tree_provider_1.ionicState.context, true);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.PluginExplorer, async () => {
        await (0, project_1.reviewProject)(rootPath, context, context.workspaceState.get('SelectedProject'));
        plugin_explorer_1.PluginExplorerPanel.init(context.extensionUri, rootPath, context, ionicProvider);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.SkipLogin, async () => {
        ionic_tree_provider_1.ionicState.skipAuth = true;
        await vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.inspectedProject, false);
        await vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.isAnonymous, false);
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Open, async (recommendation) => {
        if ((0, fs_1.existsSync)(recommendation.tip.secondCommand)) {
            (0, utilities_1.openUri)(recommendation.tip.secondCommand);
        }
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.RunIOS, async (recommendation) => {
        runAgain(ionicProvider, rootPath);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Rebuild, async (recommendation) => {
        await recommendation.tip.executeAction();
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Function, async (recommendation) => {
        await recommendation.tip.executeAction();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.WebDebugConfig, async (recommendation) => {
        await (0, web_debug_1.webDebugSetting)();
        ionicProvider.refresh();
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Fix, async (tip) => {
        await fix(tip, rootPath, ionicProvider, context);
    });
    // The project list panel needs refreshing
    vscode_1.commands.registerCommand(command_name_1.CommandName.ProjectsRefresh, async (project) => {
        ionicProjectsProvider.refresh(project);
    });
    // User selected a project from the list (monorepo)
    vscode_1.commands.registerCommand(command_name_1.CommandName.ProjectSelect, async (project) => {
        context.workspaceState.update('SelectedProject', project);
        ionicProvider.selectProject(project);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Idea, async (t) => {
        if (!t)
            return;
        // If the user clicks the light bulb it is a Tip, if they click the item it is a recommendation
        const tip = t.tip ? t.tip : t;
        await fix(tip, rootPath, ionicProvider, context);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Run, async (r) => {
        runAction(r.tip, ionicProvider, rootPath);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Debug, async () => {
        runAction((0, recommend_1.debugOnWeb)(ionic_tree_provider_1.ionicState.projectRef), ionicProvider, rootPath);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Build, async () => {
        runAction((0, recommend_1.build)(ionic_tree_provider_1.ionicState.projectRef), ionicProvider, rootPath);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.SelectDevice, async (r) => {
        if (r.tip.actionArg(1) == capacitor_platform_1.CapacitorPlatform.android) {
            ionic_tree_provider_1.ionicState.selectedAndroidDevice = undefined;
            ionic_tree_provider_1.ionicState.selectedAndroidDeviceName = undefined;
        }
        else {
            ionic_tree_provider_1.ionicState.selectedIOSDevice = undefined;
            ionic_tree_provider_1.ionicState.selectedIOSDeviceName = undefined;
        }
        runAction(r.tip, ionicProvider, rootPath, command_name_1.CommandName.SelectDevice);
    });
    vscode_1.commands.registerCommand(command_name_1.CommandName.Link, async (tip) => {
        await (0, utilities_1.openUri)(tip.url);
    });
    context.subscriptions.push(vscode_1.debug.registerDebugConfigurationProvider(android_debug_1.AndroidDebugType, new android_debug_provider_1.AndroidDebugProvider()));
    context.subscriptions.push(vscode_1.debug.onDidTerminateDebugSession(android_debug_bridge_1.androidDebugUnforward));
    if (!ionic_tree_provider_1.ionicState.runWeb) {
        const summary = await (0, project_1.reviewProject)(rootPath, context, context.workspaceState.get('SelectedProject'));
        if (summary === null || summary === void 0 ? void 0 : summary.project.isCapacitor) {
            (0, features_1.showTips)();
        }
    }
}
exports.activate = activate;
async function runAgain(ionicProvider, rootPath) {
    let runInfo = ionic_tree_provider_1.ionicState.runWeb;
    switch (ionic_tree_provider_1.ionicState.lastRun) {
        case capacitor_platform_1.CapacitorPlatform.android:
            runInfo = ionic_tree_provider_1.ionicState.runAndroid;
            break;
        case capacitor_platform_1.CapacitorPlatform.ios:
            runInfo = ionic_tree_provider_1.ionicState.runIOS;
            break;
    }
    if (runInfo) {
        runAction(runInfo, ionicProvider, rootPath);
    }
}
function trackProjectChange() {
    vscode_1.workspace.onDidSaveTextDocument((document) => {
        ionic_tree_provider_1.ionicState.projectDirty = true;
    });
    vscode_1.window.onDidChangeVisibleTextEditors((e) => {
        var _a, _b;
        let outputIsFocused = false;
        for (const d of e) {
            if (((_b = (_a = d === null || d === void 0 ? void 0 : d.document) === null || _a === void 0 ? void 0 : _a.uri) === null || _b === void 0 ? void 0 : _b.scheme) == 'output') {
                outputIsFocused = true;
            }
        }
        ionic_tree_provider_1.ionicState.outputIsFocused = outputIsFocused;
    });
}
async function runAction(tip, ionicProvider, rootPath, srcCommand) {
    if (await (0, tasks_1.waitForOtherActions)(tip)) {
        return; // Canceled
    }
    if (tip.stoppable) {
        (0, tasks_1.markActionAsRunning)(tip);
        ionicProvider.refresh();
    }
    await tip.generateCommand();
    tip.generateTitle();
    if (tip.command) {
        let command = tip.command;
        let host = '';
        if (tip.doIpSelection) {
            host = await (0, ionic_serve_1.selectExternalIPAddress)();
            if (host) {
                host = ` --public-host=${host}`;
            }
            else {
                host = '';
            }
        }
        command = tip.command.replace(command_name_1.InternalCommand.publicHost, host);
        if (tip.doDeviceSelection) {
            const target = await (0, capacitor_device_1.selectDevice)(tip.secondCommand, tip.data, tip, srcCommand);
            if (!target) {
                (0, tasks_1.markActionAsCancelled)(tip);
                ionicProvider.refresh();
                return;
            }
            command = command.replace(command_name_1.InternalCommand.target, target);
        }
        if (command) {
            execute(tip, ionic_tree_provider_1.ionicState.context);
            fixIssue(command, rootPath, ionicProvider, tip);
            return;
        }
    }
    else {
        await execute(tip, ionic_tree_provider_1.ionicState.context);
        if (tip.refresh) {
            ionicProvider.refresh();
        }
    }
}
async function fix(tip, rootPath, ionicProvider, context) {
    if (await (0, tasks_1.waitForOtherActions)(tip)) {
        return; // Canceled
    }
    await tip.generateCommand();
    tip.generateTitle();
    if (tip.command) {
        const urlBtn = tip.url ? 'Info' : undefined;
        const msg = tip.message ? `: ${tip.message}` : '';
        const info = tip.description ? tip.description : `${tip.title}${msg}`;
        const ignoreTitle = tip.ignorable ? 'Ignore' : undefined;
        const selection = await vscode_1.window.showInformationMessage(info, urlBtn, ignoreTitle, tip.secondTitle, tip.commandTitle);
        if (selection && selection == tip.commandTitle) {
            fixIssue(tip.command, rootPath, ionicProvider, tip, tip.commandSuccess);
        }
        if (selection && selection == tip.secondTitle) {
            fixIssue(tip.secondCommand, rootPath, ionicProvider, tip, undefined, tip.secondTitle);
        }
        if (selection && selection == urlBtn) {
            (0, utilities_1.openUri)(tip.url);
        }
        if (selection && selection == ignoreTitle) {
            (0, ignore_1.ignore)(tip, context);
            if (ionicProvider) {
                ionicProvider.refresh();
            }
        }
    }
    else {
        await execute(tip, context);
        if (ionicProvider) {
            ionicProvider.refresh();
        }
    }
}
async function execute(tip, context) {
    const result = (await tip.executeAction());
    if (result == command_name_1.ActionResult.Ignore) {
        (0, ignore_1.ignore)(tip, context);
    }
    if (tip.url) {
        await (0, utilities_1.openUri)(tip.url);
    }
}
//# sourceMappingURL=extension.js.map