import * as vscode from 'vscode';
import * as iDeviceDeps from './iDeviceConnections';

import { LKutils } from './Utils';
import { ToolboxNodeProvider } from './iDeviceToolbox';
import { iDeviceNodeProvider } from './iDeviceConnections';
import { ApplicationNodeProvider } from './iDeviceApplications';
import { FileSystemNodeProvider, FileItem } from './iDeviceFileSystem';

import { writeFileSync } from 'fs';
import { execSync, exec, ChildProcess } from 'child_process';

// tslint:disable-next-line: class-name
export class iDevices {

    public static shared: iDevices = new iDevices();
    private selectedDevice: iDeviceDeps.iDeviceItem | null = null;

    constructor() {

    }

    public setDevice(devObject: iDeviceDeps.iDeviceItem | null) {
        if (this.selectedDevice === devObject) {
            console.log("[i] this.selectedDevice === devObject");
            return;
        }
        if (this.selectedDevice?.udid === devObject?.udid) {
            console.log("[i] this.selectedDevice?.udid === devObject?.udid");
            return;
        }
        this.selectedDevice = devObject;
        this.reloadDevice();
        const vdev = devObject as iDeviceDeps.iDeviceItem;
        if (devObject === null) {
			console.log("[E] iDevice Selection Invalid");
			vscode.window.showErrorMessage("setDevice (null)");
            return;
        }
		console.log("[*] User selected device: " + devObject.udid);
        vscode.window.showInformationMessage("Selected device: " + devObject.udid.substring(0, 16).toUpperCase() + " +");
    }

    public getDevice(): iDeviceDeps.iDeviceItem | null {
        return this.selectedDevice;
    }

    private reloadDevice() {
        ApplicationNodeProvider.nodeProvider.refresh();
        ToolboxNodeProvider.nodeProvider.refresh();
        FileSystemNodeProvider.nodeProvider.refresh();
    }

    public executeOnDevice(cmd: string): string {
        if (this.selectedDevice === undefined) {
            vscode.window.showErrorMessage("No device selected");
            return "";
        }
        let selection = this.selectedDevice as iDeviceDeps.iDeviceItem;
        iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
        let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
        writeFileSync(passpath, selection.iSSH_password);
        let terminalCommands: Array<string> = [];
        terminalCommands.push(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
        terminalCommands.push(" rm -f \'" + passpath + "\'");
        terminalCommands.push(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
        terminalCommands.push(" sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + String(selection.iSSH_mappedPort) + " root@127.0.0.1 \'" + cmd + "\'");
        let bashScript = "";
        let bashpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
        terminalCommands.forEach((cmd) => {
            bashScript += "\n";
            bashScript += cmd;
        });
        writeFileSync(bashpath, bashScript, 'utf8');
        let realCmd = "/bin/bash -C \'" + bashpath + "\' && exit";
        let executeObject = execSync(realCmd);
        return executeObject.toString();
    }

    public executeOnDeviceAsync(cmd: string): ChildProcess | undefined {
        // console.log("[W] executeOnDeviceAsync may cause executionLock errors!");
        if (this.selectedDevice === undefined) {
            vscode.window.showErrorMessage("No device selected");
            return;
        }
        // while (iDevices.executionLock) { }
        // iDevices.executionLock = true;
        let selection = this.selectedDevice as iDeviceDeps.iDeviceItem;
        iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
        let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
        writeFileSync(passpath, selection.iSSH_password);
        let terminalCommands: Array<string> = [];
        terminalCommands.push(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
        // terminalCommands.push(" rm -f \'" + passpath + "\'");
        terminalCommands.push(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
        terminalCommands.push(" sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + String(selection.iSSH_mappedPort) + " root@127.0.0.1 \'" + cmd + "\'");
        let bashScript = "";
        let bashpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
        terminalCommands.forEach((cmd) => {
            bashScript += "\n";
            bashScript += cmd;
        });
        writeFileSync(bashpath, bashScript, 'utf8');
        let realCmd = "/bin/bash -C \'" + bashpath + "\'";
        let executeObject = exec(realCmd);
        // iDevices.executionLock = false;
        return executeObject;
    }

}
