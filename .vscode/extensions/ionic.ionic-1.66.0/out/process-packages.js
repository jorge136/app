"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewPluginsWithHooks = exports.reviewPackages = exports.processPackages = exports.clearRefreshCache = void 0;
const semver_1 = require("semver");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const npm_model_1 = require("./npm-model");
const node_commands_1 = require("./node-commands");
const context_variables_1 = require("./context-variables");
const path_1 = require("path");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const logging_1 = require("./logging");
const monorepo_1 = require("./monorepo");
const vscode_1 = require("vscode");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
function clearRefreshCache(context) {
    if (context) {
        for (const key of context.workspaceState.keys()) {
            if (key.startsWith((0, context_variables_1.PackageCacheOutdated)(undefined))) {
                context.workspaceState.update(key, undefined);
            }
            if (key.startsWith((0, context_variables_1.PackageCacheList)(undefined))) {
                context.workspaceState.update(key, undefined);
            }
            if (key.startsWith((0, context_variables_1.CapProjectCache)(undefined))) {
                context.workspaceState.update(key, undefined);
            }
        }
    }
    console.log('Cached data cleared');
}
exports.clearRefreshCache = clearRefreshCache;
async function processPackages(folder, allDependencies, devDependencies, context, project) {
    if (!(0, fs_1.lstatSync)(folder).isDirectory()) {
        return {};
    }
    // npm outdated only shows dependencies and not dev dependencies if the node module isnt installed
    let outdated = '[]';
    let versions = '{}';
    try {
        const packagesModified = project.modified;
        const packageModifiedLast = context.workspaceState.get((0, context_variables_1.PackageCacheModified)(project));
        outdated = context.workspaceState.get((0, context_variables_1.PackageCacheOutdated)(project));
        versions = context.workspaceState.get((0, context_variables_1.PackageCacheList)(project));
        const changed = packagesModified.toUTCString() != packageModifiedLast;
        if (changed) {
            ionic_tree_provider_1.ionicState.syncDone = [];
        }
        if (changed || !outdated || !versions) {
            await Promise.all([
                (0, utilities_1.getRunOutput)((0, node_commands_1.outdatedCommand)(project.packageManager), folder, undefined, true).then((data) => {
                    data = (0, monorepo_1.fixYarnGarbage)(data, project.packageManager);
                    outdated = data;
                    context.workspaceState.update((0, context_variables_1.PackageCacheOutdated)(project), outdated);
                }),
                (0, utilities_1.getRunOutput)((0, node_commands_1.listCommand)(project.packageManager), folder, undefined, true).then((data) => {
                    versions = data;
                    context.workspaceState.update((0, context_variables_1.PackageCacheList)(project), versions);
                }),
            ]);
            context.workspaceState.update((0, context_variables_1.PackageCacheModified)(project), packagesModified.toUTCString());
        }
        else {
            // Use the cached value
            // But also get a copy of the latest packages for updating later
            (0, utilities_1.getRunOutput)((0, node_commands_1.outdatedCommand)(project.packageManager), folder, undefined, true).then((outdatedFresh) => {
                context.workspaceState.update((0, context_variables_1.PackageCacheOutdated)(project), outdatedFresh);
                context.workspaceState.update((0, context_variables_1.PackageCacheModified)(project), packagesModified.toUTCString());
            });
            (0, utilities_1.getRunOutput)((0, node_commands_1.listCommand)(project.packageManager), folder, undefined, true).then((versionsFresh) => {
                context.workspaceState.update((0, context_variables_1.PackageCacheList)(project), versionsFresh);
            });
        }
    }
    catch (err) {
        outdated = '[]';
        versions = '{}';
        if (err && err.includes('401')) {
            vscode_1.window.showInformationMessage(`Unable to run '${(0, node_commands_1.outdatedCommand)(project.packageManager)}' due to authentication error. Check .npmrc`, 'OK');
        }
        if (project.isModernYarn()) {
            (0, logging_1.writeWarning)(`Modern Yarn does not have a command to review outdated package versions. Most functionality of this extension will be disabled.`);
        }
        else {
            (0, logging_1.writeError)(`Unable to run '${(0, node_commands_1.outdatedCommand)(project.packageManager)}'. Try reinstalling node modules.`);
            console.error(err);
        }
    }
    // outdated is an array with:
    //  "@ionic-native/location-accuracy": { "wanted": "5.36.0", "latest": "5.36.0", "dependent": "cordova-old" }
    const packages = processDependencies(allDependencies, getOutdatedData(outdated), devDependencies, getListData(versions));
    inspectPackages(project.projectFolder() ? project.projectFolder() : folder, packages);
    return packages;
}
exports.processPackages = processPackages;
function getOutdatedData(outdated) {
    try {
        return JSON.parse((0, utilities_1.stripJSON)(outdated, '{'));
    }
    catch {
        return [];
    }
}
function getListData(list) {
    try {
        return JSON.parse(list);
    }
    catch {
        return { name: undefined, dependencies: undefined, version: undefined };
    }
}
function reviewPackages(packages, project) {
    if (!packages || Object.keys(packages).length == 0)
        return;
    listPackages(project, 'Packages', `Your ${project.type} project relies on these packages. Consider packages which have not had updates in more than a year to be a candidate for replacement in favor of a project that is actively maintained.`, packages, [npm_model_1.PackageType.Dependency]);
    listPackages(project, `Plugins`, `Your project relies on these Capacitor and Cordova plugins. Consider plugins which have not had updates in more than a year to be a candidate for replacement in favor of a plugin that is actively maintained.`, packages, [npm_model_1.PackageType.CordovaPlugin, npm_model_1.PackageType.CapacitorPlugin], tip_1.TipType.Capacitor);
    // listPackages(
    //   project,
    //   `Capacitor Plugins`,
    //   `Your project relies on these Capacitor plugins. Consider plugins which have not had updates in more than a year to be a candidate for replacement in favor of a plugin that is actively maintained.`,
    //   packages,
    //   [PackageType.CapacitorPlugin],
    //   TipType.Capacitor
    // );
}
exports.reviewPackages = reviewPackages;
// List any plugins that use Cordova Hooks as potential issue
function reviewPluginsWithHooks(packages) {
    const tips = [];
    // List of packages that don't need to be reported to the user because they would be dropped in a Capacitor migration
    const dontReport = [
        'cordova-plugin-add-swift-support',
        'cordova-plugin-androidx',
        'cordova-plugin-androidx-adapter',
        'cordova-plugin-ionic',
        'phonegap-plugin-push',
        'cordova-plugin-push', // This has a hook for browser which is not applicable
    ];
    if (Object.keys(packages).length == 0)
        return;
    for (const library of Object.keys(packages)) {
        if (packages[library].plugin &&
            packages[library].plugin.hasHooks &&
            !dontReport.includes(library) &&
            !library.startsWith('@ionic-enterprise')) {
            let msg = 'contains Cordova hooks that may require manual migration to use with Capacitor.';
            if (library == 'branch-cordova-sdk') {
                msg = ' can be replaced with capacitor-branch-deep-links which is compatible with Capacitor.';
            }
            tips.push(new tip_1.Tip(library, msg, tip_1.TipType.Warning, `${library} ${msg}`, tip_1.Command.NoOp, 'OK'));
        }
        else {
            if (packages[library].version == npm_model_1.PackageVersion.Custom) {
                tips.push(new tip_1.Tip(library, `Review ${library}`, tip_1.TipType.Warning, `${library} cannot be inspected to check for Capacitor compatibility as it is a custom plugin or is a remote dependency. You will need to manually test this plugin after migration to Capacitor - the good news is that most plugins will work.`, tip_1.Command.NoOp, 'OK'));
                //
            }
        }
    }
    return tips;
}
exports.reviewPluginsWithHooks = reviewPluginsWithHooks;
// export function reviewPluginProperties(packages, project: Project) {
//   if (Object.keys(packages).length == 0) return;
//   // Process features and permissions
//   const features = {};
//   const permissions = {};
//   for (const library of Object.keys(packages)) {
//     if (packages[library].depType == 'Plugin') {
//       for (const permission of packages[library].plugin.androidPermissions) {
//         if (!permissions[permission]) {
//           permissions[permission] = [];
//         }
//         permissions[permission].push(library);
//       }
//       for (const feature of packages[library].plugin.androidFeatures) {
//         if (!features[feature]) {
//           features[feature] = [];
//         }
//         features[feature].push(library);
//       }
//     }
//   }
//   if (Object.keys(permissions).length > 0) {
//     project.setSubGroup(
//       `Android Permissions`,
//       TipType.Android,
//       'The following Android permissions are used by plugins.'
//     );
//     for (const permission of Object.keys(permissions)) {
//       project.add(new Tip(permission, permissions[permission].join(', ')));
//     }
//     project.clearSubgroup();
//   }
//   if (Object.keys(features).length > 0) {
//     project.setSubGroup(`Android Features`, TipType.Android, 'The following Android features are used by plugins.');
//     for (const feature of Object.keys(features)) {
//       project.add(new Tip(feature, features[feature].join(', ')));
//     }
//     project.clearSubgroup();
//   }
// }
function dateDiff(d1, d2) {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    months = months <= 0 ? 0 : months;
    let updated = `${months} months`;
    if (months == 0) {
        updated = 'Recent';
    }
    if (months >= 12) {
        updated = `${Math.trunc(months / 12)} years`;
    }
    return updated;
}
function olderThan(d1, d2, days) {
    const diff = d2.getTime() - d1.getTime();
    return diff / (1000 * 3600 * 24) > days;
}
function markIfPlugin(folder) {
    var _a, _b;
    const pkg = (0, path_1.join)(folder, 'package.json');
    if ((0, fs_1.existsSync)(pkg)) {
        try {
            const packages = JSON.parse((0, fs_1.readFileSync)(pkg, 'utf8'));
            if (((_a = packages.capacitor) === null || _a === void 0 ? void 0 : _a.ios) || ((_b = packages.capacitor) === null || _b === void 0 ? void 0 : _b.android)) {
                return true;
            }
        }
        catch {
            console.warn(`Unable to parse ${pkg}`);
            return false;
        }
    }
    return false;
}
function markDeprecated(lockFile, packages) {
    const txt = (0, fs_1.readFileSync)(lockFile, { encoding: 'utf8' });
    const data = JSON.parse(txt);
    if (!data.packages) {
        return;
    }
    for (const library of Object.keys(data.packages)) {
        const warning = data.packages[library].deprecated;
        if (warning) {
            const l = library.replace('node_modules/', '');
            if (packages[l]) {
                packages[l].deprecated = warning;
            }
        }
    }
}
function inspectPackages(folder, packages) {
    var _a;
    // Use package-lock.json for deprecated packages
    const lockFile = (0, path_1.join)(folder, 'package-lock.json');
    if ((0, fs_1.existsSync)(lockFile)) {
        markDeprecated(lockFile, packages);
    }
    // plugins
    for (const library of Object.keys(packages)) {
        const plugin = (0, path_1.join)(folder, 'node_modules', library, 'plugin.xml');
        if ((0, fs_1.existsSync)(plugin)) {
            // Cordova based
            const content = (0, fs_1.readFileSync)(plugin, 'utf8');
            packages[library].depType = npm_model_1.PackageType.CordovaPlugin;
            packages[library].plugin = processPlugin(content);
        }
        const nmFolder = folder + '/node_modules/' + library;
        let isPlugin = false;
        if ((0, fs_1.existsSync)(nmFolder)) {
            isPlugin = markIfPlugin(nmFolder);
            (0, fs_1.readdirSync)(nmFolder, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .map((dirent) => {
                const hasPlugin = markIfPlugin((0, path_1.join)(nmFolder, dirent.name));
                if (hasPlugin) {
                    isPlugin = true;
                }
            });
        }
        // Look for capacitor only as well
        if (isPlugin) {
            packages[library].depType = npm_model_1.PackageType.CapacitorPlugin;
            if (!packages[library].plugin) {
                packages[library].plugin = processPlugin('');
            }
        }
    }
    // Whether to run without inspecting every package for descriptions, updates etc
    const quick = true;
    for (const library of Object.keys(packages)) {
        // Runs a command like this to find last update and other info:
        // npm show cordova-plugin-app-version --json
        try {
            if (packages[library].version == npm_model_1.PackageVersion.Custom) {
                packages[library].updated = npm_model_1.PackageVersion.Unknown;
                packages[library].description = '';
                packages[library].isOld = true;
            }
            else {
                if (!quick) {
                    const json = (0, child_process_1.execSync)(`npm show ${library} --json`, { cwd: folder }).toString();
                    const info = JSON.parse(json);
                    const modified = new Date(info.time.modified);
                    packages[library].updated = dateDiff(modified, new Date(Date.now())); // "2020-12-10T08:56:06.108Z" -> 6 Months
                    packages[library].isOld = olderThan(modified, new Date(Date.now()), 365);
                    packages[library].url = (_a = info.repository) === null || _a === void 0 ? void 0 : _a.url; // eg git+https://github.com/sampart/cordova-plugin-app-version.git
                    packages[library].description = info.description;
                    packages[library].latest = info.version;
                }
            }
        }
        catch (err) {
            console.log(`Unable to find latest version of ${library} on npm`, err);
            packages[library].updated = npm_model_1.PackageVersion.Unknown;
            packages[library].description = '';
            packages[library].isOld = true;
        }
    }
}
function processPlugin(content) {
    const result = { androidPermissions: [], androidFeatures: [], dependentPlugins: [], hasHooks: false };
    if (content == '') {
        return result;
    }
    content = (0, utilities_1.setAllStringIn)(content, '<platform name="wp8">', '</platform>', '');
    content = (0, utilities_1.setAllStringIn)(content, '<platform name="blackberry10">', '</platform>', '');
    // Inspect plugin.xml in content and return plugin information { androidPermissions: ['android.permission.INTERNET']}
    for (const permission of findAll(content, '<uses-permission android:name="', '"')) {
        result.androidPermissions.push(permission);
    }
    for (const feature of findAll(content, '<uses-feature android:name="', '"')) {
        result.androidFeatures.push(feature);
    }
    for (const dependency of findAll(content, '<dependency id="', '"')) {
        result.dependentPlugins.push(dependency);
    }
    for (const hook of findAll(content, '<hook', '"')) {
        result.hasHooks = true;
    }
    return result;
}
function findAll(content, search, endsearch) {
    const list = Array.from(content.matchAll(new RegExp(search + '(.*?)' + endsearch, 'g')));
    const result = [];
    if (!list)
        return result;
    for (const item of list) {
        result.push(item[1]);
    }
    return result;
}
function listPackages(project, title, description, packages, depTypes, tipType) {
    var _a;
    const count = Object.keys(packages).filter((library) => {
        return depTypes.includes(packages[library].depType);
    }).length;
    if (count == 0)
        return;
    if (title) {
        project.setGroup(`${count} ${title}`, description, tipType, undefined, 'packages');
    }
    let lastScope;
    for (const library of Object.keys(packages).sort()) {
        if (depTypes.includes(packages[library].depType)) {
            let v = `${packages[library].version}`;
            let latest;
            if (v == 'null')
                v = npm_model_1.PackageVersion.Unknown;
            let url = packages[library].url;
            if (url) {
                url = url.replace('git+', '');
            }
            const scope = (0, utilities_1.getStringFrom)(library, '@', '/');
            if (scope != lastScope) {
                if (scope) {
                    latest = undefined;
                    if (scope == 'angular') {
                        //
                        latest = (_a = packages['@angular/core']) === null || _a === void 0 ? void 0 : _a.latest;
                    }
                    project.addSubGroup(scope, latest);
                    lastScope = scope;
                }
                else {
                    project.clearSubgroup();
                }
            }
            let libraryTitle = library;
            const type = tip_1.TipType.None;
            if (scope) {
                libraryTitle = library.substring(scope.length + 2);
            }
            if (v != packages[library].latest && packages[library].latest !== npm_model_1.PackageVersion.Unknown) {
                project.upgrade(library, libraryTitle, `${v} → ${packages[library].latest}`, v, packages[library].latest, type);
            }
            else {
                project.package(library, libraryTitle, `${v}`, type);
            }
        }
    }
    project.clearSubgroup();
}
function processDependencies(allDependencies, outdated, devDependencies, list) {
    var _a, _b;
    const packages = {};
    for (const library of Object.keys(allDependencies)) {
        const dep = list.dependencies ? list.dependencies[library] : undefined;
        let version = dep ? dep.version : `${(0, semver_1.coerce)(allDependencies[library])}`;
        if (((_a = allDependencies[library]) === null || _a === void 0 ? void 0 : _a.startsWith('git')) || ((_b = allDependencies[library]) === null || _b === void 0 ? void 0 : _b.startsWith('file'))) {
            version = npm_model_1.PackageVersion.Custom;
        }
        const recent = outdated[library];
        const wanted = recent === null || recent === void 0 ? void 0 : recent.wanted;
        const latest = (recent === null || recent === void 0 ? void 0 : recent.latest) == undefined ? version : recent.latest;
        const current = recent === null || recent === void 0 ? void 0 : recent.current;
        const isDev = devDependencies && library in devDependencies;
        packages[library] = {
            version: version,
            current: current,
            wanted: wanted,
            latest: latest,
            isDevDependency: isDev,
            depType: npm_model_1.PackageType.Dependency,
        };
        // Set to version found in package lock
        allDependencies[library] = version;
    }
    return packages;
}
//# sourceMappingURL=process-packages.js.map