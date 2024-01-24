"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markActionAsCancelled = exports.waitForOtherActions = exports.markOperationAsRunning = exports.markActionAsRunning = exports.startCommand = exports.finishCommand = exports.cancelIfRunning = exports.cancelLastOperation = exports.isRunning = exports.getLastOperation = void 0;
const vscode_1 = require("vscode");
const command_name_1 = require("./command-name");
const context_variables_1 = require("./context-variables");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const logging_1 = require("./logging");
const utilities_1 = require("./utilities");
let runningOperations = [];
let runningActions = [];
let lastOperation;
function getLastOperation() {
    return lastOperation;
}
exports.getLastOperation = getLastOperation;
function isRunning(tip) {
    const found = runningOperations.find((found) => {
        return found.sameAs(tip);
    });
    if (found == undefined) {
        const foundAction = runningActions.find((found) => {
            return found.sameAs(tip);
        });
        return foundAction != undefined;
    }
    return found != undefined;
}
exports.isRunning = isRunning;
async function cancelLastOperation() {
    if (!lastOperation)
        return;
    if (!isRunning(lastOperation))
        return;
    await cancelRunning(lastOperation);
}
exports.cancelLastOperation = cancelLastOperation;
function cancelRunning(tip) {
    const found = runningOperations.find((found) => {
        return found.sameAs(tip);
    });
    if (found) {
        found.cancelRequested = true;
        console.log('Found task to cancel...');
        if (tip.description == 'Serve') {
            (0, utilities_1.stopPublishing)();
        }
    }
    return new Promise((resolve) => setTimeout(resolve, 1000));
}
// If the task is already running then cancel it
async function cancelIfRunning(tip) {
    if (isRunning(tip)) {
        await cancelRunning(tip);
        if (tip.data == context_variables_1.Context.stop) {
            (0, utilities_1.channelShow)();
            return true; // User clicked stop
        }
    }
    return false;
}
exports.cancelIfRunning = cancelIfRunning;
function finishCommand(tip) {
    runningOperations = runningOperations.filter((op) => {
        return !op.sameAs(tip);
    });
    runningActions = runningActions.filter((op) => {
        return !op.sameAs(tip);
    });
}
exports.finishCommand = finishCommand;
function startCommand(tip, cmd, clear) {
    if (tip.title) {
        const message = tip.commandTitle ? tip.commandTitle : tip.title;
        if (clear !== false) {
            (0, logging_1.clearOutput)();
        }
        (0, logging_1.writeIonic)(`${message}...`);
        let command = cmd;
        if (command === null || command === void 0 ? void 0 : command.includes(command_name_1.InternalCommand.cwd)) {
            command = command.replace(command_name_1.InternalCommand.cwd, '');
            if (ionic_tree_provider_1.ionicState.workspace) {
                (0, logging_1.write)(`> Workspace: ${ionic_tree_provider_1.ionicState.workspace}`);
            }
        }
        (0, logging_1.write)(`> ${(0, utilities_1.replaceAll)(command, command_name_1.InternalCommand.cwd, '')}`);
        (0, utilities_1.channelShow)();
    }
}
exports.startCommand = startCommand;
function markActionAsRunning(tip) {
    runningActions.push(tip);
}
exports.markActionAsRunning = markActionAsRunning;
function markOperationAsRunning(tip) {
    runningOperations.push(tip);
    lastOperation = tip;
}
exports.markOperationAsRunning = markOperationAsRunning;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function queueEmpty() {
    if (runningActions.length == 0)
        return true;
    if (runningActions.length == 1 && runningActions[0].isNonBlocking())
        return true;
    return false;
}
async function waitForOtherActions(tip) {
    let cancelled = false;
    if (queueEmpty())
        return false;
    if (tip.willNotWait())
        return false;
    await vscode_1.window.withProgress({
        location: vscode_1.ProgressLocation.Notification,
        title: `Task Queued: ${tip.title}`,
        cancellable: true,
    }, async (progress, token) => {
        while (!queueEmpty() && !cancelled) {
            await delay(500);
            if (token.isCancellationRequested) {
                cancelled = true;
            }
        }
    });
    return cancelled;
}
exports.waitForOtherActions = waitForOtherActions;
function markActionAsCancelled(tip) {
    runningActions = runningActions.filter((op) => {
        return !op.sameAs(tip);
    });
}
exports.markActionAsCancelled = markActionAsCancelled;
//# sourceMappingURL=tasks.js.map