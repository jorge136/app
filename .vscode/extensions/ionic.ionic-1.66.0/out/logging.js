"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeWarning = exports.writeError = exports.writeIonic = exports.writeAppend = exports.write = exports.showOutput = exports.clearOutput = void 0;
const vscode_1 = require("vscode");
let channel = undefined;
function getOutputChannel() {
    if (!channel) {
        channel = vscode_1.window.createOutputChannel('Ionic');
        channel.show();
    }
    return channel;
}
function clearOutput() {
    const channel = getOutputChannel();
    channel.clear();
    channel.show();
    return channel;
}
exports.clearOutput = clearOutput;
function showOutput() {
    const channel = getOutputChannel();
    channel.show();
}
exports.showOutput = showOutput;
function write(message) {
    getOutputChannel().appendLine(message);
}
exports.write = write;
function writeAppend(message) {
    getOutputChannel().append(message);
}
exports.writeAppend = writeAppend;
function writeIonic(message) {
    const channel = getOutputChannel();
    channel.appendLine(`[Ionic] ${message}`);
}
exports.writeIonic = writeIonic;
function writeError(message) {
    const channel = getOutputChannel();
    channel.appendLine(`[error] ${message}`);
}
exports.writeError = writeError;
function writeWarning(message) {
    const channel = getOutputChannel();
    channel.appendLine(`[warning] ${message}`);
}
exports.writeWarning = writeWarning;
//# sourceMappingURL=logging.js.map