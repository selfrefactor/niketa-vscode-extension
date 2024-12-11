const { filter } = require('rambdax');
const { minimatch } = require('minimatch');
let { existsSync } = require('fs');
const { window, workspace } = require('vscode');
const { spawnCommand, readJson, runInVsCodeTerminal } = require('./utils');
const { getSpecFilePath } = require('./get-spec-file-path');

const escapeTerminalPath = (path) => {
  return path
    .replace(/([()[\]])/g, '\\$1'); // Escapes (, ), [, and ]
};

const PERSIST_LINT_TERMINAL = workspace
	.getConfiguration('niketa')
	.get('PERSIST_LINT_TERMINAL');

class Worker {
	constructor() {
		this.niketaScripts = [];
		this.niketaScriptsLegacy = {};
		this.dir = workspace.workspaceFolders[0].uri.path;
		this.initialized = true;
	}

	async evaluateNiketaScriptsLegacy() {
		const currentFilePath = this.getCurrentFile();
		const relativeFilePath = currentFilePath.replace(`${this.dir}/`, '');
		if (!this.niketaScriptsLegacy[relativeFilePath]) {
			return false;
		}

		const [command, ...inputs] =
			this.niketaScriptsLegacy[relativeFilePath].split(' ');
		if (!command) return false;
		await spawnCommand({
			command,
			cwd: this.dir,
			inputs,
			onLog: () => {},
		});

		return true;
	}

	getCurrentFile() {
		const editor = this.getEditor();
		const { fileName: currentFilePath } = editor.document;

		return currentFilePath ?? '';
	}

	getEditor() {
		const editor = window.activeTextEditor;
		if (!editor) throw new Error('!editor');

		return editor;
	}

	init() {
		const location = existsSync(`${this.dir}/niketa.json`)
			? `${this.dir}/niketa.json`
			: `${this.dir}/package.json`;
		const configJson = readJson(location);
		if (configJson.niketaScripts) {
			this.niketaScripts = configJson.niketaScripts;
			return;
		}
		if (configJson.niketaScriptsLegacy) {
			this.niketaScriptsLegacy = configJson.niketaScriptsLegacy;
		}
	}

	async requestTestRun() {
		const currentFilePath = this.getCurrentFile().replace(`${this.dir}/`, '');
		const scriptsToRun = this.niketaScripts;
		if (!scriptsToRun) return;
		const [foundScriptKey] = filter(
			(x) => minimatch(currentFilePath, x),
			Object.keys(scriptsToRun),
		);
		if (!foundScriptKey) return;
		const actualFilePath = getSpecFilePath(currentFilePath, this.dir);
		const command = `${scriptsToRun[foundScriptKey]} ${actualFilePath}`;
		const label = 'Test';

		await runInVsCodeTerminal({
			command,
			label,
			closeAfter: false,
		});
	}

	async standaloneLint() {
		const currentFilePath = this.getCurrentFile();
		let escapedPath = escapeTerminalPath(currentFilePath);
		// lint with biome/oxlint
		const command = `run lint:file ${escapedPath}`;

		await runInVsCodeTerminal({
			command,
			label: 'Lint',
			closeAfter: !PERSIST_LINT_TERMINAL,
		});
	}

	async requestRun() {
		if (Object.keys(this.niketaScriptsLegacy).length > 0) {
			return this.evaluateNiketaScriptsLegacy();
		}
		// fallback if user presses run button, it will lint if no test script is found
		if (Object.keys(this.niketaScripts).length === 0) {
			return this.standaloneLint();
		}

		await this.requestTestRun();
	}
}

exports.initExtension = () => {
	const worker = new Worker();
	return worker;
};
