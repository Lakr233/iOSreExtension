import * as vscode from 'vscode';
import * as iDeviceDeps from './iDeviceConnections';
import { iDeviceNodeProvider } from './iDeviceConnections';
import { ApplicationNodeProvider } from './iDeviceApplications';
import { LKutils } from './Utils';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { ToolboxNodeProvider } from './iDeviceToolbox';

// tslint:disable-next-line: class-name
export class iDevices {

    public static shared: iDevices = new iDevices();
    private selectedDevice: iDeviceDeps.iDeviceItem | null = null;

    constructor() {

    }

    public setDevice(devObject: iDeviceDeps.iDeviceItem | null) {
        if (this.selectedDevice === devObject) {
            console.log("[i] this.selectedDevice === devObject");
        }
        this.selectedDevice = devObject;
        const vdev = devObject as iDeviceDeps.iDeviceItem;
        if (devObject === null) {
			console.log("[E] iDevice Selection Invalid");
			vscode.window.showErrorMessage("iOSre -> setDevice (null)");
            return;
        }
		console.log("[*] User selected device: " + devObject.udid);
        vscode.window.showInformationMessage("iOSre -> Selected device: " + devObject.udid.substring(0, 16).toUpperCase() + " +");
        this.reloadDevice();
    }

    public getDevice(): iDeviceDeps.iDeviceItem | null {
        return this.selectedDevice;
    }

    private reloadDevice() {
        ApplicationNodeProvider.nodeProvider.refresh();
        ToolboxNodeProvider.nodeProvider.refresh();
    }

    public executeOnDevice(cmd: string): string {
        if (this.selectedDevice === undefined) {
            vscode.window.showErrorMessage("iOSre -> No device selected");
            return "";
        }
        let selection = this.selectedDevice as iDeviceDeps.iDeviceItem;
        iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
        let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
        writeFileSync(passpath, selection.iSSH_password);
        let terminalCommands: Array<string> = [];
        terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
        terminalCommands.push("rm -f \'" + passpath + "\'");
        terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\"");
        terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 \'" + cmd + "\'");
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

}
