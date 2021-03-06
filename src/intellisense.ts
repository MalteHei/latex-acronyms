import * as vscode from 'vscode';
import { ACRONYMS_KEY } from './extension';
import { FileReader, Result } from './file-reader';
import { Logger } from './logger';
import { TriggerPatterns } from "./trigger-patterns";


export class Intellisense {
	private static readonly PROVIDER_OPTIONS = {
		selector: { scheme: 'file', language: 'latex' },
		triggerChars: ['{'],
	};

	/**
	 * Register the {@link vscode.CompletionItemProvider} created by
	 * {@link getLatexProvider}.
	 */
	public static registerCompletionItemProvider(ctx: vscode.ExtensionContext): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		disposables.push(vscode.languages.registerCompletionItemProvider(
			Intellisense.PROVIDER_OPTIONS.selector,
			Intellisense.getLatexProvider(ctx),
			...Intellisense.PROVIDER_OPTIONS.triggerChars
		));

		return disposables;
	}

	/**
	 * Check if a string matches with any pattern from {@link TriggerPatterns}.
	 * @param line the string to match
	 * @returns `true` if line matches any pattern from {@link TriggerPatterns},
	 * otherwise `false`
	 */
	public static matchAnyPattern(line: string): boolean {
		return TriggerPatterns.getDefaultPatterns().some(pattern => line.match(pattern) !== null)
			|| TriggerPatterns.getCustomPatterns().some(pattern => line.match(pattern) !== null);
	}

	/**
	 * Create a {@link vscode.CompletionItemProvider} that provides acronyms when
	 * one of {@link Intellisense.PROVIDER_OPTIONS.triggerChars} was typed.
	 * Whatever comes before this must match a
	 * {@link TriggerPatterns TriggerPattern}.
	 * @returns the {@link vscode.CompletionItemProvider}
	 */
	public static getLatexProvider(ctx: vscode.ExtensionContext): vscode.CompletionItemProvider<vscode.CompletionItem> {
		return {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				// check if an actual latex acronym command triggered the completion
				const line = document.lineAt(position).text.slice(0, position.character);

				if (!Intellisense.matchAnyPattern(line)) {
					Logger.debug(`completion triggered but no acronym command could be matched`, `for line ${line}`);
					return null;
				}

				const acronyms: Result[] = ctx.workspaceState.get<Result[]>(ACRONYMS_KEY) || FileReader.updateAndGetAcronyms(ctx);
				Logger.debug(`acronyms:`, acronyms);
				return acronyms.map(acronym => new vscode.CompletionItem({ label: acronym.label, description: acronym.term }, vscode.CompletionItemKind.Value));
			}
		};
	}
}
