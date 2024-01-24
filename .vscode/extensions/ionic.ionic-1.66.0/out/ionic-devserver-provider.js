"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IonicDevServerProvider = void 0;
const vscode_1 = require("vscode");
const command_name_1 = require("./command-name");
const nexus_browser_1 = require("./nexus-browser");
class IonicDevServerProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this.registered = false;
    }
    resolveWebviewView(webviewView, context, token) {
        if (this.registered)
            return;
        this.registered = true;
        vscode_1.commands.registerCommand(command_name_1.CommandName.ViewDevServer, (url) => {
            const shortUrl = (0, nexus_browser_1.qrWebView)(webviewView.webview, url);
            //webviewView.description = shortUrl;
            webviewView.show(true);
        });
        vscode_1.commands.registerCommand(command_name_1.CommandName.hideDevServer, () => {
            // THERE IS NO API TO HIDE/COLLAPSE A VIEW
            const shortUrl = (0, nexus_browser_1.qrWebView)(webviewView.webview, undefined);
            //webviewView.show(true);
        });
    }
}
exports.IonicDevServerProvider = IonicDevServerProvider;
//# sourceMappingURL=ionic-devserver-provider.js.map