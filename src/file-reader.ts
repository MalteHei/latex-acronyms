import { readFileSync } from 'fs';
import * as vscode from 'vscode';
import { ACRONYMS_KEY } from './extension';
import { Logger } from './logger';

export const texFileGlob = '**/*.tex';

export interface Result {
	label: string;
	term: string;
}


export class FileReader {

	/**
	 * Read acronyms from files matching {@link texFileGlob} and save them
	 * to {@link vscode.ExtensionContext.workspaceState}.
	 * @returns an array containing all acronyms
	 */
	public static updateAndGetAcronyms(ctx: vscode.ExtensionContext, options?: { manual?: boolean; }): Result[] {
		const definitionPatterns: RegExp[] = [
			/\\(?<type>newacronym)(?<optional>\[.*\])*{(?<label>.+)}{(?<acronym>.+){(?<term>.+)}/igm,
			/\\(?<type>newglossaryentry)(?<optional>\[.*\])*{(?<label>.+)}{.*(name={(?<term>[^}]+)}).*}/igm,
		];
		let results: Result[] = [];

		// iterate over tex-files
		vscode.workspace.findFiles(texFileGlob).then(uris => {
			// delete current acronyms
			ctx.workspaceState.update(ACRONYMS_KEY, undefined);

			uris.forEach(uri => {
				const fileName = uri.path.replace(/.*\//, '');
				Logger.debug(`reading ${fileName}...`);

				const data = readFileSync(uri.fsPath, 'utf-8');
				let resultsInFile = 0;

				definitionPatterns.forEach(pattern => {
					let match = pattern.exec(data);
					do {	// iterate over matches
						if (match?.groups?.label) {
							resultsInFile++;
							const existingAcronyms = ctx.workspaceState.get<typeof results>(ACRONYMS_KEY) || [];
							ctx.workspaceState.update(ACRONYMS_KEY, existingAcronyms.concat({ label: match.groups.label, term: match.groups.term }));
						}
					} while ((match = pattern.exec(data)) !== null);
				});
				Logger.debug(`found ${resultsInFile} results in ${fileName}`);
			});

			results = ctx.workspaceState.get<typeof results>(ACRONYMS_KEY) || [];
			Logger.debug(`done reading files!`, `Found ${results.length} acronyms across ${uris.length} filess`);
			if (options?.manual) {
				vscode.window.showInformationMessage(`Finished updating acronyms! Found ${results?.length} acronym(s) across ${uris.length} files(s)`);
			}
		});
		return results || [];
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
