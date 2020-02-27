import * as vscode from 'vscode';
import { iDeviceNodeProvider} from './iDeviceConnections';
import { ToolboxNodeProvider} from './iDeviceToolbox';
import { ApplicationNodeProvider } from './iDeviceApplications';
import { LKutils } from './Utils';
import { execSync } from 'child_process';
import { LKBootStrap } from './LKBootstrap';

export function activate(context: vscode.ExtensionContext) {

	console.log('Bootstraping "wiki.qaq.iosre" extension!');

	let cp = context.globalStoragePath;
	LKutils.shared.execute("mkdir -p \'" + cp + "\'");
	LKutils.shared.setStoragePath(context.globalStoragePath);
	let ret = execSync("cd ~ && echo $(pwd)");
	LKutils.shared.setUserHome(ret.toString());
	LKBootStrap.shared.ensureLocalBins(cp);

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
