"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPS = void 0;
async function execute(ctx, op) {
    var _a;
    for (let framework of op.value) {
        (_a = ctx.project.ios) === null || _a === void 0 ? void 0 : _a.addFramework(op.iosTarget, framework);
    }
}
exports.default = execute;
exports.OPS = [
    'ios.frameworks'
];
//# sourceMappingURL=frameworks.js.map