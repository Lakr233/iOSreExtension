import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './iDevices';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';

export class ToolItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
        super(label, collapsibleState);
        this.iconPath = this.getToolIcon(label);
    }

    private getToolIcon(name: String): vscode.Uri {
        if (name === "Copy UDID" || name === "Copy ECID") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'copy.svg'));
        }  else if (name === "sbreload" || name === "ldrestart") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'reload.svg'));
        } else if (name === "Safemode") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'safe.svg'));
        } else {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ios.svg'));
        }
    }

    command = {
        title: this.label,
        command: 'ToolboxCalled',
        tooltip: this.label,
        arguments: [
            this,
        ]
    };

}

export class ToolboxNodeProvider implements vscode.TreeDataProvider<ToolItem> {

    public static tools = ["Copy UDID", "sbreload", "ldrestart", "Safemode"];
    public static nodeProvider: ToolboxNodeProvider;

    public static init() {
        const np = new ToolboxNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectionToolboxs', np);
        this.nodeProvider = np;
    }

    public performSelector(toolObject: ToolItem) {
        if (iDevices.shared.getDevice() === null) {
            vscode.window.showErrorMessage("iOSre -> iDevice not selected");
            return;
        }
        const vdev = iDevices.shared.getDevice() as iDeviceItem;
        if (toolObject.label === "Copy UDID") {
            vscode.window.showInformationMessage("iOSre -> UDID Copied + " + vdev?.udid.substring(0, 8) + "...");
            vscode.env.clipboard.writeText(vdev?.udid);
            return;
        }
        if (toolObject.label === "sbreload") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("sbreload");
            return;
        }
        if (toolObject.label === "ldrestart") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("ldrestart &");
            return;
        }
        if (toolObject.label === "Safemode") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("killall -SEGV SpringBoard");
            return;
        }
    }

	private _onDidChangeTreeData: vscode.EventEmitter<ToolItem> = new vscode.EventEmitter<ToolItem>();
    readonly onDidChangeTreeData: vscode.Event<ToolItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: ToolItem): vscode.TreeItem {
        return element;
    }

    refresh() {
        ToolboxNodeProvider.nodeProvider._onDidChangeTreeData.fire();
    }

    getChildren(element?: ToolItem | undefined): vscode.ProviderResult<ToolItem[]> {

        let dev = iDevices.shared.getDevice();
        if (dev === undefined || dev === null) {
            return [new ToolItem("NO SELECTION", "", vscode.TreeItemCollapsibleState.None)];
        }

        let ret: Array<ToolItem> = [];
        ret.push(new ToolItem("-> " + dev.label, "", vscode.TreeItemCollapsibleState.None));
        ToolboxNodeProvider.tools.forEach((str) => {
            ret.push(new ToolItem(str, "", vscode.TreeItemCollapsibleState.None));
        });
        return ret;
    }
}
