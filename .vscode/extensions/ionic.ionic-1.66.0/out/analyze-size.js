"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSize = void 0;
const logging_1 = require("./logging");
const utilities_1 = require("./utilities");
const path_1 = require("path");
const fs_1 = require("fs");
const ionic_build_1 = require("./ionic-build");
const monorepo_1 = require("./monorepo");
const vscode_1 = require("vscode");
/**
 * Generates a readable analysis of Javascript bundle sizes
 * Uses source-map-explorer on a production build of the app with source maps turned on
 * @param  {Project} project
 */
async function analyzeSize(queueFunction, project) {
    const dist = project.getDistFolder();
    queueFunction();
    await (0, utilities_1.showProgress)('Generating Project Statistics', async () => {
        let previousValue;
        try {
            previousValue = enableSourceMaps(project);
            (0, logging_1.writeIonic)('Building for production with Sourcemaps...');
            let args = '--prod';
            if (project.repoType == monorepo_1.MonoRepoType.nx) {
                args = '--configuration=production';
            }
            const cmd = await (0, ionic_build_1.ionicBuild)(project, args);
            const bumpSize = !(0, utilities_1.isWindows)() ? 'export NODE_OPTIONS="--max-old-space-size=8192" && ' : '';
            try {
                await run2(project, `${bumpSize}${cmd}`, undefined);
            }
            catch (err) {
                (0, logging_1.writeError)(err);
            }
            (0, logging_1.writeIonic)('Analyzing Sourcemaps...');
            const result = { output: '', success: undefined };
            try {
                await run2(project, `npx source-map-explorer "${dist}/**/*.js" --json --exclude-source-map`, result);
            }
            catch (err) {
                vscode_1.window.showErrorMessage('Unable to analyze source maps: ' + err, 'OK');
            }
            const html = analyzeResults(analyzeBundles((0, utilities_1.stripJSON)(result.output, '{')), 'Bundle Analysis', 'Size of Javascript bundles for your code and 3rd party packages.') +
                analyzeResults(analyzeAssets(dist, project.projectFolder()), 'Asset Analysis', 'Size of assets in your distribution folder.');
            showWindow(project.projectFolder(), html);
            (0, logging_1.writeIonic)('Launched project statistics window.');
        }
        finally {
            revertSourceMaps(project, previousValue);
        }
    });
}
exports.analyzeSize = analyzeSize;
/**
 * Enables the configuration for source maps in the projects configuration
 * @param  {Project} project
 * @returns string
 */
function enableSourceMaps(project) {
    var _a, _b;
    try {
        let filename = (0, path_1.join)(project.folder, 'angular.json');
        if (!(0, fs_1.existsSync)(filename)) {
            filename = (0, path_1.join)(project.projectFolder(), 'project.json'); // NX Style
        }
        let changeMade = false;
        if ((0, fs_1.existsSync)(filename)) {
            const json = (0, fs_1.readFileSync)(filename, 'utf-8');
            const config = JSON.parse(json);
            const projects = config.projects ? config.projects : { app: config };
            for (const prj of Object.keys(projects)) {
                const cfg = projects[prj].architect ? projects[prj].architect : projects[prj].targets;
                if ((_b = (_a = cfg.build) === null || _a === void 0 ? void 0 : _a.configurations) === null || _b === void 0 ? void 0 : _b.production) {
                    const previousValue = cfg.build.configurations.production.sourceMap;
                    if (previousValue == true) {
                        // Great nothing to do, already enabled
                        return previousValue;
                    }
                    else {
                        cfg.build.configurations.production.sourceMap = true;
                        (0, logging_1.writeIonic)(`Temporarily modified production sourceMap of ${prj} to true in angular.json`);
                        changeMade = true;
                    }
                }
            }
            if (changeMade) {
                (0, fs_1.writeFileSync)(filename, JSON.stringify(config, null, 2));
                return json;
            }
        }
    }
    catch {
        return undefined;
    }
    return undefined;
}
/**
 * Reverts the projects configuration back to its previous settings before source maps were turned on
 * @param  {Project} project
 * @param  {string} previousValue
 */
function revertSourceMaps(project, previousValue) {
    if (previousValue == undefined) {
        return;
    }
    let filename = (0, path_1.join)(project.folder, 'angular.json');
    if (!(0, fs_1.existsSync)(filename)) {
        filename = (0, path_1.join)(project.projectFolder(), 'project.json'); // NX Style
    }
    if ((0, fs_1.existsSync)(filename)) {
        (0, fs_1.writeFileSync)(filename, previousValue, { encoding: 'utf-8' });
    }
}
function htmlHead() {
    return `<!DOCTYPE html><html lang="en">
	<style>
	.bar-container {
		border: 2px solid var(--vscode-list-hoverBackground);
		width: 200px;
		height: 16px;
	}
	.bar-indent {
		border: 2px solid var(--vscode-list-hoverBackground);
		width: 180px;
		margin-left: 20px;
		height: 16px;
	}
	.bar { 
		height: 100%; 		
		background-color: var(--vscode-button-background);
	}
	.shade {
		color: var(--vscode-list-deemphasizedForeground);
	} 
	.row { display: flex } 
	.col { margin: 5px }
	.float {
		position: absolute;
		margin: 0;		
		padding: 0;
		padding-left: 10px;
	}
	.tooltip {
		position: relative;
		display: inline-block;
	  }
	.tooltip .tooltiptext {
		visibility: hidden;
		width: 200px;
		background-color: var(--vscode-editor-background);
		color: var(--vscode-editor-foreground);
		border: 1px solid var(--vscode-editor-foreground);
		text-align: center;
		padding: 5px 0;	   
		position: absolute;
		z-index: 1;
	  }
	.tooltip:hover .tooltiptext {
		visibility: visible;
	  }	  
	details { user-select: none; }
	details[open] summary span.icon {
		transform: rotate(180deg);
	  }
	summary {
		display: flex;
		cursor: pointer;
	  }
	.hover {
		cursor: pointer;
	}
	</style>
	<script>
	   const vscode = acquireVsCodeApi();
	   function send(message) {
		   console.log(message);
	       vscode.postMessage(message);
	   }	   
	</script>
	<body>`;
}
function analyzeBundles(json) {
    const data = JSON.parse(json);
    const ignoreList = ['[EOLs]'];
    const files = [];
    for (const result of data.results) {
        for (const key of Object.keys(result.files)) {
            if (!ignoreList.includes(key)) {
                const info = getInfo(key, result.files[key].size, result.bundleName);
                files.push(info);
            }
        }
    }
    return files;
}
function analyzeResults(files, title, blurb) {
    let html = '';
    let largestGroup = 0;
    const groups = {};
    const groupLargest = {};
    const groupCount = {};
    const groupFiles = {};
    // Calculate totals
    for (const file of files) {
        if (!groups[file.type]) {
            groups[file.type] = 0;
            groupLargest[file.type] = 0;
            groupCount[file.type] = 0;
            groupFiles[file.type] = [];
        }
        if (!groupFiles[file.type].includes(file.bundlename)) {
            groupFiles[file.type].push(file.bundlename);
        }
        groupCount[file.type] += 1;
        if (file.size > groupLargest[file.type]) {
            groupLargest[file.type] = file.size;
        }
        groups[file.type] = groups[file.type] + file.size;
    }
    for (const group of Object.keys(groups)) {
        if (groups[group] > largestGroup) {
            largestGroup = groups[group];
        }
    }
    files = files.sort((a, b) => {
        return cmp(groups[b.type], groups[a.type]) || cmp(b.size, a.size);
    });
    let lastType;
    html += `<h1>${title}</h1>
	<p class="shade">${blurb}</p>`;
    for (const file of files) {
        if (file.type != lastType) {
            if (lastType) {
                html += '</details>';
            }
            lastType = file.type;
            const onclick = groupCount[lastType] == 1 ? `onclick="send('${file.filename}')"` : '';
            html += `<details><summary>
			<div class="row">
			   <div class="col">${graph(groups[lastType], largestGroup)}</div>
			   <p ${onclick} class="col tooltip">${lastType}
			      <span class="tooltiptext">${friendlySize(groups[lastType])} (${groupFiles[lastType].length} Files)</span>
			   </p>			
			</div>
			</summary>`;
        }
        if (groupCount[lastType] != 1) {
            html += `
		    <div class="row">
		       <div class="col">${graph(file.size, groupLargest[file.type], true)}</div>
		       <p onclick="send('${file.filename}')" class="col tooltip shade hover">&nbsp;&nbsp;&nbsp;${file.name}
		          <span class="tooltiptext">${file.path}<br/>${file.size} bytes<br/>${file.bundlename}</span>
		       </p>		   
		    </div>`;
        }
    }
    html += '</details>';
    return html;
}
function showWindow(folder, html) {
    const panel = vscode_1.window.createWebviewPanel('viewApp', 'Project Statistics', vscode_1.ViewColumn.Active, {
        enableScripts: true,
    });
    panel.webview.onDidReceiveMessage(async (filename) => {
        if (!filename.startsWith(folder)) {
            (0, utilities_1.openUri)((0, path_1.join)(folder, filename));
        }
        else {
            (0, utilities_1.openUri)(filename);
        }
    });
    panel.webview.html = htmlHead() + html + '</body></html>';
}
function graph(size, largest, indent = false) {
    return `
	<div class="${indent ? 'bar-indent' : 'bar-container'}">
	<div class="bar" style="width:${(size * 100) / largest}%">
	<p class="float">${friendlySize(size)}</p>
	</div>
	</div>`;
}
function cmp(a, b) {
    if (a > b)
        return +1;
    if (a < b)
        return -1;
    return 0;
}
function getInfo(fullname, size, bundlename) {
    let url;
    let name;
    let pathname;
    try {
        url = new URL(fullname);
        name = url.pathname;
        pathname = url.pathname;
    }
    catch {
        if (fullname.startsWith('../node_modules')) {
            name = fullname.replace('../node_modules', '/node_modules');
            pathname = name;
        }
        else {
            name = fullname;
            let filename = bundlename;
            if (name == '[unmapped]' || name == '[no source]') {
                name = bundlename;
            }
            else {
                if (bundlename.endsWith('chunk.js')) {
                    filename = fullname; // TODO: React projects dont seem to set the path well
                }
            }
            return { name: friendlyName(name), type: friendlyType(fullname), path: fullname, size, bundlename, filename };
        }
    }
    const filename = name.replace('webpack://', '.');
    if (name.startsWith('/node_modules/')) {
        name = name.replace('/node_modules/', '');
    }
    const names = name.split('/');
    const path = friendlyPath(names.join(' '));
    const type = friendlyType(pathname);
    name = friendlyName(names.pop(), path);
    return { name, path, type, size, bundlename, filename };
}
function friendlySize(size) {
    if (size > 1000) {
        return Math.round(size / 1000.0).toString() + 'kb';
    }
    else {
        return '1kb';
    }
}
function friendlyType(name) {
    let type = 'Your Code';
    if (name.startsWith('/node_modules/')) {
        type = '3rd Party';
    }
    if (name.includes('polyfills')) {
        type = 'Polyfills';
    }
    if (name.startsWith('/node_modules/core-js')) {
        type = 'Core JS';
    }
    if (name == '[unmapped]' || name == '[no source]') {
        return 'Without Source Code';
    }
    if (name.startsWith('/javascript/esm|')) {
        type = '3rd Party';
    }
    if (name.startsWith('/webpack/')) {
        return 'Webpack';
    }
    if (name.startsWith('/node_modules/react')) {
        return 'React';
    }
    if (name.startsWith('/node_modules/@')) {
        const names = name.replace('/node_modules/@', '').split('/');
        type = names[0];
        if (names.length > 1) {
            type = names[0] + ' ' + names[1];
        }
    }
    else if (name.startsWith('/node_modules/rxjs')) {
        type = 'RxJS';
    }
    type = type.split('-').join(' ');
    return toTitleCase(type);
}
function friendlyName(name, path) {
    let result = name === null || name === void 0 ? void 0 : name.replace('.entry.js', '');
    result = result.split('-').join(' ');
    result = result.split('_').join(' ');
    result = result.split('.').join(' ');
    result = result.split('/').join(' ');
    result = result.split('%20').join(' ');
    for (let i = 1; i < 9; i++) {
        if (result.endsWith(` ${i}`)) {
            result = result.replace(` ${i}`, '');
        }
    }
    // Ionic component
    if (result.startsWith('ion ')) {
        result = result.replace('ion ', '');
        if (result && result[result.length - 2] == '_') {
            result = result.substring(0, result.length - 2); // gets rid of _2, _3 etc
        }
        result += ' Component';
    }
    result = result.replace(' dist', '');
    result = result.replace(' tsx', '');
    if (result.endsWith(' js')) {
        result = result.replace(' js', '');
    }
    else if (result.endsWith(' ts')) {
        result = result.replace(' ts', '');
    }
    else if (result.endsWith(' mjs')) {
        result = result.replace(' mjs', '');
    }
    else if (result.endsWith(' vue')) {
        result = result.replace(' vue', '');
    }
    else if (result.endsWith(' index')) {
        result = result.replace(' index', '');
    }
    if (result == 'index' || result == 'runtime') {
        result = path;
    }
    else {
        if (path === null || path === void 0 ? void 0 : path.startsWith('Moment Locale')) {
            result = path;
        }
    }
    if (!result) {
        return name;
    }
    if (result.toLowerCase() != result) {
        // Given OneAndTwoAndThree => One And Two And Three
        result = result.replace(/([A-Z])/g, ' $1').trim();
    }
    return toTitleCase(result);
}
function toTitleCase(text) {
    return text
        .replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    })
        .trim();
}
function friendlyPath(path) {
    path = path.replace('fesm2020', '');
    path = path.replace('fesm2015', '');
    path = path.replace('dist ngx', '');
    path = path.replace('dist esm', '');
    path = path.replace('index.js', '');
    path = path.replace('_lib', '');
    path = path.replace(' esm', '');
    path = path.replace(' dist', '');
    path = path.replace('.js', '');
    path = path.replace('@capacitor', 'Capacitor');
    path = path.split('-').join(' ');
    if (path == '@ionic core dist esm') {
        return 'Ionic Framework';
    }
    else if (path == '@ionic core dist esm polyfills') {
        return 'Ionic Framework Polyfills';
    }
    else if (path.startsWith('@ionic-enterprise')) {
        path = path.replace('@ionic-enterprise', 'Ionic Enterprise');
    }
    else if (path.startsWith('@angular')) {
        path = path.replace('@angular', 'Angular');
    }
    if (path.startsWith('rxjs')) {
        return 'RxJS';
    }
    if (path == 'webpack runtime') {
        return 'Webpack';
    }
    path = path.replace('__ivy_ngcc__', '');
    return toTitleCase(path).trim();
}
async function run2(project, command, output) {
    return await (0, utilities_1.run)(project.projectFolder(), command, undefined, [], [], undefined, undefined, output, true);
}
function analyzeAssets(distFolder, prjFolder) {
    // Summarize files other than js
    const files = getAllFiles(distFolder);
    const excludedFileTypes = ['.js', '.map'];
    const result = [];
    for (const file of files) {
        const ext = (0, path_1.extname)(file);
        if (!excludedFileTypes.includes(ext)) {
            const size = (0, fs_1.statSync)(file).size;
            result.push({
                name: (0, path_1.basename)(file),
                path: file,
                bundlename: file,
                type: assetType(ext),
                size,
                filename: file.replace(prjFolder, ''),
            });
        }
    }
    return result;
}
function assetType(ext) {
    switch (ext) {
        case '.png':
        case '.jpg':
        case '.gif':
        case '.jpeg':
            return 'Images';
        case '.svg':
            return 'Vector Images';
        case '.woff':
        case '.woff2':
        case '.eot':
        case '.ttf':
            return 'Fonts';
        case '.css':
            return 'Style Sheets';
        default:
            return 'Other';
    }
}
function getAllFiles(dirPath, arrayOfFiles) {
    const files = (0, fs_1.readdirSync)(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach((file) => {
        if ((0, fs_1.statSync)((0, path_1.join)(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles((0, path_1.join)(dirPath, file), arrayOfFiles);
        }
        else {
            arrayOfFiles.push((0, path_1.join)(dirPath, file));
        }
    });
    return arrayOfFiles;
}
//# sourceMappingURL=analyze-size.js.map