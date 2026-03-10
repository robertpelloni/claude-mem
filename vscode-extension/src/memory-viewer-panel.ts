import * as vscode from 'vscode';
import * as path from 'path';
import * as workerClient from './worker-client';

export class MemoryViewerPanel {
    public static currentPanel: MemoryViewerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _fileUri: vscode.Uri | undefined;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, fileUri?: vscode.Uri) {
        this._panel = panel;
        this._fileUri = fileUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, fileUri?: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it and potentially update the file context.
        if (MemoryViewerPanel.currentPanel) {
            if (fileUri && fileUri !== MemoryViewerPanel.currentPanel._fileUri) {
                // If a new file is passed, we must reconstruct the panel to update state cleanly.
                MemoryViewerPanel.currentPanel.dispose();
            } else {
                MemoryViewerPanel.currentPanel._panel.reveal(column);
                return;
            }
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'borgExtensionViewer',
            'Borg Extension Viewer',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        MemoryViewerPanel.currentPanel = new MemoryViewerPanel(panel, extensionUri, fileUri);
    }

    public dispose() {
        MemoryViewerPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        try {
            const isHealthy = await workerClient.isWorkerHealthy();

            if (!isHealthy) {
                this._panel.webview.html = this._getErrorHtml('Worker service is not running. Please start it using "npm run worker:restart" in your borg-extension installation folder.');
                return;
            }

            let viewerUrl = workerClient.getViewerUrl();
            if (this._fileUri) {
                viewerUrl += `?q=${encodeURIComponent(path.basename(this._fileUri.fsPath))}`;
            }
            this._panel.webview.html = this._getIframeHtml(viewerUrl);
        } catch (e: any) {
            this._panel.webview.html = this._getErrorHtml(`Failed to load viewer: ${e.message}`);
        }
    }

    private _getIframeHtml(url: string) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Borg Extension Viewer</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <iframe src="${url}" title="Borg Extension Web UI"></iframe>
</body>
</html>`;
    }

    private _getErrorHtml(message: string) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .error-box {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 20px;
            border-radius: 4px;
            max-width: 600px;
        }
        h2 { margin-top: 0; }
    </style>
</head>
<body>
    <div class="error-box">
        <h2>Connection Error</h2>
        <p>${message}</p>
    </div>
</body>
</html>`;
    }
}
