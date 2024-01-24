"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const command_name_1 = require("./command-name");
const utilities_1 = require("./utilities");
const ionic_init_1 = require("./ionic-init");
const context_variables_1 = require("./context-variables");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const project_1 = require("./project");
const tasks_1 = require("./tasks");
const vscode_1 = require("vscode");
const fs_1 = require("fs");
const path_1 = require("path");
let currentErrorFilename;
// On Save Document event (singleton)
let onSave;
async function handleError(error, logs, folder) {
    if (error && error.includes('ionic: command not found')) {
        await vscode_1.window.showErrorMessage('The Ionic CLI is not installed. Get started by running npm install -g @ionic/cli at the terminal.', 'More Information');
        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://ionicframework.com/docs/intro/cli#install-the-ionic-cli'));
        return;
    }
    if (error && error.includes(`If this is a project you'd like to integrate with Ionic, run ionic init.`)) {
        return await (0, ionic_init_1.ionicInit)(folder);
    }
    if (error && error.includes(`Since you're using the custom project type, you must provide the ionic:serve`)) {
        return await (0, ionic_init_1.ionicInit)(folder);
    }
    if (error && error.startsWith('/bin/sh: npx')) {
        const zsh = '/bin/zsh';
        ionic_tree_provider_1.ionicState.shell = zsh;
        ionic_tree_provider_1.ionicState.context.workspaceState.update(context_variables_1.Context.shell, zsh);
        const msg = 'It looks like node was not found with the default shell so it has been switched to ' +
            zsh +
            '. Please try the operation again.';
        await vscode_1.window.showErrorMessage(msg, 'OK');
        return;
    }
    let errorMessage = error;
    if (!errorMessage || error.length == 0) {
        if (logs.length > 0) {
            const txt = logs.find((log) => log.startsWith('[error]'));
            errorMessage = txt ? txt.replace('[error]', '') : undefined;
        }
    }
    const errors = extractErrors(error, logs, folder);
    const retryOp = false; // Turning this off for now. It isn't working consistently
    if (errorMessage && errorMessage.includes(`The project's package.json file seems malformed`)) {
        errorMessage = `The Ionic CLI thinks your project is malformed. This can happen if your ionic.config.json is misconfigured. Try deleting ionic.config.json and let the extension recreate it.`;
    }
    if (errors.length == 0 && errorMessage) {
        vscode_1.window.showErrorMessage(errorMessage, 'Ok');
    }
    else {
        handleErrorLine(0, errors, folder);
        // When the user fixes the error and saves the file then re-run
        if (retryOp) {
            if (onSave) {
                onSave.dispose();
            }
            onSave = vscode_1.workspace.onDidSaveTextDocument((document) => {
                if (document.fileName == currentErrorFilename) {
                    onSave.dispose();
                    const lastOp = (0, tasks_1.getLastOperation)();
                    const title = lastOp.title;
                    const r = new project_1.Project('').asRecommendation(lastOp);
                    vscode_1.commands.executeCommand(command_name_1.CommandName.Run, r);
                    (0, utilities_1.showMessage)(`Lets try to ${title} again...`, 3000);
                }
            });
        }
    }
}
exports.handleError = handleError;
function extractErrors(errorText, logs, folder) {
    const errors = [];
    if (logs.length > 0) {
        // Look for code lines
        let line = undefined; // Lint style errors
        let rcline = undefined; // React style Typescript errors
        let vueline = undefined; // Vue style errors
        let tsline = undefined; // Vue style typescript error
        let javaLine = undefined; // Java style errors
        let jasmineLine = undefined; // Jasmine test errors
        for (let log of logs) {
            if (log.startsWith('[capacitor]')) {
                log = log.replace('[capacitor]', '').trim();
            }
            // Lint style errors, ESLint style errors
            if (log.endsWith('.ts') || log.endsWith('.tsx')) {
                line = log;
            }
            else {
                if (line) {
                    const error = extractErrorLineFrom(log, line);
                    if (error) {
                        errors.push(error);
                    }
                    else {
                        line = undefined;
                    }
                }
            }
            // React style errors
            if (log.startsWith('TypeScript error in ')) {
                rcline = log;
            }
            else {
                if (rcline) {
                    errors.push(extractTypescriptErrorFrom(rcline, log.trim()));
                    rcline = undefined;
                }
            }
            // Vue style typescript error
            if (log.includes('error  in ')) {
                tsline = log;
            }
            else {
                if (tsline) {
                    if (log.trim().length > 0) {
                        errors.push(extractVueTypescriptErrorFrom(tsline, log.trim()));
                        tsline = undefined;
                    }
                }
            }
            // React syntax error
            // SyntaxError: /Users/damian/Code/demo-intune-react/src/pages/Login.tsx: 'await' is only allowed within async functions and at the top levels of modules. (29:19)
            if (log.startsWith('SyntaxError:')) {
                errors.push(extractSyntaxError(log));
            }
            // Java errors
            if (log.includes('error:') && log.includes(folder)) {
                javaLine = log;
            }
            else {
                if (javaLine) {
                    errors.push(extractJavaError(javaLine, log));
                    javaLine = undefined;
                }
            }
            // Jasmine errors
            if (log.includes('Error:') && !log.includes(folder)) {
                jasmineLine = log;
            }
            else {
                if (jasmineLine) {
                    if (!log.includes('<Jasmine>')) {
                        // First stack line: eg at UserContext.<anonymous> (src/app/app.component.spec.ts:20:17)
                        errors.push(extractJasmineError(jasmineLine, log));
                        jasmineLine = undefined;
                    }
                }
            }
            if (log.endsWith('.vue')) {
                vueline = log;
            }
            else {
                if (vueline) {
                    errors.push(extractVueErrorFrom(vueline, log.trim()));
                    vueline = undefined;
                }
            }
        }
    }
    if (errors.length == 0 && errorText) {
        const lines = errorText.split('\n');
        let fail;
        for (const line of lines) {
            if (line.startsWith('Error: ')) {
                errors.push(extractErrorFrom(line));
            }
            else if (line.includes('- error TS')) {
                errors.push(extractTSErrorFrom(line));
            }
            else if (line.startsWith('FAIL')) {
                fail = line;
            }
            else {
                if (fail) {
                    errors.push(extractJestErrorFrom(fail, line));
                    fail = undefined;
                }
            }
        }
    }
    return errors;
}
// Parse an error like:
// libs/core/src/services/downloadPdf.service.ts:4:32 - error TS2307: Cannot find module '@ionic-native/document-viewer/ngx' or its corresponding type declarations.
function extractTSErrorFrom(line) {
    try {
        const codeline = line.replace('ERROR in ', '').split(':')[0];
        const args = line.split(':');
        const position = parseInt(args[2]) - 1;
        const linenumber = parseInt(args[1].trim()) - 1;
        const errormsg = line.substring(line.indexOf('- ', codeline.length) + 2);
        return {
            line: linenumber,
            position: position,
            uri: codeline,
            error: errormsg + `line:${linenumber} pos:${position}`,
        };
    }
    catch {
        // Couldnt parse the line. Continue
    }
}
// Parse an error like this one for the line, position and error message
// Error: src/app/app.module.ts:18:3 - error TS2391: Function implementation is missing or not immediately following the declaration.
function extractErrorFrom(line) {
    try {
        const codeline = line.replace('Error: ', '').split(':')[0];
        const args = line.split(':');
        const linenumber = parseInt(args[2]) - 1;
        const position = parseInt(args[3].substring(0, args[3].indexOf(' ')) + 2) - 1;
        const errormsg = line.substring(line.indexOf('- ', codeline.length + 7) + 2);
        return { line: linenumber, position: position, uri: codeline, error: errormsg };
    }
    catch {
        // Couldnt parse the line. Continue
    }
}
function extractJestErrorFrom(line, testError) {
    try {
        const filename = line.replace('FAIL ', '').trim();
        testError = testError.replace('  ● ', '');
        return { line: 0, position: 0, uri: filename, error: testError };
    }
    catch {
        // Couldnt parse the line. Continue
    }
}
// Parse an error like:
// "  13:1  error blar"
function extractErrorLineFrom(msg, filename) {
    const pos = parsePosition(msg);
    const errormsg = extractErrorMessage(msg);
    if (!errormsg || errormsg.length == 0 || !msg.includes('error')) {
        return;
    }
    return { error: errormsg, uri: filename, line: pos.line, position: pos.character };
}
// Parse an error like this one for the line, position and error message
// /Users/damian/Code/blank12/android/app/src/main/java/io/ionic/starter/MainActivity.java:5: error: cannot find symbol
// public class MainActivity extends BridgeActivity2 {}
function extractJavaError(line1, line2) {
    try {
        const args = line1.split(' error: ');
        const filename = args[0].split(':')[0].trim();
        const linenumber = parseInt(args[0].split(':')[1]) - 1;
        return { uri: filename, line: linenumber, position: 0, error: args[1].trim() + ' ' + line2.trim() };
    }
    catch {
        return;
    }
}
// Parse an error like this one for the line, position and error message
// Error: Expected AppComponent({ __ngContext__: [ null, TView({ type: 0, bluepr ... to be falsy.
// 	    at UserContext.<anonymous> (src/app/app.component.spec.ts:20:17)
function extractJasmineError(line1, line2) {
    try {
        let txt = line1.replace('Error: ', '');
        if (txt.length > 100) {
            txt = txt.substring(0, 80) + '...' + txt.substring(txt.length - 16, txt.length);
        }
        const place = line2.substring(line2.indexOf('(') + 1);
        const args = place.split(':');
        const filename = args[0];
        const linenumber = parseInt(args[1]) - 1;
        const position = parseInt(args[2].replace(')', '')) - 1;
        return { uri: filename, line: linenumber, position: position, error: txt };
    }
    catch {
        return;
    }
}
async function handleErrorLine(number, errors, folder) {
    if (!errors[number])
        return;
    const nextButton = number + 1 == errors.length ? undefined : 'Next';
    const prevButton = number == 0 ? undefined : 'Previous';
    const title = errors.length > 1 ? `Error ${number + 1} of ${errors.length}: ` : '';
    vscode_1.window.showErrorMessage(`${title}${errors[number].error}`, prevButton, nextButton, 'Ok').then((result) => {
        if (result == 'Next') {
            handleErrorLine(number + 1, errors, folder);
            return;
        }
        if (result == 'Previous') {
            handleErrorLine(number - 1, errors, folder);
            return;
        }
    });
    let uri = errors[number].uri;
    if (!(0, fs_1.existsSync)(uri)) {
        // Might be a relative path
        if ((0, fs_1.existsSync)((0, path_1.join)(folder, uri))) {
            uri = (0, path_1.join)(folder, uri);
        }
    }
    currentErrorFilename = uri;
    if ((0, fs_1.existsSync)(uri) && !(0, fs_1.lstatSync)(uri).isDirectory()) {
        await (0, utilities_1.openUri)(uri);
        const myPos = new vscode_1.Position(errors[number].line, errors[number].position);
        vscode_1.window.activeTextEditor.selection = new vscode_1.Selection(myPos, myPos);
        vscode_1.commands.executeCommand('revealLine', { lineNumber: myPos.line, at: 'bottom' });
    }
    else {
        console.warn(`${uri} not found`);
    }
}
// Extract error message from a line error line:
// eg "  13:1  error blar"
// return "blar"
function extractErrorMessage(msg) {
    try {
        const pos = parsePosition(msg);
        if (pos.line > 0 || pos.character > 0) {
            msg = msg.trim();
            msg = msg.substring(msg.indexOf('  ')).trim();
            if (msg.startsWith('error')) {
                msg = msg.replace('error', '');
                return msg.trim();
            }
            else if (msg.startsWith('warning')) {
                msg = msg.replace('warning', '');
                return msg.trim();
            }
        }
    }
    catch {
        return msg;
    }
    return msg;
}
// Given "  13:1  error blar" return positon 12, 0
function parsePosition(msg) {
    msg = msg.trim();
    if (msg.indexOf('  ') > -1) {
        const pos = msg.substring(0, msg.indexOf('  '));
        if (pos.indexOf(':') > -1) {
            try {
                const args = pos.split(':');
                return new vscode_1.Position(parseInt(args[0]) - 1, parseInt(args[1]) - 1);
            }
            catch {
                return new vscode_1.Position(0, 0);
            }
        }
    }
    return new vscode_1.Position(0, 0);
}
// Extract code filename, line number, position
// TypeScript error in /Users/damian/Code/demo-intune-react/src/components/ExploreContainer.tsx(5,7):
function extractTypescriptErrorFrom(msg, errorText) {
    try {
        msg = msg.replace('TypeScript error in ', '');
        const filename = msg.substring(0, msg.lastIndexOf('('));
        const args = msg.substring(msg.lastIndexOf('(') + 1).split(',');
        const linenumber = parseInt(args[0]);
        const position = parseInt(args[1].replace('):', ''));
        return { line: linenumber, position: position, error: errorText, uri: filename };
    }
    catch {
        return;
    }
}
// Extract code filename, line number, position
//  error  in src/router/index.ts:35:12
// TS2552: Cannot find name 'createWebHistory2'. Did you mean 'createWebHistory'?
function extractVueTypescriptErrorFrom(msg, errorText) {
    try {
        msg = msg.replace(' error  in ', '');
        const filename = msg.substring(0, msg.indexOf(':'));
        const args = msg.substring(msg.indexOf(':') + 1).split(':');
        const linenumber = parseInt(args[0]);
        const position = parseInt(args[1]);
        return { line: linenumber, position: position, error: errorText, uri: filename };
    }
    catch {
        return;
    }
}
// Extract code filename, line number, position
// /Users/damian/Code/blank-vue2/src/components/ExploreContainer.vue
//  15:12  error  The "bnlar" property should be a constructor  vue/require-prop-type-constructor
function extractVueErrorFrom(filename, msg) {
    return extractErrorLineFrom(msg, filename);
}
// Extract code filename, line number, position
// SyntaxError: /Users/damian/Code/demo-intune-react/src/pages/Login.tsx: 'await' is only allowed within async functions and at the top levels of modules. (29:19)
function extractSyntaxError(msg) {
    try {
        msg = msg.replace('SyntaxError: ', '');
        const filename = msg.substring(0, msg.indexOf(':'));
        const args = msg.substring(msg.lastIndexOf('(') + 1).split(':');
        const linenumber = parseInt(args[0]);
        const position = parseInt(args[1].replace(')', ''));
        let errorText = msg.substring(msg.indexOf(':') + 1);
        errorText = errorText.substring(0, errorText.lastIndexOf('(')).trim();
        return { line: linenumber, position: position, error: errorText, uri: filename };
    }
    catch {
        return;
    }
}
//# sourceMappingURL=error-handler.js.map