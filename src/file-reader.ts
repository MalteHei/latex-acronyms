import { readFileSync } from 'fs';
import * as vscode from 'vscode';
import { ACRONYMS_KEY } from './extension';
import { Logger } from './logger';

export const texFileGlob = '**/*.tex';


export class FileReader {

	/**
	 * Read acronyms from files matching {@link texFileGlob} and save them
	 * to {@link vscode.ExtensionContext.workspaceState}.
	 * @returns an array containing all acronyms
	 */
	public static updateAndGetAcronyms(ctx: vscode.ExtensionContext, options?: { manual?: boolean; }): string[] {
		const acronymDeclarationPattern = /\\(?<type>newglossaryentry|newacronym){(?<acronym>[^}]+)}/gm;
		let acronyms: string[] = [];

		// iterate over tex-files
		vscode.workspace.findFiles(texFileGlob).then(uris => {
			// delete current acronyms
			ctx.workspaceState.update(ACRONYMS_KEY, undefined);

			uris.forEach(uri => {
				const fileName = uri.path.replace(/.*\//, '');
				let acronymsInFile = 0;

				// read file contents
				const data = readFileSync(uri.fsPath, 'utf-8');
				let match = acronymDeclarationPattern.exec(data);
				do {	// iterate over matches
					if (match?.groups?.acronym) {
						acronymsInFile++;
						const existingAcronyms = ctx.workspaceState.get<string[]>(ACRONYMS_KEY) || [];
						ctx.workspaceState.update(ACRONYMS_KEY, existingAcronyms.concat(match.groups.acronym));
					}
				} while ((match = acronymDeclarationPattern.exec(data)) !== null);
				Logger.debug(`found ${acronymsInFile} acronyms in ${fileName}`);
			});

			acronyms = ctx.workspaceState.get<string[]>(ACRONYMS_KEY) || [];
			Logger.debug(`done reading files!`, `Found ${acronyms?.length} acronyms across ${uris.length} filess`);
			if (options?.manual) {
				vscode.window.showInformationMessage(`Finished updating acronyms! Found ${acronyms?.length} acronym(s) across ${uris.length} files(s)`);
			}
		});
		return acronyms || [];
	}

	/**
	 * Register a {@link vscode.FileSystemWatcher} to update acronyms when files
	 * matching {@link texFileGlob} get created/changed/deleted.
	 */
	public static registerFileWatcher(ctx: vscode.ExtensionContext): vscode.Disposable[] {
		const disposables: vscode.Disposable[] = [];

		const texWatcher = vscode.workspace.createFileSystemWatcher(texFileGlob, false, false, false);
		disposables.push(texWatcher);
		disposables.push(texWatcher.onDidChange(_ => FileReader.updateAndGetAcronyms(ctx)));
		disposables.push(texWatcher.onDidCreate(_ => FileReader.updateAndGetAcronyms(ctx)));
		disposables.push(texWatcher.onDidDelete(_ => FileReader.updateAndGetAcronyms(ctx)));

		return disposables;
	}
}
