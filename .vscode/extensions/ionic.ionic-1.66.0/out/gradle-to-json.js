"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradleToJson = void 0;
const fs_1 = require("fs");
const utilities_1 = require("./utilities");
function gradleToJson(filename) {
    if (!(0, fs_1.existsSync)(filename)) {
        return undefined;
    }
    try {
        const lines = (0, fs_1.readFileSync)(filename, 'utf8').split('\n');
        const result = {};
        let at = result;
        const stack = [at];
        for (const line of lines) {
            if (line.trim().endsWith('{')) {
                const key = (0, utilities_1.replaceAll)(line, '{', '').trim();
                at[key] = {};
                stack.push(at);
                at = at[key];
            }
            else if (line.trim().endsWith('}')) {
                at = stack.pop();
            }
            else if (line.trim() !== '') {
                const kv = line.trim().split(' ');
                if (kv.length == 2) {
                    at[kv[0]] = kv[1];
                }
                else {
                    at[kv[0]] = [];
                    for (let i = 1; i < kv.length; i++) {
                        at[kv[0]].push(kv[i]);
                    }
                }
            }
        }
        return result;
    }
    catch {
        return undefined;
    }
}
exports.gradleToJson = gradleToJson;
//# sourceMappingURL=gradle-to-json.js.map