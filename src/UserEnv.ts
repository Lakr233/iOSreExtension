import * as vscode from 'vscode';
import * as iDeviceDeps from './iDeviceConnections';
import { iDeviceNodeProvider } from './iDeviceConnections';

// tslint:disable-next-line: class-name
export class iDevices {

    public static shared: iDevices = new iDevices();
    private selectedDevice: iDeviceDeps.iDeviceItem | null = null;

    constructor() {

    }

    public setDevice(devObject: iDeviceDeps.iDeviceItem | null) {
        this.selectedDevice = devObject;
        const vdev = devObject as iDeviceDeps.iDeviceItem;
        if (devObject === null || vdev.udid === "") {
			console.log("[E] iDevice Selection Invalid");
			vscode.window.showErrorMessage("iOSre -> Failed to set device. Refreshing...");
			iDeviceNodeProvider.nodeProvider.refresh();
            return;
        }
		console.log("[*] User selected device: " + devObject.udid);
		vscode.window.showInformationMessage("iOSre -> Selected device: " + devObject.udid);
    }


}
