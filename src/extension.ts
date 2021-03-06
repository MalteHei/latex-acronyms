import * as vscode from 'vscode';
import { Commands } from './commands';
import { FileReader } from './file-reader';
import { Intellisense } from './intellisense';
import { Logger } from './logger';
import { TriggerPatterns } from './trigger-patterns';
import * as packageJSON from '../package.json';

/**
 * The key for accessing acronyms in
 * {@link vscode.ExtensionContext.workspaceState}.
 */
export const ACRONYMS_KEY = 'ACRONYMS';
export const EXTENSION_NAME = packageJSON.name;


function init(ctx: vscode.ExtensionContext): void {
	FileReader.updateAndGetAcronyms(ctx);
	TriggerPatterns.updateCustomPatternsFromConfig();
}

export function activate(context: vscode.ExtensionContext) {
	Logger.DEBUG = vscode.workspace.getConfiguration(EXTENSION_NAME).get('debug') || packageJSON.contributes.configuration.properties['latex-acronyms.debug'].default;
	Logger.debug(`Activating "${EXTENSION_NAME}"`);
	const disposables: vscode.Disposable[] = [];

	init(context);

	// register listeners
	disposables.push(...FileReader.registerFileWatcher(context));
	disposables.push(...TriggerPatterns.registerConfigurationWatcher());
	disposables.push(...Logger.registerConfigurationWatcher());

	// register commands
	disposables.push(...Commands.registerExtensionCommands(context));

	// register providers
	disposables.push(...Intellisense.registerCompletionItemProvider(context));

	context.subscriptions.push(...disposables);
}

export function deactivate() { }
