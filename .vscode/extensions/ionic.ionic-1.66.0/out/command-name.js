"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionResult = exports.InternalCommand = exports.CommandName = void 0;
// vsCode Ionic Command Names match to the strings in package.json
var CommandName;
(function (CommandName) {
    CommandName["Run"] = "ionic-official.runapp";
    CommandName["Fix"] = "ionic-official.fix";
    CommandName["Link"] = "ionic-official.link";
    CommandName["Idea"] = "ionic-official.lightbulb";
    CommandName["Refresh"] = "ionic-official.refresh";
    CommandName["Add"] = "ionic-official.add";
    CommandName["SignUp"] = "ionic-official.signUp";
    CommandName["Login"] = "ionic-official.login";
    CommandName["Stop"] = "ionic-official.stop";
    CommandName["Rebuild"] = "ionic-official.rebuild";
    CommandName["RefreshDebug"] = "ionic-official.refreshDebug";
    CommandName["Function"] = "ionic-official.function";
    CommandName["Open"] = "ionic-official.open";
    CommandName["SkipLogin"] = "ionic-official.skipLogin";
    CommandName["Upgrade"] = "ionic-official.upgrade";
    CommandName["ProjectsRefresh"] = "ionic-official.projectRefresh";
    CommandName["ProjectSelect"] = "ionic-official.projectSelect";
    CommandName["BuildConfig"] = "ionic-official.buildConfig";
    CommandName["WebConfig"] = "ionic-official.webConfig";
    CommandName["WebDebugConfig"] = "ionic-official.webDebugConfig";
    CommandName["SelectAction"] = "ionic-official.selectAction";
    CommandName["DebugMode"] = "ionic-official.debugMode";
    CommandName["PluginExplorer"] = "ionic-official.pluginExplorer";
    CommandName["NewProject"] = "ionic-official.newProject";
    CommandName["RunMode"] = "ionic-official.runMode";
    CommandName["SelectDevice"] = "ionic-official.selectDevice";
    CommandName["RunIOS"] = "ionic-official.run";
    CommandName["Debug"] = "ionic-official.debug";
    CommandName["Build"] = "ionic-official.build";
    CommandName["ViewDevServer"] = "ionic-official.viewDevServer";
    CommandName["hideDevServer"] = "ionic-official.hideDevServer";
})(CommandName = exports.CommandName || (exports.CommandName = {}));
var InternalCommand;
(function (InternalCommand) {
    InternalCommand["cwd"] = "[@cwd]";
    InternalCommand["target"] = "[@target]";
    InternalCommand["removeCordova"] = "rem-cordova";
    InternalCommand["ionicInit"] = "[@ionic-init]";
    InternalCommand["publicHost"] = "[@public-host]";
})(InternalCommand = exports.InternalCommand || (exports.InternalCommand = {}));
var ActionResult;
(function (ActionResult) {
    ActionResult["None"] = "";
    ActionResult["Ignore"] = "ignore";
})(ActionResult = exports.ActionResult || (exports.ActionResult = {}));
//# sourceMappingURL=command-name.js.map