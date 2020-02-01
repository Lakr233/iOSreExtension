import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './UserEnv';
import { iDeviceItem } from './iDeviceConnections';

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
        if (name === "SSH Connect") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'shell.svg'));
        } else if (name === "Copy UDID" || name === "Copy ECID" ) {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'copy.svg'));
        }  else if (name === "Show Details" ) {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'info.svg'));
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

    public static tools = ["SSH Connect", "Copy UDID", "Copy ECID", "Show Details"];
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
        if (toolObject.label === "SSH Connect") {

        } else if (toolObject.label === "Copy UDID") {
            vscode.window.showInformationMessage("iOSre -> UDID Copied + " + vdev?.udid.substring(0, 8) + "...");
            vscode.env.clipboard.writeText(vdev?.udid);
        } else if (toolObject.label === "Copy ECID") {
            vscode.window.showErrorMessage("iOSre -> undefined tool called: " + toolObject.label);
        } else {
            vscode.window.showErrorMessage("iOSre -> undefined tool called: " + toolObject.label);
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
        return [];
        // return ToolboxNodeProvider.tools.map (
        //     item => new ToolItem(item, item, vscode.TreeItemCollapsibleState.None)
        // );
    }
}
