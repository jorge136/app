"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IonicProjectsreeProvider = void 0;
const vscode_1 = require("vscode");
const command_name_1 = require("./command-name");
const ionic_tree_provider_1 = require("./ionic-tree-provider");
const recommendation_1 = require("./recommendation");
class IonicProjectsreeProvider {
    constructor(workspaceRoot, context) {
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh(project) {
        ionic_tree_provider_1.ionicState.workspace = project;
        this.selectedProject = project;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve(this.projectList());
    }
    projectList() {
        const list = [];
        for (const project of ionic_tree_provider_1.ionicState.projects) {
            const cmd = {
                command: command_name_1.CommandName.ProjectSelect,
                title: 'Open',
                arguments: [project.name],
            };
            const r = new recommendation_1.Recommendation(project.folder, undefined, project.name, vscode_1.TreeItemCollapsibleState.None, cmd);
            const icon = project.name == this.selectedProject ? 'circle-filled' : 'none';
            r.setIcon(icon);
            list.push(r);
        }
        return list;
    }
}
exports.IonicProjectsreeProvider = IonicProjectsreeProvider;
//# sourceMappingURL=ionic-projects-provider.js.map