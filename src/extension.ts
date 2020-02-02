import * as vscode from 'vscode';
import { iDeviceNodeProvider, iDeviceItem } from './iDeviceConnections';
import { ToolboxNodeProvider, ToolItem } from './iDeviceToolbox';
import { ApplicationNodeProvider } from './iDeviceApplications';
import { iDevices } from './UserEnv';
import { LKutils } from './Utils';
import { readFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {

	console.log('Bootstraping "wiki.qaq.iosre" extension!');

	LKutils.shared.execute("mkdir -p \'" + context.globalStoragePath + "\'");
	LKutils.shared.setStoragePath(context.globalStoragePath);
	let ret = execSync("cd ~ && echo $(pwd)");
	LKutils.shared.setUserHome(ret.toString());


	iDeviceNodeProvider.init();
	ToolboxNodeProvider.init();
	ApplicationNodeProvider.init();

	context.subscriptions.push(vscode.commands.registerCommand('iDeviceSelect', (deviceObject) => {
		iDeviceNodeProvider.nodeProvider.performSelector(deviceObject);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('ToolboxCalled', (ToolObject) => {
		ToolboxNodeProvider.nodeProvider.performSelector(ToolObject);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('ApplicationSelected', (AppObject) => {
		ApplicationNodeProvider.nodeProvider.performSelector(AppObject);
	}));

	let disposable = vscode.commands.registerCommand('extension.iOSreAction-ShowVersion', () => {
		vscode.window.showInformationMessage("wiki.qaq.iosre -> Version 0.1");
	});

	context.subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
export function deactivate() {}
