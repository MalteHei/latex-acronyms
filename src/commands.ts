import * as vscode from "vscode";
import { FileReader } from "./file-reader";


export class Commands {

	/**
	 * Register commands for this extension in vscode.
	 */
	public static registerExtensionCommands(ctx: vscode.ExtensionContext): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		// command to invoke updating acronyms
		disposables.push(vscode.commands.registerTextEditorCommand('latex-acronyms.readAcronyms', () => {
			FileReader.updateAndGetAcronyms(ctx, { manual: true });
		}));

		return disposables;
	}
}
