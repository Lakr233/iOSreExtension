import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';

// tslint:disable-next-line: class-name
export class iDeviceItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
    }

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ios.svg'));

}

// tslint:disable-next-line: class-name
export class iDeviceNodeProvider implements vscode.TreeDataProvider<iDeviceItem> {

    public deviceList: Array<string> = []; // 储存udid
    public static nodeProvider: iDeviceNodeProvider;

    public static init() {
        const np = new iDeviceNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectioniDevices', np);
        vscode.commands.registerCommand("iosreIDtabSectioniDevices.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
    }

	private _onDidChangeTreeData: vscode.EventEmitter<iDeviceItem> = new vscode.EventEmitter<iDeviceItem>();
    readonly onDidChangeTreeData: vscode.Event<iDeviceItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: iDeviceItem): vscode.TreeItem {
        return element;
    }

    refresh() {
        iDeviceNodeProvider.nodeProvider._onDidChangeTreeData.fire();
    }

    async getChildren(element?: iDeviceItem): Promise<iDeviceItem[]> {

        let read = await LKutils.shared.execute("idevice_id -l");

        this.deviceList = [];
        read.split("\n").forEach(element => {
            if (element === "") {
                return;
            }
            var found = false;
            for(var i = 0; i < this.deviceList.length; i++) {
               if (this.deviceList[i] === element) {
                   found = true;
                   break;
               }
            }
            if (!found) {
                this.deviceList.push(element);
            }
        });

        console.log("[*] Reloading device lists...");
        for(var i = 0; i < this.deviceList.length; i++) {
            console.log("    -> %s", this.deviceList[i]);
        }
        let wasADevice = false;
        let ret: Array<iDeviceItem> = [];
        this.deviceList.forEach(
            item => {
                let dev = new iDeviceItem(("ID: " + item.substring(0, 8).toUpperCase()), "", vscode.TreeItemCollapsibleState.None);
                ret.push(dev);
                wasADevice = true;
            }
        );
        if (!wasADevice) {
            ret = [new iDeviceItem("No Device Connected", "No Device Connected", vscode.TreeItemCollapsibleState.None)];
            ret[0].iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
        }
        return Promise.resolve(ret);
    }

}
