"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCapacitorConfigWebDir = exports.reviewCapacitorConfig = void 0;
const project_1 = require("@trapezedev/project");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const context_variables_1 = require("./context-variables");
const path_1 = require("path");
const capacitor_config_file_1 = require("./capacitor-config-file");
const logging_1 = require("./logging");
const fs_1 = require("fs");
const vscode_1 = require("vscode");
var NativePlatform;
(function (NativePlatform) {
    NativePlatform[NativePlatform["iOSOnly"] = 0] = "iOSOnly";
    NativePlatform[NativePlatform["AndroidOnly"] = 1] = "AndroidOnly";
})(NativePlatform || (NativePlatform = {}));
let useCapProjectCache = true;
/**
 * Reviews the native app project for bundle id, display name, version and build numbers
 * @param  {Project} project
 * @param  {vscode.ExtensionContext} context
 */
async function reviewCapacitorConfig(project, context) {
    var _a, _b;
    const state = await getCapacitorProjectState(project, context);
    if (!state) {
        return;
    }
    project.setSubGroup('Properties', tip_1.TipType.Settings, undefined, undefined, true);
    // Allow the user to set the bundle id
    if (state.androidBundleId == state.iosBundleId || !state.iosBundleId || !state.androidBundleId) {
        // Create a single Bundle Id the user can edit
        const bundleId = state.androidBundleId ? state.androidBundleId : state.iosBundleId;
        const tip = new tip_1.Tip('Bundle Id', bundleId, tip_1.TipType.None);
        tip.setQueuedAction(setBundleId, bundleId, project, project.folder);
        project.add(tip);
    }
    else {
        // Bundle Ids different
        const tip = new tip_1.Tip('Android Bundle Id', state.androidBundleId, tip_1.TipType.None);
        tip.setQueuedAction(setBundleId, state.androidBundleId, project, project.folder, NativePlatform.AndroidOnly);
        project.add(tip);
        const tip2 = new tip_1.Tip('iOS Bundle Id', state.iosBundleId, tip_1.TipType.None);
        tip2.setQueuedAction(setBundleId, state.iosBundleId, project, project.folder, NativePlatform.iOSOnly);
        project.add(tip2);
    }
    // Allow the user to edit the display name of the app
    if (state.androidDisplayName == state.iosDisplayName || !state.iosDisplayName || !state.androidDisplayName) {
        const displayName = state.androidDisplayName ? state.androidDisplayName : state.iosDisplayName;
        const tip = new tip_1.Tip('Display Name', displayName, tip_1.TipType.None);
        tip.setQueuedAction(setDisplayName, displayName, project, project.folder);
        project.add(tip);
    }
    else {
        const tip = new tip_1.Tip('Android Display Name', state.androidDisplayName, tip_1.TipType.None);
        tip.setQueuedAction(setDisplayName, state.androidDisplayName, project, project.folder, NativePlatform.AndroidOnly);
        project.add(tip);
        const tip2 = new tip_1.Tip('iOS Display Name', state.iosDisplayName, tip_1.TipType.None);
        tip2.setQueuedAction(setDisplayName, state.iosDisplayName, project, project.folder, NativePlatform.iOSOnly);
        project.add(tip2);
    }
    // Allow the user to set the version
    if (state.androidVersion == state.iosVersion || !state.iosVersion || !state.androidVersion) {
        const version = state.androidVersion ? state.androidVersion : state.iosVersion;
        const tip = new tip_1.Tip('Version Number', version === null || version === void 0 ? void 0 : version.toString(), tip_1.TipType.None);
        tip.setQueuedAction(setVersion, version, project);
        project.add(tip);
    }
    else {
        const tip = new tip_1.Tip('Android Version Number', state.androidVersion, tip_1.TipType.None);
        tip.setQueuedAction(setVersion, state.androidVersion, project, NativePlatform.AndroidOnly);
        project.add(tip);
        const tip2 = new tip_1.Tip('iOS Version Number', state.iosVersion, tip_1.TipType.None);
        tip2.setQueuedAction(setVersion, state.iosVersion, project, NativePlatform.iOSOnly);
        project.add(tip2);
    }
    // Allow the user to increment the build
    if (state.androidBuild == state.iosBuild || !state.iosBuild || !state.androidBuild) {
        const build = state.androidBuild ? state.androidBuild : state.iosBuild;
        const tip = new tip_1.Tip('Build Number', build === null || build === void 0 ? void 0 : build.toString(), tip_1.TipType.None);
        tip.setQueuedAction(setBuild, build, project);
        project.add(tip);
    }
    else {
        const tip = new tip_1.Tip('Android Build Number', (_a = state.androidBuild) === null || _a === void 0 ? void 0 : _a.toString(), tip_1.TipType.None);
        tip.setQueuedAction(setBuild, state.androidBuild, project, NativePlatform.AndroidOnly);
        project.add(tip);
        const tip2 = new tip_1.Tip('iOS Build Number', (_b = state.iosBuild) === null || _b === void 0 ? void 0 : _b.toString(), tip_1.TipType.None);
        tip2.setQueuedAction(setBuild, state.iosBuild, project, NativePlatform.iOSOnly);
        project.add(tip2);
    }
    project.clearSubgroup();
}
exports.reviewCapacitorConfig = reviewCapacitorConfig;
/**
 * Gets the full path using a folder and the webDir property from capacitor.config.ts
 * @param  {string} folder
 * @returns string
 */
function getCapacitorConfigWebDir(folder) {
    let result = 'www';
    const config = (0, capacitor_config_file_1.getCapacitorConfigureFile)(folder);
    if (config) {
        result = (0, utilities_1.getStringFrom)(config, `webDir: '`, `'`);
        if (!result) {
            result = (0, utilities_1.getStringFrom)(config, `webDir: "`, `"`);
        }
    }
    if (!result) {
        // No config file take a best guess
        if ((0, fs_1.existsSync)((0, path_1.join)(folder, 'www'))) {
            result = 'www';
        }
        else if ((0, fs_1.existsSync)((0, path_1.join)(folder, 'dist'))) {
            result = 'dist';
        }
        else if ((0, fs_1.existsSync)((0, path_1.join)(folder, 'build'))) {
            result = 'build';
        }
    }
    if (!result) {
        result = 'www'; // Assume www folder
    }
    return (0, path_1.join)(folder, result);
}
exports.getCapacitorConfigWebDir = getCapacitorConfigWebDir;
async function getCapacitorProjectState(prj, context) {
    var _a, _b, _c, _d, _e, _f;
    let state = {};
    const tmp = context.workspaceState.get((0, context_variables_1.CapProjectCache)(prj));
    if (tmp) {
        if (useCapProjectCache) {
            state = JSON.parse(tmp);
            return state;
        }
        else {
            useCapProjectCache = true;
        }
    }
    let project;
    try {
        project = await getCapacitorProject(prj);
    }
    catch {
        return undefined;
    }
    if (project.ios) {
        const appTarget = (_a = project.ios) === null || _a === void 0 ? void 0 : _a.getAppTarget();
        if (appTarget) {
            state.iosBundleId = project.ios.getBundleId(appTarget.name);
            state.iosDisplayName = await project.ios.getDisplayName(appTarget.name);
            for (const buildConfig of project.ios.getBuildConfigurations(appTarget.name)) {
                try {
                    state.iosVersion = (_b = project.ios) === null || _b === void 0 ? void 0 : _b.getVersion(appTarget.name, buildConfig.name);
                    state.iosBuild = await project.ios.getBuild(appTarget.name, buildConfig.name);
                }
                catch (error) {
                    (0, logging_1.writeError)(`Unable to getBuild of ios project ${appTarget.name} ${buildConfig.name}`);
                }
            }
        }
        else {
            (0, logging_1.writeError)(`Unable to getAppTarget of ios project ${project.ios.getError().message}`);
        }
    }
    if (project.android) {
        try {
            const [androidBundleId, androidVersion, androidBuild, data] = await Promise.all([
                (_c = project.android) === null || _c === void 0 ? void 0 : _c.getPackageName(),
                (_d = project.android) === null || _d === void 0 ? void 0 : _d.getVersionName(),
                (_e = project.android) === null || _e === void 0 ? void 0 : _e.getVersionCode(),
                (_f = project.android) === null || _f === void 0 ? void 0 : _f.getResource('values', 'strings.xml'),
            ]);
            state.androidBundleId = androidBundleId;
            state.androidVersion = androidVersion;
            state.androidBuild = androidBuild;
            state.androidDisplayName = (0, utilities_1.getStringFrom)(data, `<string name="app_name">`, `</string`);
        }
        catch (error) {
            console.error('getCapacitorProjectState', error);
            return undefined;
        }
    }
    if (!project.ios && !project.android) {
        return undefined;
    }
    context.workspaceState.update((0, context_variables_1.CapProjectCache)(prj), JSON.stringify(state));
    return state;
}
/**
 * Change the Bundle Id of an App in the iOS and Android projects
 * @param  {string} bundleId The original bundle id / package name
 * @param  {string} folder Folder for the project
 * @param  {NativePlatform} platform Whether iOS or Android only (default both)
 */
async function setBundleId(queueFunction, bundleId, prj, folder, platform) {
    var _a, _b;
    const newBundleId = await vscode_1.window.showInputBox({
        title: 'Application Bundle Id',
        placeHolder: bundleId,
        value: bundleId,
        validateInput: (value) => {
            const regexp = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i;
            if (!regexp.test(value)) {
                return 'You cannot use spaces and some special characters like -. Must contain at least one full stop';
            }
            return null;
        },
    });
    if (!newBundleId) {
        return; // User cancelled
    }
    queueFunction();
    const project = await getCapacitorProject(prj);
    if ((project === null || project === void 0 ? void 0 : project.ios) && platform != NativePlatform.AndroidOnly) {
        const appTarget = (_a = project.ios) === null || _a === void 0 ? void 0 : _a.getAppTarget();
        if (appTarget) {
            for (const buildConfig of project.ios.getBuildConfigurations(appTarget.name)) {
                (0, logging_1.write)(`Set iOS Bundle Id for target ${appTarget.name} buildConfig.${buildConfig.name} to ${newBundleId}`);
                project.ios.setBundleId(appTarget.name, buildConfig.name, newBundleId);
            }
        }
        else {
            (0, logging_1.writeError)(`Unable to update iosProject bundleId: ${project.ios.getError().message}`);
        }
    }
    if (project.android && platform != NativePlatform.iOSOnly) {
        (0, logging_1.write)(`Set Android Package Name to ${newBundleId}`);
        try {
            // This doesnt really work in Trapeze: https://github.com/ionic-team/trapeze/issues/191
            // So we alter strings.xml afterwards
            await ((_b = project.android) === null || _b === void 0 ? void 0 : _b.setPackageName(newBundleId));
        }
        catch (error) {
            (0, logging_1.writeError)(`Unable to setPackageName for android: ${error}`);
            console.error(error);
            return;
        }
    }
    await project.commit();
    await updateStringsXML(folder, prj, newBundleId);
    (0, capacitor_config_file_1.updateCapacitorConfig)(prj, newBundleId);
    (0, logging_1.showOutput)();
    clearCapProjectCache();
}
async function updateStringsXML(folder, prj, newBundleId) {
    var _a;
    const project = await getCapacitorProject(prj);
    let data = await ((_a = project.android) === null || _a === void 0 ? void 0 : _a.getResource('values', 'strings.xml'));
    if (!data) {
        (0, logging_1.write)(`Unable to set Android display name`);
    }
    data = (0, utilities_1.setStringIn)(data, `<string name="package_name">`, `</string>`, newBundleId);
    data = (0, utilities_1.setStringIn)(data, `<string name="custom_url_scheme">`, `</string>`, newBundleId);
    const filename = (0, path_1.join)(folder, 'android/app/src/main/res/values/strings.xml');
    if ((0, fs_1.existsSync)(filename)) {
        (0, fs_1.writeFileSync)(filename, data);
    }
}
function setValueIn(data, key, value) {
    if (data.includes(`${key}: '`)) {
        data = (0, utilities_1.setStringIn)(data, `${key}: '`, `'`, value);
    }
    else if (data.includes(`${key}: "`)) {
        data = (0, utilities_1.setStringIn)(data, `${key}: "`, `"`, value);
    }
    return data;
}
function clearCapProjectCache() {
    useCapProjectCache = false;
}
/**
 * Set Version Number of iOS and Android Project
 * @param  {string} version
 * @param  {NativePlatform} platform Whether to apply for iOS only, Android only or both (default)
 */
async function setVersion(queueFunction, version, prj, platform) {
    var _a, _b;
    const newVersion = await vscode_1.window.showInputBox({
        title: 'Application Version Number',
        placeHolder: version,
        value: version,
        validateInput: (value) => {
            const regexp = /^\S+$/;
            if (!regexp.test(value)) {
                return 'This version number is not valid';
            }
            return null;
        },
    });
    if (!newVersion) {
        return; // User cancelled
    }
    queueFunction();
    const project = await getCapacitorProject(prj);
    if ((project === null || project === void 0 ? void 0 : project.ios) && platform != NativePlatform.AndroidOnly) {
        const appTarget = (_a = project.ios) === null || _a === void 0 ? void 0 : _a.getAppTarget();
        for (const buildConfig of project.ios.getBuildConfigurations(appTarget.name)) {
            (0, logging_1.write)(`Set iOS Version for target ${appTarget.name} buildConfig.${buildConfig.name} to ${newVersion}`);
            await project.ios.setVersion(appTarget.name, buildConfig.name, newVersion);
        }
    }
    if (project.android && platform != NativePlatform.iOSOnly) {
        (0, logging_1.write)(`Set Android Version to ${newVersion}`);
        await ((_b = project.android) === null || _b === void 0 ? void 0 : _b.setVersionName(newVersion));
    }
    await project.commit();
    (0, utilities_1.channelShow)();
    clearCapProjectCache();
}
/**
 * Set the build number
 * @param  {string} build The build number
 * @param  {CapacitorProject} project The Capacitor project
 * @param  {NativePlatform} platform Whether to apply on iOS only, Android Only or both (default)
 */
async function setBuild(queueFunction, build, prj, platform) {
    var _a, _b;
    const newBuild = await vscode_1.window.showInputBox({
        title: 'Application Build Number',
        placeHolder: build,
        value: build,
        validateInput: (value) => {
            const regexp = /^\d+$/;
            if (!regexp.test(value)) {
                return 'You can only use the digits 0 to 9';
            }
            return null;
        },
    });
    if (!newBuild) {
        return; // User cancelled
    }
    queueFunction();
    const project = await getCapacitorProject(prj);
    if ((project === null || project === void 0 ? void 0 : project.ios) && platform != NativePlatform.AndroidOnly) {
        const appTarget = (_a = project.ios) === null || _a === void 0 ? void 0 : _a.getAppTarget();
        for (const buildConfig of project.ios.getBuildConfigurations(appTarget.name)) {
            (0, logging_1.write)(`Set iOS Version for target ${appTarget.name} buildConfig.${buildConfig.name} to ${newBuild}`);
            await project.ios.setBuild(appTarget.name, buildConfig.name, parseInt(newBuild));
        }
    }
    if (project.android && platform != NativePlatform.iOSOnly) {
        (0, logging_1.write)(`Set Android Version to ${newBuild}`);
        await ((_b = project.android) === null || _b === void 0 ? void 0 : _b.setVersionCode(parseInt(newBuild)));
    }
    await project.commit();
    clearCapProjectCache();
    (0, utilities_1.channelShow)();
}
/**
 * Set the display name of the app
 * @param  {string} currentDisplayName The current value for the display name
 * @param  {string} folder Folder for the project
 * @param  {NativePlatform} platform Whether to apply to iOS only, Android only or both (default)
 */
async function setDisplayName(queueFunction, currentDisplayName, prj, folder, platform) {
    var _a, _b;
    const displayName = await vscode_1.window.showInputBox({
        title: 'Application Display Name',
        placeHolder: currentDisplayName,
        value: currentDisplayName,
    });
    if (!displayName) {
        return; // User cancelled
    }
    queueFunction();
    const project = await getCapacitorProject(prj);
    console.log(`Display name changed to ${displayName}`);
    if (project.ios != null && platform != NativePlatform.AndroidOnly) {
        const appTarget = (_a = project.ios) === null || _a === void 0 ? void 0 : _a.getAppTarget();
        for (const buildConfig of project.ios.getBuildConfigurations(appTarget.name)) {
            (0, logging_1.write)(`Set iOS Displayname for target ${appTarget.name} buildConfig.${buildConfig.name} to ${displayName}`);
            await project.ios.setDisplayName(appTarget.name, buildConfig.name, displayName);
        }
    }
    if (project.android != null && platform != NativePlatform.iOSOnly) {
        let data = await ((_b = project.android) === null || _b === void 0 ? void 0 : _b.getResource('values', 'strings.xml'));
        if (!data) {
            (0, logging_1.write)(`Unable to set Android display name`);
        }
        data = (0, utilities_1.setStringIn)(data, `<string name="app_name">`, `</string>`, displayName);
        data = (0, utilities_1.setStringIn)(data, `<string name="title_activity_main">`, `</string>`, displayName);
        const filename = (0, path_1.join)(folder, 'android/app/src/main/res/values/strings.xml');
        if ((0, fs_1.existsSync)(filename)) {
            (0, fs_1.writeFileSync)(filename, data);
            (0, logging_1.write)(`Set Android app_name to ${displayName}`);
            (0, logging_1.write)(`Set Android title_activity_main to ${displayName}`);
        }
        else {
            vscode_1.window.showErrorMessage('Unable to write to ' + filename);
        }
    }
    (0, utilities_1.channelShow)();
    project.commit();
    (0, capacitor_config_file_1.updateCapacitorConfig)(prj, undefined, displayName);
    clearCapProjectCache();
}
async function getCapacitorProject(prj) {
    const capConfig = {
        ios: {
            path: (0, path_1.join)(prj.projectFolder(), 'ios', 'App'),
        },
        android: {
            path: (0, path_1.join)(prj.projectFolder(), 'android'),
        },
    };
    const project = new project_1.MobileProject('', capConfig);
    await project.load();
    return project;
}
//# sourceMappingURL=capacitor-configure.js.map