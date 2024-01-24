"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugAndroid = exports.AndroidDebugType = void 0;
const vscode_1 = require("vscode");
const source_map_server_1 = require("./source-map-server");
const utilities_1 = require("./utilities");
// The debug provider type for VS Code
exports.AndroidDebugType = 'android-web';
function debugAndroid(packageName, wwwFolder) {
    // Source maps are required for debugging. These are loaded from where the app is
    // loaded (eg http://localhost) so we're running a source map server to deliver them
    // An alternative includes inlining the source maps.
    // Inlining source maps:
    // https://github.com/ionic-team/ionic-framework/issues/16455#issuecomment-505397373
    // Solution: https://ionic.zendesk.com/hc/en-us/articles/5177027959319
    // See this location for options for debugging that are supported
    // https://github.com/microsoft/vscode-js-debug/blob/main/OPTIONS.md#pwa-chrome-attach
    // Note: options here include sourceMapPathOverrides and resolveSourceMapLocations both dont fix the
    // problem with source maps not being accessible to the debugger
    vscode_1.debug.startDebugging(vscode_1.workspace.workspaceFolders[0], {
        type: exports.AndroidDebugType,
        name: 'Debug Android',
        request: 'attach',
        packageName: packageName,
        webRoot: '${workspaceFolder}',
        skipFiles: (0, utilities_1.debugSkipFiles)(),
    });
    (0, source_map_server_1.startSourceMapServer)(wwwFolder);
}
exports.debugAndroid = debugAndroid;
//# sourceMappingURL=android-debug.js.map