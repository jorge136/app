"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeIgnoredTips = exports.clearIgnored = exports.getIgnored = exports.ignore = void 0;
/**
 * Allows recommendations to be ignored. We need to store the recommendation text from the tip
 * @param  {Tip} tip
 * @param  {vscode.ExtensionContext} context
 */
function ignore(tip, context) {
    const key = 'ignoredRecommendations';
    const txt = `${tip.message}+${tip.title}`;
    const listJSON = context.workspaceState.get(key);
    let list = [];
    if (listJSON) {
        list = JSON.parse(listJSON);
    }
    if (!list.includes(txt)) {
        list.push(txt);
    }
    context.workspaceState.update(key, JSON.stringify(list));
}
exports.ignore = ignore;
function getIgnored(context) {
    const key = 'ignoredRecommendations';
    const listJSON = context.workspaceState.get(key);
    let list = [];
    try {
        list = JSON.parse(listJSON);
        return list;
    }
    catch {
        return [];
    }
}
exports.getIgnored = getIgnored;
function clearIgnored(context) {
    const key = 'ignoredRecommendations';
    context.workspaceState.update(key, undefined);
}
exports.clearIgnored = clearIgnored;
function excludeIgnoredTips(tips, context) {
    const key = 'ignoredRecommendations';
    const listJSON = context.workspaceState.get(key);
    let list = [];
    if (listJSON) {
        try {
            list = JSON.parse(listJSON);
            return tips.filter((tip) => {
                return tip && !list.includes(`${tip.message}+${tip.title}`);
            });
        }
        catch {
            context.workspaceState.update(key, '[]');
            return tips;
        }
    }
    else {
        return tips;
    }
}
exports.excludeIgnoredTips = excludeIgnoredTips;
//# sourceMappingURL=ignore.js.map