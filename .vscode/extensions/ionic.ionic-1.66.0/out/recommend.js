"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = exports.debugOnWeb = exports.getRecommendations = void 0;
const analyzer_1 = require("./analyzer");
const capacitor_configure_1 = require("./capacitor-configure");
const ionic_build_1 = require("./ionic-build");
const ionic_serve_1 = require("./ionic-serve");
const splash_icon_1 = require("./splash-icon");
const tip_1 = require("./tip");
const rules_capacitor_migration_1 = require("./rules-capacitor-migration");
const process_packages_1 = require("./process-packages");
const capacitor_run_1 = require("./capacitor-run");
const rules_capacitor_1 = require("./rules-capacitor");
const rules_cordova_1 = require("./rules-cordova");
const rules_web_project_1 = require("./rules-web-project");
const rules_packages_1 = require("./rules-packages");
const rules_deprecated_plugins_1 = require("./rules-deprecated-plugins");
const capacitor_sync_1 = require("./capacitor-sync");
const capacitor_open_1 = require("./capacitor-open");
const capacitor_platform_1 = require("./capacitor-platform");
const scripts_1 = require("./scripts");
const context_variables_1 = require("./context-variables");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const android_debug_list_1 = require("./android-debug-list");
const editor_preview_1 = require("./editor-preview");
const rules_ionic_native_1 = require("./rules-ionic-native");
const utilities_1 = require("./utilities");
const log_server_1 = require("./log-server");
const build_configuration_1 = require("./build-configuration");
const live_reload_1 = require("./live-reload");
const node_commands_1 = require("./node-commands");
const capacitor_build_1 = require("./capacitor-build");
const workspace_state_1 = require("./workspace-state");
const update_minor_1 = require("./update-minor");
const audit_1 = require("./audit");
const analyze_size_1 = require("./analyze-size");
const ionic_export_1 = require("./ionic-export");
const angular_generate_1 = require("./angular-generate");
const log_settings_1 = require("./log-settings");
const logging_1 = require("./logging");
const tasks_1 = require("./tasks");
const command_name_1 = require("./command-name");
const vscode_1 = require("vscode");
async function getRecommendations(project, context, packages) {
    var _a, _b;
    if (project.isCapacitor) {
        project.setGroup(`Run`, `Press ${(0, utilities_1.alt)('R')} to run the last chosen platform or Web.`, tip_1.TipType.Ionic, true);
        const hasCapIos = project.hasCapacitorProject(capacitor_platform_1.CapacitorPlatform.ios);
        const hasCapAndroid = project.hasCapacitorProject(capacitor_platform_1.CapacitorPlatform.android);
        const runWeb = new tip_1.Tip('Web', '', tip_1.TipType.Run, 'Serve', undefined, 'Running on Web', `Project Served`)
            .setDynamicCommand(ionic_serve_1.ionicServe, project, false)
            .requestIPSelection()
            .setData(project.name)
            .setContextValue(context_variables_1.Context.webConfig)
            .setFeatures([tip_1.TipFeature.welcome])
            .setRunPoints([
            { title: 'Building...', text: 'Generating browser application bundles' },
            { title: 'Serving', text: 'Development server running' },
        ])
            .canStop()
            .willNotBlock()
            .canAnimate()
            .setTooltip(`Run a development server and open using the default web browser (${(0, utilities_1.alt)('R')})`);
        project.add(runWeb);
        ionic_tree_provider_1.ionicState.runWeb = runWeb;
        const runPoints = [
            { text: 'Copying web assets', title: 'Copying...' },
            { text: 'ng run app:build', title: 'Building Web...' },
            { text: 'capacitor run', title: 'Syncing...' },
            { text: '✔ update ios', title: 'Building Native...' },
            { text: '✔ update android', title: 'Building Native...' },
            { text: 'Running Gradle build', title: 'Deploying...' },
            { text: 'Running xcodebuild', title: 'Deploying...' },
            { text: 'App deployed', title: 'Waiting for Code Changes', refresh: true },
        ];
        if (hasCapAndroid) {
            const runAndroid = new tip_1.Tip('Android', (_a = ionic_tree_provider_1.ionicState.selectedAndroidDeviceName) !== null && _a !== void 0 ? _a : '', tip_1.TipType.Run, 'Run', undefined, 'Running', 'Project is running')
                .requestDeviceSelection()
                .requestIPSelection()
                .setDynamicCommand(capacitor_run_1.capacitorRun, project, capacitor_platform_1.CapacitorPlatform.android)
                .setSecondCommand('Getting Devices', (0, capacitor_run_1.capacitorDevicesCommand)(capacitor_platform_1.CapacitorPlatform.android, project.packageManager))
                .setData(project.projectFolder())
                .setRunPoints(runPoints)
                .canStop()
                .willNotBlock()
                .canAnimate()
                .canRefreshAfter()
                .setSyncOnSuccess(capacitor_platform_1.CapacitorPlatform.android)
                .setContextValue(context_variables_1.Context.selectDevice);
            project.add(runAndroid);
            ionic_tree_provider_1.ionicState.runAndroid = runAndroid;
        }
        if (hasCapIos) {
            const runIos = new tip_1.Tip('iOS', (_b = ionic_tree_provider_1.ionicState.selectedIOSDeviceName) !== null && _b !== void 0 ? _b : '', tip_1.TipType.Run, 'Run', undefined, 'Running', 'Project is running')
                .requestDeviceSelection()
                .requestIPSelection()
                .setDynamicCommand(capacitor_run_1.capacitorRun, project, capacitor_platform_1.CapacitorPlatform.ios)
                .setSecondCommand('Getting Devices', (0, capacitor_run_1.capacitorDevicesCommand)(capacitor_platform_1.CapacitorPlatform.ios, project.packageManager))
                .setData(project.projectFolder())
                .setRunPoints(runPoints)
                .canStop()
                .willNotBlock()
                .canAnimate()
                .canRefreshAfter()
                .setSyncOnSuccess(capacitor_platform_1.CapacitorPlatform.ios)
                .setContextValue(context_variables_1.Context.selectDevice);
            project.add(runIos);
            ionic_tree_provider_1.ionicState.runIOS = runIos;
        }
        const r = project.setGroup('Debug', `Running Ionic applications you can debug (${(0, utilities_1.alt)('D')})`, tip_1.TipType.Ionic, ionic_tree_provider_1.ionicState.refreshDebugDevices, context_variables_1.Context.refreshDebug);
        r.whenExpanded = async () => {
            return [
                project.asRecommendation(debugOnWeb(project)),
                ...(await (0, android_debug_list_1.getAndroidWebViewList)(hasCapAndroid, project.getDistFolder())),
            ];
        };
        project
            .setGroup('Project', 'Capacitor Features', tip_1.TipType.Capacitor, true)
            .setData(project)
            .setContext(context_variables_1.Context.selectAction);
        if (project.isCapacitor) {
            if ((0, analyzer_1.exists)('@angular/core')) {
                project.setSubGroup('New', tip_1.TipType.Add, 'Create new Angular Components, Pages and more');
                ['Page', 'Component', 'Service', 'Module', 'Class', 'Directive'].forEach((item) => {
                    project.add(new tip_1.Tip(item, '', tip_1.TipType.Angular)
                        .setQueuedAction(angular_generate_1.angularGenerate, project, item.toLowerCase())
                        .setTooltip(`Create a new Angular ${item.toLowerCase()}`)
                        .canRefreshAfter());
                });
                project.clearSubgroup();
            }
        }
        project.add(build(project));
        if (hasCapIos || hasCapAndroid) {
            project.add(new tip_1.Tip('Sync', '', tip_1.TipType.Sync, 'Capacitor Sync', undefined, 'Syncing', undefined)
                .setDynamicCommand(capacitor_sync_1.capacitorSync, project)
                .canStop()
                .canAnimate()
                .setTooltip('Capacitor Sync copies the web app build assets to the native projects and updates native plugins and dependencies.'));
        }
        if (hasCapIos) {
            project.add(new tip_1.Tip('Open in Xcode', '', tip_1.TipType.Edit, 'Opening Project in Xcode', undefined, 'Open Project in Xcode')
                .showProgressDialog()
                .setDynamicCommand(capacitor_open_1.capacitorOpen, project, capacitor_platform_1.CapacitorPlatform.ios)
                .setTooltip('Opens the native iOS project in XCode'));
        }
        if (hasCapAndroid) {
            project.add(new tip_1.Tip('Open in Android Studio', '', tip_1.TipType.Edit, 'Opening Project in Android Studio', undefined, 'Open Android Studio')
                .showProgressDialog()
                .setDynamicCommand(capacitor_open_1.capacitorOpen, project, capacitor_platform_1.CapacitorPlatform.android)
                .setTooltip('Opens the native Android project in Android Studio'));
        }
        if (hasCapAndroid || hasCapIos) {
            // cap build was added in v4.4.0
            if ((0, analyzer_1.isGreaterOrEqual)('@capacitor/core', '4.4.0')) {
                project.add(new tip_1.Tip('Prepare Release', '', tip_1.TipType.Build, 'Capacitor Build', undefined, 'Preparing Release Build', undefined)
                    .setQueuedAction(capacitor_build_1.capacitorBuild, project)
                    .canAnimate()
                    .setTooltip('Prepares native binaries suitable for uploading to the App Store or Play Store.'));
            }
        }
    }
    // Script Running
    (0, scripts_1.addScripts)(project);
    if (project.isCapacitor || project.hasACapacitorProject()) {
        // Capacitor Configure Features
        project.setGroup(`Configuration`, 'Configurations for native project. Changes made apply to both the iOS and Android projects', tip_1.TipType.Capacitor, false);
        await (0, capacitor_configure_1.reviewCapacitorConfig)(project, context);
        // Splash Screen and Icon Features
        (0, splash_icon_1.addSplashAndIconFeatures)(project);
        // Not needed: only shows Android permissions and features used
        //reviewPluginProperties(packages, project);
        project.add(new tip_1.Tip('Check for Minor Updates', '', tip_1.TipType.Dependency)
            .setQueuedAction(update_minor_1.updateMinorDependencies, project, packages)
            .setTooltip('Find minor updates for project dependencies'));
        if (project.packageManager == node_commands_1.PackageManager.npm) {
            project.add(new tip_1.Tip('Security Audit', '', tip_1.TipType.Files)
                .setQueuedAction(audit_1.audit, project)
                .setTooltip('Analyze dependencies using npm audit for security vulnerabilities'));
        }
        project.add(new tip_1.Tip('Statistics', '', tip_1.TipType.Files)
            .setQueuedAction(analyze_size_1.analyzeSize, project)
            .setTooltip('Analyze the built project assets and Javascript bundles'));
        project.add(new tip_1.Tip('Export', '', tip_1.TipType.Media)
            .setQueuedAction(ionic_export_1.ionicExport, project, ionic_tree_provider_1.ionicState.context)
            .setTooltip('Export a markdown file with all project dependencies and plugins'));
    }
    project.setGroup(`Recommendations`, `The following recommendations were made by analyzing the package.json file of your ${project.type} app.`, tip_1.TipType.Idea, true);
    // General Rules around node modules (eg Jquery)
    (0, rules_packages_1.checkPackages)(project);
    // Deprecated removals
    for (const deprecated of (0, analyzer_1.deprecatedPackages)(packages)) {
        project.recommendRemove(deprecated.name, deprecated.name, `${deprecated.name} is deprecated: ${deprecated.message}`);
    }
    (0, rules_packages_1.checkRemoteDependencies)(project);
    // Deprecated plugins
    (0, rules_deprecated_plugins_1.checkDeprecatedPlugins)(project);
    if (project.isCordova) {
        (0, rules_cordova_1.checkCordovaRules)(project);
        if (!project.isCapacitor) {
            await (0, rules_capacitor_migration_1.capacitorMigrationChecks)(packages, project);
        }
    }
    if (project.isCapacitor) {
        (0, rules_capacitor_1.checkCapacitorRules)(project);
        (0, rules_ionic_native_1.checkIonicNativePackages)(packages, project);
        (0, rules_cordova_1.checkCordovaPlugins)(packages, project);
        project.tips(await (0, rules_capacitor_1.capacitorRecommendations)(project, false));
    }
    if (!project.isCapacitor && !project.isCordova) {
        // The project is not using Cordova or Capacitor
        (0, rules_web_project_1.webProject)(project);
    }
    // Package Upgrade Features
    (0, process_packages_1.reviewPackages)(packages, project);
    project.setGroup(`Settings`, 'Settings', tip_1.TipType.Settings, false);
    if (project.isCapacitor) {
        if ((0, analyzer_1.exists)('@capacitor/ios') || (0, analyzer_1.exists)('@capacitor/android')) {
            project.add(liveReload());
        }
        project.add(useHttps(project));
        //project.add(remoteLogging(project));
        project.add(new tip_1.Tip('Logging', undefined, tip_1.TipType.Settings, undefined)
            .setTooltip('Settings for logging displayed in the output window')
            .setQueuedAction(log_settings_1.LoggingSettings, project));
    }
    project.add(new tip_1.Tip('Advanced', '', tip_1.TipType.Settings).setQueuedAction(settings));
    // Support and Feedback
    project.setGroup(`Support`, 'Feature requests and bug fixes', tip_1.TipType.Ionic, false);
    project.add(new tip_1.Tip('Provide Feedback', '', tip_1.TipType.Comment, undefined, undefined, undefined, undefined, `https://github.com/ionic-team/vscode-extension/issues`));
    project.add(new tip_1.Tip('Ionic Framework', '', tip_1.TipType.Ionic, undefined, undefined, undefined, undefined, `https://ionicframework.com`));
}
exports.getRecommendations = getRecommendations;
async function settings(queueFunction) {
    queueFunction();
    await vscode_1.commands.executeCommand('workbench.action.openSettings', "Ionic'");
}
function debugOnWeb(project) {
    return new tip_1.Tip('Web', `(${(0, editor_preview_1.getDebugBrowserName)()})`, tip_1.TipType.Debug, 'Serve', undefined, 'Debugging', `Project Served`)
        .setDynamicCommand(ionic_serve_1.ionicServe, project, true)
        .setFeatures([tip_1.TipFeature.debugOnWeb])
        .setRunPoints([
        { title: 'Building...', text: 'Generating browser application bundles' },
        { title: 'Serving', text: 'Development server running' },
    ])
        .canStop()
        .setContextValue(context_variables_1.Context.webDebugConfig)
        .setVSCommand(command_name_1.CommandName.Debug)
        .willNotBlock()
        .canAnimate()
        .setTooltip(`Debug using ${(0, editor_preview_1.getDebugBrowserName)()}. (${(0, utilities_1.alt)('D')})`);
}
exports.debugOnWeb = debugOnWeb;
function build(project) {
    return new tip_1.Tip('Build', (0, build_configuration_1.getConfigurationName)(), tip_1.TipType.Build, 'Build', undefined, 'Building', undefined)
        .setDynamicCommand(ionic_build_1.ionicBuild, project)
        .setContextValue(context_variables_1.Context.buildConfig)
        .canStop()
        .canAnimate()
        .setVSCommand(command_name_1.CommandName.Build)
        .setTooltip('Builds the web project (and copies to native platforms)');
}
exports.build = build;
function liveReload() {
    const liveReload = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.liveReload);
    return new tip_1.Tip('Live Reload', undefined, liveReload ? tip_1.TipType.Check : tip_1.TipType.Box, undefined)
        .setTooltip('Live reload will refresh the app whenever source code is changed.')
        .setQueuedAction(toggleLiveReload, liveReload)
        .canRefreshAfter();
}
function useHttps(project) {
    if (!(0, analyzer_1.exists)('@angular/core'))
        return;
    const useHttps = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.httpsForWeb);
    return new tip_1.Tip('Use HTTPS', undefined, useHttps ? tip_1.TipType.Check : tip_1.TipType.Box, undefined)
        .setTooltip('Use HTTPS when running with web or Live Reload.')
        .setQueuedAction(toggleHttps, useHttps, project)
        .canRefreshAfter();
}
async function toggleRemoteLogging(project, current) {
    if (await (0, log_server_1.startStopLogServer)(project.folder)) {
        ionic_tree_provider_1.ionicState.remoteLogging = !current;
    }
    await (0, tasks_1.cancelLastOperation)();
    return Promise.resolve();
}
async function toggleLiveReload(queueFunction, current) {
    queueFunction();
    await (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.liveReload, !current);
}
async function toggleHttps(queueFunction, current, project) {
    queueFunction();
    await (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.httpsForWeb, !current);
    if (!current) {
        await (0, utilities_1.showProgress)('Enabling HTTPS', async () => {
            (0, logging_1.writeIonic)('Installing @jcesarmobile/ssl-skip');
            await (0, utilities_1.getRunOutput)((0, node_commands_1.npmInstall)('@jcesarmobile/ssl-skip'), project.folder);
            await (0, live_reload_1.liveReloadSSL)(project);
        });
    }
    else {
        await (0, utilities_1.showProgress)('Disabling HTTPS', async () => {
            (0, logging_1.writeIonic)('Uninstalling @jcesarmobile/ssl-skip');
            await (0, utilities_1.getRunOutput)((0, node_commands_1.npmUninstall)('@jcesarmobile/ssl-skip'), project.folder);
        });
    }
    await (0, tasks_1.cancelLastOperation)();
}
//# sourceMappingURL=recommend.js.map