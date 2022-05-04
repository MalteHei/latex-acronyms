import * as vscode from 'vscode';
import { EXTENSION_NAME } from './extension';


export class TriggerPatterns {
	private static CUSTOM_PATTERNS: RegExp[] = [];
	private static DEFAULT_PATTERNS: RegExp[] = [
		// https://de.overleaf.com/learn/latex/Glossaries
		/* Acronym */
		/\\acr(long|short|full){/i,
		/* Terms */
		/\\gls(pl)?{/i
	];

	public static registerConfigurationWatcher(): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		disposables.push(vscode.workspace.onDidChangeConfiguration(_ => TriggerPatterns.updateCustomPatternsFromConfig()));

		return disposables;
	}

	public static getCustomPatterns(): RegExp[] {
		return this.CUSTOM_PATTERNS;
	}

	public static getDefaultPatterns(): RegExp[] {
		return this.DEFAULT_PATTERNS;
	}

	public static updateCustomPatternsFromConfig(): void {
		this.CUSTOM_PATTERNS = this.readCustomPatternsFromConfig();
	}

	private static readCustomPatternsFromConfig(): RegExp[] {
		const conf = vscode.workspace.getConfiguration(EXTENSION_NAME);
		const patterns: string[] = conf.get('customPatterns') || [];

		return patterns.map(p => `\\\\${p}{`).map(p => new RegExp(p, 'i'));
	}
}
