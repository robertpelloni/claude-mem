import * as vscode from 'vscode';
import * as path from 'path';
import * as workerClient from './worker-client';

export class MemoryCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        vscode.workspace.onDidChangeTextDocument(_ => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const defaultLenses: vscode.CodeLens[] = [];

        // Since a fast robust symbol parser is complex for a simple example,
        // we'll place a single CodeLens at the top of the file mapping to the file's memory
        const topOfFile = new vscode.Range(0, 0, 0, 0);

        try {
            if (await workerClient.isWorkerHealthy()) {
                defaultLenses.push(new vscode.CodeLens(topOfFile, {
                    title: `$(database) Borg-Extension: View history for ${path.basename(document.uri.fsPath)}`,
                    tooltip: "Search borg-extension for context related to this file",
                    command: "borgExtension.openViewer",
                    arguments: [document.uri]
                }));
            }
        } catch {
            // Worker might be offline, fail silently
        }

        return defaultLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        return codeLens;
    }
}
