import * as vscode from 'vscode';
import { iDeviceNodeProvider} from './iDeviceConnections';
import { ToolboxNodeProvider} from './iDeviceToolbox';
import { ApplicationNodeProvider } from './iDeviceApplications';
import { LKutils } from './Utils';
import { execSync } from 'child_process';
import { LKBootStrap } from './LKBootstrap';
import { iDevices } from './iDevices';
import { FileItem, FileSystemNodeProvider } from './iDeviceFileSystem';
import { read } from 'fs';
import { stringify } from 'querystring';

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
	FileSystemNodeProvider.init();

	context.subscriptions.push(vscode.commands.registerCommand('iDeviceSelect', (deviceObject) => {
		iDeviceNodeProvider.nodeProvider.performSelector(deviceObject);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('ToolboxCalled', (ToolObject) => {
		ToolboxNodeProvider.nodeProvider.performSelector(ToolObject);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('ApplicationSelected', (AppObject) => {
		ApplicationNodeProvider.nodeProvider.performSelector(AppObject);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('iFileSelected', (FileObject) => {
		FileSystemNodeProvider.nodeProvider.performSelector(FileObject);
	}));

	let disposable1 = vscode.commands.registerCommand('extension.iOSreAction-ShowVersion', () => {
		vscode.window.showInformationMessage("wiki.qaq.iosre -> I dont know lol");
	});
	context.subscriptions.push(disposable1);

	let disposable2 = vscode.commands.registerCommand('extension.iOSreAction-replaceFile', () => {

		let path = vscode.window.activeTextEditor?.document.uri.path;
		if (path === undefined || path === "") {
			vscode.window.showWarningMessage("iOSre -> No file being opened");
			return;
		}
		let blockpath = path;

		let readRecord = LKutils.shared.readKeyPairValue(path);
		if (readRecord === "" || readRecord === undefined) {
			vscode.window.showWarningMessage("iOSre -> Could not find record for this file, operation aborted");
			return;
		}

		let deviceUDID = "";
		let terminater = 0;
		let targetLocation = "";
		let charset = readRecord.split("");
		for (let i = 0; i < readRecord.length; i++) {
			let c = charset[i];
			if (c === "|") {
				terminater = i;
				break;
			}
			deviceUDID += c;
		}
		targetLocation = readRecord.substring(terminater + 1, readRecord.length);
		if (!targetLocation.startsWith("/") || targetLocation === "") {
			vscode.window.showWarningMessage("iOSre -> Target location " + targetLocation + " invaild, operation aborted");
			return;
		}
		if (iDevices.shared.getDevice()?.udid !== deviceUDID) {
			vscode.window.showWarningMessage("iOSre -> Selected device mismatch, operation aborted");
			return;
		}

		vscode.window.showInformationMessage("iOSre -> Upload and replace will save your file first", "Contunie", "Cancel").then((str) => {
			if (str !== "Contunie") {
				return;
			}
			vscode.window.activeTextEditor?.document.save();
			if (iDevices.shared.getDevice()?.udid !== deviceUDID) {
				vscode.window.showWarningMessage("iOSre -> Selected device mismatch, operation aborted");
				return;
			}
			FileSystemNodeProvider.nodeProvider._fso_replace(blockpath, targetLocation);
		});

	});
	context.subscriptions.push(disposable2);

}

// this method is called when your extension is deactivated
export function deactivate() {}
