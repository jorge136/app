"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.angularGenerate = void 0;
const utilities_1 = require("./utilities");
const logging_1 = require("./logging");
const path_1 = require("path");
const fs_1 = require("fs");
const analyzer_1 = require("./analyzer");
const vscode_1 = require("vscode");
async function angularGenerate(queueFunction, project, angularType) {
    let name = await vscode_1.window.showInputBox({
        title: `New Angular ${angularType}`,
        placeHolder: `Enter name for new ${angularType}`,
    });
    if (!name || name.length < 1)
        return;
    queueFunction();
    // CREATE src/app/test2/test2.component.ts
    try {
        let args = '';
        if ((0, analyzer_1.isGreaterOrEqual)('@ionic/angular-toolkit', '8.1.0') && (0, analyzer_1.isGreaterOrEqual)('@angular/core', '15.0.0')) {
            if (angularType == 'page') {
                args += ' --standalone';
            }
        }
        name = (0, utilities_1.replaceAll)(name, ' ', '-').trim();
        (0, logging_1.writeIonic)(`Creating Angular ${angularType} named ${name}..`);
        const out = await (0, utilities_1.getRunOutput)(`npx ionic generate ${angularType} ${name}${args}`, project.projectFolder());
        (0, logging_1.write)(out);
        const src = (0, utilities_1.getStringFrom)(out, 'CREATE ', '.ts');
        const path = (0, path_1.join)(project.projectFolder(), src + '.ts');
        if (!src || !(0, fs_1.existsSync)(path)) {
            (0, logging_1.writeError)(`Failed to create Angular ${angularType} named ${name}`);
        }
        else {
            (0, logging_1.writeIonic)(`Created Angular ${angularType} named ${name}`);
            await (0, utilities_1.openUri)(path);
        }
    }
    catch (err) {
        (0, logging_1.writeError)(`Unable to generate Angular ${angularType} named ${name}: ${err}`);
    }
}
exports.angularGenerate = angularGenerate;
//# sourceMappingURL=angular-generate.js.map