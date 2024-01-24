'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPackageNames = exports.warnIfNotUsing = exports.reviewPlugin = exports.incompatiblePlugin = exports.incompatibleReplacementPlugin = exports.replacementPlugin = exports.notRequiredPlugin = exports.checkConsistentVersions = exports.isLess = exports.isLessOrEqual = exports.startsWith = exports.isVersionGreaterOrEqual = exports.isGreaterOrEqual = exports.getPackageVersion = exports.checkCordovaIosPreference = exports.checkCordovaAndroidPreferenceMinimum = exports.checkAndroidManifest = exports.checkCordovaAndroidPreference = exports.deprecatedPackages = exports.browsersList = exports.remotePackages = exports.matchingBeginingWith = exports.exists = exports.warnMinVersion = exports.checkMinVersion = exports.load = void 0;
const semver_1 = require("semver");
const fast_xml_parser_1 = require("fast-xml-parser");
const messages_1 = require("./messages");
const process_packages_1 = require("./process-packages");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const node_commands_1 = require("./node-commands");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const vscode_1 = require("vscode");
const fs_1 = require("fs");
let packageFile;
let allDependencies = {};
let cordovaConfig;
let androidManifest;
function processConfigXML(folder) {
    const configXMLFilename = `${folder}/config.xml`;
    const config = { preferences: {}, androidPreferences: {}, iosPreferences: {}, plugins: {} };
    if ((0, fs_1.existsSync)(configXMLFilename)) {
        const xml = (0, fs_1.readFileSync)(configXMLFilename, 'utf8');
        const json = (0, fast_xml_parser_1.parse)(xml, {
            ignoreNameSpace: true,
            arrayMode: true,
            parseNodeValue: true,
            parseAttributeValue: true,
            ignoreAttributes: false,
        });
        const widget = json.widget[0];
        if (widget.preference) {
            for (const pref of widget.preference) {
                config.preferences[pref['@_name']] = pref['@_value'];
            }
        }
        if (!widget.platform)
            return config;
        for (const platform of widget.platform) {
            if (platform['@_name'] == 'android' && platform.preference) {
                for (const pref of platform.preference) {
                    config.androidPreferences[pref['@_name']] = pref['@_value'];
                }
            }
            if (platform['@_name'] == 'ios' && platform.preference) {
                for (const pref of platform.preference) {
                    config.iosPreferences[pref['@_name']] = pref['@_value'];
                }
            }
        }
        if (widget.plugin) {
            for (const plugin of widget.plugin) {
                config.plugins[plugin['@_name']] = plugin['@_spec'];
            }
        }
    }
    return config;
}
function processAndroidXML(folder) {
    const androidXMLFilename = `${folder}/android/app/src/main/AndroidManifest.xml`;
    const config = undefined;
    if (!(0, fs_1.existsSync)(androidXMLFilename)) {
        return config;
    }
    const xml = (0, fs_1.readFileSync)(androidXMLFilename, 'utf8');
    return (0, fast_xml_parser_1.parse)(xml, {
        ignoreNameSpace: true,
        arrayMode: true,
        parseNodeValue: true,
        parseAttributeValue: true,
        ignoreAttributes: false,
    });
}
function getAndroidManifestIntent(actionName) {
    function matches(attribute, value, array) {
        return array.find((element) => element[attribute] == value) != undefined;
    }
    console.log(androidManifest.manifest[0].application[0].activity[0]);
    for (const intent of androidManifest.manifest[0].application[0].activity[0]['intent-filter']) {
        if (matches('@_name', 'android.intent.action.VIEW', intent.action)) {
            return intent;
        }
    }
    return undefined;
}
async function load(fn, project, context) {
    var _a;
    let packageJsonFilename = fn;
    if ((0, fs_1.lstatSync)(fn).isDirectory()) {
        packageJsonFilename = fn + '/package.json';
        cordovaConfig = processConfigXML(fn);
        androidManifest = processAndroidXML(fn);
    }
    ionic_tree_provider_1.ionicState.hasPackageJson = (0, fs_1.existsSync)(packageJsonFilename);
    if (!ionic_tree_provider_1.ionicState.hasPackageJson) {
        (0, messages_1.error)('package.json', 'This folder does not contain an Ionic application (its missing package.json)');
        allDependencies = [];
        packageFile = {};
        return undefined;
    }
    project.modified = (0, fs_1.statSync)(packageJsonFilename).mtime;
    try {
        packageFile = JSON.parse((0, fs_1.readFileSync)(packageJsonFilename, 'utf8'));
    }
    catch (err) {
        throw new Error(`The package.json is malformed: ` + err);
    }
    project.name = packageFile.name;
    if (!project.name) {
        project.name = (_a = project.monoRepo) === null || _a === void 0 ? void 0 : _a.name;
    }
    if (!project.name) {
        project.name = 'unnamed';
    }
    project.workspaces = packageFile.workspaces;
    if (!project.yarnVersion) {
        project.yarnVersion = getYarnVersion(packageFile.packageManager);
    }
    allDependencies = {
        ...packageFile.dependencies,
        ...packageFile.devDependencies,
    };
    // Its a capacitor project only if its a dependency and not a dev dependency
    project.isCapacitor = !!(packageFile.dependencies &&
        (packageFile.dependencies['@capacitor/core'] ||
            packageFile.dependencies['@capacitor/ios'] ||
            packageFile.dependencies['@capacitor/android']));
    project.isCordova = !!(allDependencies['cordova-ios'] || allDependencies['cordova-android'] || packageFile.cordova);
    return await (0, process_packages_1.processPackages)(fn, allDependencies, packageFile.devDependencies, context, project);
}
exports.load = load;
const checkMinVersion = (library, minVersion, reason, url) => {
    const v = (0, semver_1.coerce)(allDependencies[library]);
    if (v && (0, semver_1.lt)(v, minVersion)) {
        const tip = (0, messages_1.writeMinVersionError)(library, v, minVersion, reason).setRelatedDependency(library);
        tip.url = url;
        return tip;
    }
};
exports.checkMinVersion = checkMinVersion;
const warnMinVersion = (library, minVersion, reason, url) => {
    const v = (0, semver_1.coerce)(allDependencies[library]);
    if (v && (0, semver_1.lt)(v, minVersion)) {
        const tip = (0, messages_1.writeMinVersionWarning)(library, v, minVersion, reason, url).setRelatedDependency(library);
        tip.url = url;
        return tip;
    }
};
exports.warnMinVersion = warnMinVersion;
function exists(library) {
    return !!allDependencies[library];
}
exports.exists = exists;
function matchingBeginingWith(start) {
    const result = [];
    for (const library of Object.keys(allDependencies)) {
        if (library.startsWith(start)) {
            result.push(library);
        }
    }
    return result;
}
exports.matchingBeginingWith = matchingBeginingWith;
function remotePackages() {
    var _a;
    const result = [];
    for (const library of Object.keys(allDependencies)) {
        if ((_a = allDependencies[library]) === null || _a === void 0 ? void 0 : _a.startsWith('git')) {
            result.push(library);
        }
    }
    return result;
}
exports.remotePackages = remotePackages;
function browsersList() {
    try {
        return JSON.parse(JSON.stringify(packageFile.browserslist));
    }
    catch {
        return [];
    }
}
exports.browsersList = browsersList;
function deprecatedPackages(packages) {
    const result = [];
    if (!packages)
        return result;
    for (const library of Object.keys(packages)) {
        if (packages[library].deprecated) {
            result.push({ name: library, message: packages[library].deprecated });
        }
    }
    return result;
}
exports.deprecatedPackages = deprecatedPackages;
function checkCordovaAndroidPreference(project, preference, value) {
    if (!cordovaConfig) {
        return;
    }
    if (!equals(cordovaConfig.androidPreferences[preference], value)) {
        const tip = (0, messages_1.error)('config.xml', `The android preference ${preference} should be ${value}. Add <preference name="${preference}" value="${value}" /> to <platform name="android"> in config.xml`).setAfterClickAction('Fix config.xml', AddCordovaAndroidPreference, project.folder, preference, value);
        return tip;
    }
}
exports.checkCordovaAndroidPreference = checkCordovaAndroidPreference;
function AddCordovaAndroidPreference(folder, preference, value) {
    const configXMLFilename = `${folder}/config.xml`;
    if (!(0, fs_1.existsSync)(configXMLFilename))
        return;
    const txt = (0, fs_1.readFileSync)(configXMLFilename, 'utf8');
    let newtxt = txt;
    // Quick and dirty insertion of the preference or replace of value
    if (newtxt.includes(`<preference name="${preference}"`)) {
        newtxt = (0, utilities_1.setStringIn)(txt, `<preference name="${preference}" value="`, '"', `${value}`);
    }
    else {
        newtxt = txt.replace(`<platform name="android">`, `<platform name="android">\n        <preference name="${preference}" value="${value}" />`);
    }
    (0, fs_1.writeFileSync)(configXMLFilename, newtxt);
    vscode_1.window.showInformationMessage(`config.xml has been updated to include the ${preference} preference`, 'OK');
}
function getYarnVersion(packageManager) {
    if (packageManager) {
        return packageManager.replace('yarn@', '');
    }
    return packageManager;
}
function checkAndroidManifest() {
    (0, messages_1.error)('Not Implemented', 'Not implemented yet');
    const intent = getAndroidManifestIntent('android.intent.action.VIEW');
    console.error('WOW');
    console.log(intent);
    return true;
}
exports.checkAndroidManifest = checkAndroidManifest;
function checkCordovaAndroidPreferenceMinimum(preference, minVersion) {
    if (!cordovaConfig) {
        return;
    }
    const v = (0, semver_1.coerce)(cordovaConfig.androidPreferences[preference]);
    if (!v || (0, semver_1.lt)(v, minVersion)) {
        return (0, messages_1.error)('config.xml', `The android preference ${preference} should be at a minimum ${minVersion}. Add <preference name="${preference}" value="${minVersion}" /> to <platform name="android"> in config.xml`);
    }
}
exports.checkCordovaAndroidPreferenceMinimum = checkCordovaAndroidPreferenceMinimum;
function equals(value, expected) {
    if (value == expected) {
        return true;
    }
    if (expected instanceof Array && expected.includes(value)) {
        return true;
    }
    return false;
}
function checkCordovaIosPreference(preference, value, preferredValue) {
    if (!cordovaConfig) {
        return;
    }
    if (!equals(cordovaConfig.iosPreferences[preference], value)) {
        if (preferredValue) {
            return (0, messages_1.error)('config.xml', `The ios preference ${preference} cannot be ${cordovaConfig.iosPreferences[preference]}. Add <preference name="${preference}" value="${preferredValue}" /> to <platform name="ios"> in config.xml`);
        }
        else {
            return (0, messages_1.error)('config.xml', `The ios preference ${preference} should be ${value}. Add <preference name="${preference}" value="${value}" /> to <platform name="ios"> in config.xml`);
        }
    }
}
exports.checkCordovaIosPreference = checkCordovaIosPreference;
function getPackageVersion(library) {
    return (0, semver_1.coerce)(allDependencies[library]);
}
exports.getPackageVersion = getPackageVersion;
function isGreaterOrEqual(library, minVersion) {
    const v = (0, semver_1.coerce)(allDependencies[library]);
    return v && (0, semver_1.gte)(v, minVersion);
}
exports.isGreaterOrEqual = isGreaterOrEqual;
function isVersionGreaterOrEqual(version, minVersion) {
    const v = (0, semver_1.coerce)(version);
    return v && (0, semver_1.gte)(v, minVersion);
}
exports.isVersionGreaterOrEqual = isVersionGreaterOrEqual;
function startsWith(library, version) {
    const v = allDependencies[library];
    return v && v.startsWith(version);
}
exports.startsWith = startsWith;
function isLessOrEqual(library, minVersion) {
    const v = (0, semver_1.coerce)(allDependencies[library]);
    return v && (0, semver_1.lte)(v, minVersion);
}
exports.isLessOrEqual = isLessOrEqual;
function isLess(library, minVersion) {
    const v = (0, semver_1.coerce)(allDependencies[library]);
    return v && (0, semver_1.lt)(v, minVersion);
}
exports.isLess = isLess;
function checkConsistentVersions(lib1, lib2) {
    const v1 = (0, semver_1.coerce)(allDependencies[lib1]);
    const v2 = (0, semver_1.coerce)(allDependencies[lib2]);
    if (v1 && v2 && (0, semver_1.compare)(v1, v2)) {
        if (v1.major === v2.major) {
            return (0, messages_1.writeConsistentVersionWarning)(lib1, v1, lib2, v2);
        }
        else {
            return (0, messages_1.writeConsistentVersionError)(lib1, v1, lib2, v2);
        }
    }
}
exports.checkConsistentVersions = checkConsistentVersions;
function notRequiredPlugin(name, message) {
    if (exists(name)) {
        const msg = message ? '. ' + message : '';
        return new tip_1.Tip(name, `Not required with Capacitor${msg}`, tip_1.TipType.Comment, `The plugin ${name} is not required with Capacitor${msg}`, (0, node_commands_1.npmUninstall)(name), 'Uninstall', `${name} was uninstalled`).canIgnore();
    }
}
exports.notRequiredPlugin = notRequiredPlugin;
function replacementPlugin(name, replacement, url, tipType) {
    if (exists(name)) {
        const reason = replacement.startsWith('@capacitor/')
            ? ' as it has official support from the Capacitor team.'
            : ' as it offers equivalent functionality.';
        return new tip_1.Tip(name, `Replace with ${replacement}${url ? ' (' + url + ')' : ''}`, tipType ? tipType : tip_1.TipType.Idea, `Optional Recommendation: The plugin ${name} could be replaced with ${replacement}${reason} Replacing the plugin will require manual refactoring in your code.`, (0, node_commands_1.npmInstall)(replacement) + ' && ' + (0, node_commands_1.npmUninstall)(name), 'Replace Plugin', `${name} replaced with ${replacement}`, url).canIgnore();
    }
}
exports.replacementPlugin = replacementPlugin;
function incompatibleReplacementPlugin(name, replacement, url) {
    if (exists(name)) {
        return new tip_1.Tip(name, `Replace with ${replacement}${url ? ' (' + url + ')' : ''}`, tip_1.TipType.Comment, `The plugin ${name} is incompatible with Capacitor and must be replaced with ${replacement}${url ? ' (' + url + ')' : ''}`, (0, node_commands_1.npmInstall)(replacement) + ' && ' + (0, node_commands_1.npmUninstall)(name), 'Replace Plugin', `${name} replaced with ${replacement}`, url).canIgnore();
    }
}
exports.incompatibleReplacementPlugin = incompatibleReplacementPlugin;
function incompatiblePlugin(name, url) {
    if (exists(name)) {
        const isUrl = url === null || url === void 0 ? void 0 : url.startsWith('http');
        const msg = isUrl ? `See ${url}` : url ? url : '';
        const tip = new tip_1.Tip(name, `Incompatible with Capacitor. ${msg}`, tip_1.TipType.Error, `The plugin ${name} is incompatible with Capacitor. ${msg}`, tip_1.Command.NoOp, 'OK')
            .canIgnore()
            .setRelatedDependency(name);
        if (isUrl) {
            tip.url = url;
        }
        else {
            tip.command = tip_1.Command.NoOp;
            tip.url = `https://www.npmjs.com/package/${name}`;
        }
        return tip;
    }
}
exports.incompatiblePlugin = incompatiblePlugin;
function reviewPlugin(name) {
    if (exists(name)) {
        return new tip_1.Tip(name, `Test for Capacitor compatibility.`, tip_1.TipType.Warning, `The plugin ${name} requires testing for Capacitor compatibility.`);
    }
}
exports.reviewPlugin = reviewPlugin;
function warnIfNotUsing(name) {
    if (!allDependencies[name]) {
        return new tip_1.Tip(name, `package is not using ${name}`);
    }
}
exports.warnIfNotUsing = warnIfNotUsing;
/**
 * Returns a list of all packages used in the project
 * @returns Array
 */
function getAllPackageNames() {
    return Object.keys(allDependencies);
}
exports.getAllPackageNames = getAllPackageNames;
//# sourceMappingURL=analyzer.js.map