"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.starterProject = void 0;
const project_1 = require("./project");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
/**
 * Creates ionic start commands
 * @param  {string} folder
 * @returns Promise
 */
async function starterProject(folder) {
    const project = new project_1.Project('New Project');
    const out = await (0, utilities_1.getRunOutput)('npx ionic start -l', folder);
    const projects = parseIonicStart(out);
    let type = undefined;
    for (const starter of projects) {
        if (type != starter.typeName) {
            type = starter.typeName;
            project.setGroup(`${type}`, '', getType(type), false);
        }
        project.add(new tip_1.Tip(`${starter.name}`, `${starter.description}`, tip_1.TipType.Run, 'Create Project', [
            `npx ionic start @app ${starter.name} --type=${starter.type} --capacitor --package-id=@package-id --no-git`,
            (0, utilities_1.isWindows)()
                ? `robocopy @app . /MOVE /E /NFL /NDL /NJH /NJS /nc /ns /np`
                : `mv @app/{,.[^.]}* . && rmdir @app`,
        ], 'Creating Project', 'Project Created')
            .showProgressDialog());
    }
    return project.groups;
}
exports.starterProject = starterProject;
function getType(framework) {
    switch (framework.toLowerCase()) {
        case 'angular':
        case 'angular (with ngmodules)':
            return tip_1.TipType.Angular;
        case 'vue':
            return tip_1.TipType.Vue;
        case 'react':
            return tip_1.TipType.React;
        default:
            return tip_1.TipType.Ionic;
    }
}
function parseIonicStart(text) {
    const lines = text.split('\n');
    let type = undefined;
    let typeName = undefined;
    let result = [];
    for (const line of lines) {
        if (line.includes('--type=')) {
            const t = line.split('=');
            typeName = t[1].replace(')', '');
            type = typeName;
            switch (typeName) {
                case 'ionic-angular':
                    typeName = 'ionic2';
                    break;
                case 'angular':
                    typeName = 'New Angular Project (Legacy)';
                    break;
                case 'angular-standalone':
                    typeName = 'New Angular Project';
                    break;
                case 'react':
                    typeName = 'New React Project';
                    break;
                case 'vue':
                    typeName = 'New Vue Project';
                    break;
            }
        }
        if (line.includes('|')) {
            const t = line.split('|');
            const name = t[0].trim();
            const description = t[1].trim();
            if (name != 'name') {
                result.push({ type: type, typeName: typeName, name: name, description: description });
            }
        }
    }
    result = result.filter((project) => {
        return project.type != 'ionic1' && project.type != 'ionic-angular';
    });
    result = result.sort((a, b) => (a.typeName > b.typeName ? 1 : -1));
    return result;
}
//# sourceMappingURL=ionic-start-deleteme.js.map