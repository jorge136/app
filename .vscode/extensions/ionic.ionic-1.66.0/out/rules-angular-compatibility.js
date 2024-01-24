"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAngularCompatibility = void 0;
const vscode_1 = require("vscode");
const analyzer_1 = require("./analyzer");
const tip_1 = require("./tip");
const utilities_1 = require("./utilities");
const semver_1 = require("semver");
// Based on https://angular.io/guide/versions
function checkAngularCompatibility(project) {
    runChecks(project, [
        { angular: '12.0.x', typescript: '~4.2.3', rxjs: '^6.5.3' },
        { angular: '12.1.0-12.2.0', typescript: '4.2.3-4.4.0', rxjs: '6.5.3-7.0.0,7.0.0' }
    ]);
}
exports.checkAngularCompatibility = checkAngularCompatibility;
function runChecks(project, angularVersions) {
    for (const angularVersion of angularVersions) {
        if ((0, semver_1.satisfies)('@angular/core', angularVersion.angular)) {
            if (!(0, semver_1.satisfies)('typescript', angularVersion.typescript)) {
                addWarning(project, 'typescript', (0, analyzer_1.getPackageVersion)('typescript'), (0, analyzer_1.getPackageVersion)('@angular/core'));
            }
            if (!(0, semver_1.satisfies)('rxjs', angularVersion.rxjs)) {
                addWarning(project, 'rxjs', (0, analyzer_1.getPackageVersion)('rxjs'), (0, analyzer_1.getPackageVersion)('@angular/core'));
            }
        }
    }
}
function between(library, versionRange) {
    const versions = versionRange.split('-');
    return (0, analyzer_1.isGreaterOrEqual)(library, versions[0]) && (0, analyzer_1.isLess)(library, versions[1]);
}
function addWarning(project, library, current, angular) {
    const msg = `Version ${current} of ${library} is not supported by Angular ${angular}.`;
    project.add(new tip_1.Tip(`${library} v${current} is unsupported`, '', tip_1.TipType.Warning, msg).setAction(fixCompatibility, project, msg));
}
async function fixCompatibility(project, msg) {
    const response = await vscode_1.window.showWarningMessage(msg, 'More Information', 'Exit');
    if (response == 'More Information') {
        (0, utilities_1.openUri)('https://angular.io/guide/versions');
    }
}
//# sourceMappingURL=rules-angular-compatibility.js.map