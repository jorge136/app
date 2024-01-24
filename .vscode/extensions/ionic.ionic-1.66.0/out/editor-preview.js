"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugBrowser = exports.getDebugBrowserName = exports.viewInEditor = void 0;
const vscode_1 = require("vscode");
const tasks_1 = require("./tasks");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const utilities_1 = require("./utilities");
const workspace_state_1 = require("./workspace-state");
const devices = [
    { name: 'iPhone SE', width: 375, height: 667, type: 'ios' },
    { name: 'iPhone XR', width: 414, height: 896, type: 'ios' },
    { name: 'iPhone 12 Pro', width: 390, height: 844, type: 'ios' },
    { name: 'iPad Air', width: 820, height: 1180, type: 'ios' },
    { name: 'iPad Mini', width: 768, height: 1024, type: 'ios' },
    { name: 'Pixel 3', width: 393, height: 786, type: 'android' },
    { name: 'Pixel 5', width: 393, height: 851, type: 'android' },
    { name: 'Samsung Galaxy S8+', width: 360, height: 740, type: 'android' },
    { name: 'Samsung Galaxy S20 Ultra', width: 412, height: 915, type: 'android' },
    { name: 'Samsung Galaxy Tab S4', width: 712, height: 1138, type: 'android' },
];
function viewInEditor(url, active) {
    const panel = vscode_1.window.createWebviewPanel('viewApp', 'Preview', active ? vscode_1.ViewColumn.Active : vscode_1.ViewColumn.Beside, {
        enableScripts: true,
    });
    panel.webview.html = getWebviewContent(url);
    panel.webview.onDidReceiveMessage(async (message) => {
        const device = await selectMockDevice();
        panel.title = device.name;
        panel.webview.postMessage(device);
    });
}
exports.viewInEditor = viewInEditor;
function getDebugBrowserName() {
    const browser = getDebugBrowserSetting();
    if (browser == 'pwa-msedge')
        return 'Microsoft Edge';
    if (browser == 'chrome')
        return 'Google Chrome';
    return browser;
}
exports.getDebugBrowserName = getDebugBrowserName;
function getDebugBrowserSetting() {
    let browserType = (0, workspace_state_1.getSetting)(workspace_state_1.WorkspaceSetting.debugBrowser);
    if (!browserType) {
        browserType = 'chrome';
    }
    return browserType;
}
async function debugBrowser(url, stopWebServerAfter) {
    try {
        const launchConfig = {
            type: getDebugBrowserSetting(),
            name: 'Debug Web',
            request: 'launch',
            url: url,
            webRoot: '${workspaceFolder}',
            skipFiles: (0, utilities_1.debugSkipFiles)(),
        };
        vscode_1.debug.onDidTerminateDebugSession(async (e) => {
            if (stopWebServerAfter) {
                // This stops the dev server
                await (0, tasks_1.cancelLastOperation)();
                // Switch back to Ionic View
                ionic_tree_provider_1.ionicState.view.reveal(undefined, { focus: true });
            }
        });
        await vscode_1.debug.startDebugging(undefined, launchConfig);
    }
    catch {
        //
    }
}
exports.debugBrowser = debugBrowser;
async function selectMockDevice() {
    const selected = await vscode_1.window.showQuickPick(devices.map((device) => `${device.name} (${device.width} x ${device.height})`), { placeHolder: 'Select Emulated Device' });
    if (!selected)
        return;
    return devices.find((device) => selected.startsWith(device.name));
}
function getWebviewContent(url) {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Preview App</title>
	</head>
	<script>
	const vscode = acquireVsCodeApi();
	const baseUrl = '${url}';

	window.addEventListener('message', event => {
		const device = event.data;		
		let newurl = baseUrl;
		if (device.type == 'ios') { newurl += '?ionic:mode=ios'; }
		document.getElementById('frame').src = newurl;
		document.getElementById('devFrame').style.width = device.width + 'px';
		document.getElementById('devFrame').style.height = (device.height + 50) + 'px';
		document.getElementById('frameContainer').style.height = device.height + 'px';
		console.log(device);
	});
	
	function change() {
	    vscode.postMessage({url: document.getElementById('frame').src});
	}
	</script>
	<body style="display: flex; align-items: center; justify-content: center; margin-top:20px;">
		<div id="devFrame" style="width: 375px; height: 717px; border: 2px solid #333; border-radius:10px; padding:10px; display: flex; align-items: center; flex-direction: column;">		   
		   <div id="frameContainer" style="width: 100%; height: 667px;">
		        <div onclick="change()"  style="border: 2px solid #333; width:5px; height: 70px; cursor: pointer; margin-top:20px; margin-left:-19px; position: absolute"></div>
				<iframe id="frame" src="${url}" width="100%" height="100%" frameBorder="0"></iframe>
		   </div>
		  <div style="width: 100%; height: 50px; display: flex; align-items: center; justify-content: space-between;">
      <div style="cursor: pointer; height: 25px; width:25px; padding:5px" onclick="history.back()"><svg viewBox="0 0 512 512"><path fill="none" stroke="#333" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg></div>
			<div style="background-color: #333; cursor: pointer; height: 25px; width:25px; border-radius:30px; padding:5px" onclick="document.getElementById('frame').src = '${url}'"></div>
      <div style="cursor: pointer; height: 25px; width:25px; padding:5px" onclick="change()"><svg fill="#333" viewBox="0 0 512 512"><circle cx="256" cy="256" r="48"/><circle cx="416" cy="256" r="48"/><circle cx="96" cy="256" r="48"/></svg></div>
      
		  </div>  
		 </div>
	</body>
	</html>`;
}
//# sourceMappingURL=editor-preview.js.map