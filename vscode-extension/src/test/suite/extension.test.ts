/**
 * Extension tests
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('thedotmack.borg-extension-vscode'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('thedotmack.borg-extension-vscode');
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('borgExtension.checkWorkerHealth'));
    assert.ok(commands.includes('borgExtension.restartWorker'));
    assert.ok(commands.includes('borgExtension.openViewer'));
    assert.ok(commands.includes('borgExtension.openSettings'));
  });
});
