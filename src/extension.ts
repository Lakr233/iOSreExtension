import * as vscode from 'vscode';
import { iDeviceNodeProvider, iDeviceItem } from './iDeviceConnections';
import { ToolboxNodeProvider } from './iDeviceToolbox';

export function activate(context: vscode.ExtensionContext) {

	console.log('Bootstraping "wiki.qaq.iosre" extension!');

	iDeviceNodeProvider.init();
	ToolboxNodeProvider.init();

	let disposable = vscode.commands.registerCommand('extension.iOSreAction-ShowVersion', () => {
		vscode.window.showInformationMessage("wiki.qaq.iosre -> Version 0.1");
	});

	context.subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
export function deactivate() {}
