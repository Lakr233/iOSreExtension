import * as vscode from 'vscode';
import * as iDeviceDeps from './iDeviceConnections';
import { iDeviceNodeProvider } from './iDeviceConnections';
import { ApplicationNodeProvider } from './iDeviceApplications';

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
    }

}
