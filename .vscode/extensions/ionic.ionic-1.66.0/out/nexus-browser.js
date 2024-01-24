"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.troubleshootPlugins = exports.qrWebView = exports.qrView = void 0;
const vscode_1 = require("vscode");
const context_variables_1 = require("./context-variables");
const command_name_1 = require("./command-name");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const path_1 = require("path");
const editor_preview_1 = require("./editor-preview");
const utilities_1 = require("./utilities");
const logging_1 = require("./logging");
const project_1 = require("./project");
const workspace_state_1 = require("./workspace-state");
const semver_1 = require("semver");
function qrView(externalUrl) {
    vscode_1.commands.executeCommand(context_variables_1.VSCommand.setContext, context_variables_1.Context.isDevServing, true);
    vscode_1.commands.executeCommand(command_name_1.CommandName.ViewDevServer, externalUrl);
}
exports.qrView = qrView;
function qrWebView(webview, externalUrl) {
    const onDiskPath = vscode_1.Uri.file((0, path_1.join)(ionic_tree_provider_1.ionicState.context.extensionPath, 'resources', 'qrious.min.js'));
    webview.options = { enableScripts: true };
    const qrSrc = webview.asWebviewUri(onDiskPath);
    if ((0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.pluginDrift) !== 'shown') {
        troubleshootPlugins();
    }
    if (!externalUrl) {
        webview.html = '';
        return undefined;
    }
    const shortUrl = externalUrl === null || externalUrl === void 0 ? void 0 : externalUrl.replace('https://', '').replace('http://', '');
    webview.html = getWebviewQR(shortUrl, externalUrl, qrSrc);
    webview.onDidReceiveMessage(async (message) => {
        switch (message) {
            case 'troubleshoot':
                troubleshootPlugins();
                break;
            case 'editor':
                (0, editor_preview_1.viewInEditor)(externalUrl, false);
                break;
            case 'debug':
                (0, editor_preview_1.debugBrowser)(externalUrl, false);
                break;
            case 'browser':
                (0, utilities_1.openUri)(externalUrl);
                break;
            case 'stop':
                //stop(panel);
                break;
            default:
                vscode_1.window.showInformationMessage(message);
        }
    });
    return shortUrl;
}
exports.qrWebView = qrWebView;
async function troubleshootPlugins() {
    try {
        // Download https://nexusbrowser.com/assets/app-data.json which is the list of plugins included in nexus browser app
        const data = (await (0, utilities_1.httpRequest)('GET', 'nexusbrowser.com', '/assets/app-data.json'));
        const versions = {};
        // These plugins wont matter if they are not in the Nexus Browser
        const unimportant = ['cordova-plugin-ionic'];
        for (const plugin of data.plugins) {
            versions[plugin.name] = plugin.version;
        }
        let problems = 0;
        let problem = '';
        const pluginList = [];
        const summary = await (0, project_1.inspectProject)(ionic_tree_provider_1.ionicState.rootFolder, ionic_tree_provider_1.ionicState.context, undefined);
        for (const libType of ['Capacitor Plugin', 'Plugin']) {
            for (const library of Object.keys(summary.packages).sort()) {
                const pkg = summary.packages[library];
                if (pkg.depType == libType) {
                    if (versions[library]) {
                        if (versions[library] != pkg.version) {
                            const projectv = (0, semver_1.coerce)(pkg.version);
                            const browserv = (0, semver_1.coerce)(versions[library]);
                            if (projectv.major != browserv.major) {
                                (0, logging_1.writeWarning)(`Your project has v${pkg.version} of ${library} but Nexus Browser has v${versions[library]}`);
                            }
                            else {
                                (0, logging_1.write)(`[info] Your project has v${pkg.version} of ${library} but Nexus Browser has v${versions[library]}`);
                            }
                        }
                    }
                    else if (!unimportant.includes(library)) {
                        pluginList.push(library);
                        problem = library;
                        problems++;
                    }
                }
            }
        }
        if (problems == 1) {
            vscode_1.window.showWarningMessage(`Your project uses the plugin ${problem} which is not in the Nexus Browser app, so you may have issues related to its functionality.`, 'Dismiss');
        }
        else if (problems > 0) {
            (0, logging_1.writeWarning)(`Your project has these plugins: ${pluginList.join(', ')} but Nexus Browser does not. You can suggest adding these here: https://github.com/ionic-team/vscode-extension/issues/91`);
            vscode_1.window.showWarningMessage(`Your project has ${problems} plugins that are not in the Nexus Browser app, so you may have issues related to functionality that relies on those plugins.`, 'Dismiss');
        }
    }
    catch (err) {
        (0, logging_1.writeError)(err);
    }
    finally {
        (0, workspace_state_1.setSetting)(workspace_state_1.WorkspaceSetting.pluginDrift, 'shown');
    }
}
exports.troubleshootPlugins = troubleshootPlugins;
function getWebviewQR(shortUrl, externalUrl, qrSrc) {
    externalUrl = `https://nexusbrowser.com/` + encodeURIComponent(shortUrl);
    return `
	<!DOCTYPE html>
	<html>
	<script src="${qrSrc}"></script>
	<script>
	  const vscode = acquireVsCodeApi();
	  function action(msg) {
		  vscode.postMessage(msg);
		}
	</script>
	<style>
	.container {
	  padding-top: 20px;
	  width: 100%;    
	  display: flex;
	  flex-direction: column;
	}
	p { 
	  text-align: center;
	  line-height: 1.5;
	}
	i { 
	  opacity: 0.5; 
	  font-style: normal; }
	.row {
	  //min-width: 280px;
	  width: 100%;//280px;
	  margin-right: 20px;
	  text-align: center; 
	}
	a {
	  cursor: pointer;
	}
	</style>
	<body>
	  <div class="container">
		 <div class="row">          
			<canvas id="qr"></canvas>          
			<p>Use <a href="https://capacitor.nexusbrowser.com">Nexus Browser</a> to test your app which is running at <i>${shortUrl}</i> <a onclick="action('troubleshoot')"><sup>•</sup></a></p>
		 </div>
	  </div>    
	  <script>
	  const qr = new QRious({
		background: 'transparent',
		foreground: '#888',
		element: document.getElementById('qr'),
		size: 150,
		value: '${externalUrl}'
	  });
	  </script>
	</body>
	</html>
	`;
}
//# sourceMappingURL=nexus-browser.js.map