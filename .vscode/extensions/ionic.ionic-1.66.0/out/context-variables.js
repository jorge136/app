"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageCacheModified = exports.CapProjectCache = exports.PackageCacheList = exports.PackageCacheOutdated = exports.VSCommand = exports.Context = void 0;
var Context;
(function (Context) {
    // Whether the project has been inspected (true) or not (false)
    Context["inspectedProject"] = "inspectedProject";
    // Whether the user has clicked Login (true)
    Context["isLoggingIn"] = "isLoggingIn";
    // Whether the current user is not known (true)
    Context["isAnonymous"] = "isAnonymous";
    // VS Code hasnt opened a folder
    Context["noProjectFound"] = "noProjectFound";
    // Used for splash screen assets that can be viewed
    Context["asset"] = "asset";
    // The panel for monorepo projects
    Context["isMonoRepo"] = "isMonoRepo";
    // The panel for the running dev server
    Context["isDevServing"] = "isDevServing";
    // A scope that can be upgraded
    Context["upgrade"] = "upgrade";
    // Upgrade options
    Context["lightbulb"] = "lightbulb";
    // Stop option
    Context["stop"] = "stop";
    // Build configuration
    Context["buildConfig"] = "buildConfig";
    // Web configuration
    Context["webConfig"] = "webConfig";
    // Web Debug configuration
    Context["webDebugConfig"] = "webDebugConfig";
    // Select Action
    Context["selectAction"] = "selectAction";
    // Device selection
    Context["selectDevice"] = "selectDevice";
    // Shell (eg /bin/zsh)
    Context["shell"] = "shell";
    // Rebuild used for splash screen
    Context["rebuild"] = "rebuild";
    // Refresh used for debug instances
    Context["refreshDebug"] = "refreshDebug";
})(Context = exports.Context || (exports.Context = {}));
// Commands from vs code
var VSCommand;
(function (VSCommand) {
    VSCommand["setContext"] = "setContext";
})(VSCommand = exports.VSCommand || (exports.VSCommand = {}));
function PackageCacheOutdated(project) {
    var _a;
    if ((_a = project === null || project === void 0 ? void 0 : project.monoRepo) === null || _a === void 0 ? void 0 : _a.localPackageJson) {
        return 'npmOutdatedData_' + project.monoRepo.name;
    }
    return 'npmOutdatedData';
}
exports.PackageCacheOutdated = PackageCacheOutdated;
function PackageCacheList(project) {
    var _a;
    if ((_a = project === null || project === void 0 ? void 0 : project.monoRepo) === null || _a === void 0 ? void 0 : _a.localPackageJson) {
        return 'npmListData_' + project.monoRepo.name;
    }
    return 'npmListData';
}
exports.PackageCacheList = PackageCacheList;
function CapProjectCache(project) {
    var _a;
    if ((_a = project === null || project === void 0 ? void 0 : project.monoRepo) === null || _a === void 0 ? void 0 : _a.localPackageJson) {
        return 'CapacitorProject_' + project.monoRepo.name;
    }
    return 'CapacitorProject';
}
exports.CapProjectCache = CapProjectCache;
function PackageCacheModified(project) {
    var _a;
    if ((_a = project === null || project === void 0 ? void 0 : project.monoRepo) === null || _a === void 0 ? void 0 : _a.localPackageJson) {
        return 'packagesModified_' + project.monoRepo.name;
    }
    return 'packagesModified';
}
exports.PackageCacheModified = PackageCacheModified;
//# sourceMappingURL=context-variables.js.map