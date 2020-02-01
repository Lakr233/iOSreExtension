import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './UserEnv';

// tslint:disable-next-line: class-name
export class ApplicationItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
        public readonly bundleID: string,
        public readonly bundlePath: String,
        public readonly documentPath: String,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
        super(label, collapsibleState);
        this.tooltip = bundleID;
    }

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'xcode.svg'));

    command = {
        title: this.label,
        command: 'ApplicationSelected',
        arguments: [
            this,
        ]
    };

}

// tslint:disable-next-line: class-name
export class ApplicationNodeProvider implements vscode.TreeDataProvider<ApplicationItem> {

    public deviceList: Array<string> = []; // 储存udid
    public static nodeProvider: ApplicationNodeProvider;

    public static init() {
        const np = new ApplicationNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectionApplications', np);
        vscode.commands.registerCommand("iosreIDtabSectionApplications.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
    }

	private _onDidChangeTreeData: vscode.EventEmitter<ApplicationItem> = new vscode.EventEmitter<ApplicationItem>();
    readonly onDidChangeTreeData: vscode.Event<ApplicationItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: ApplicationItem): vscode.TreeItem {
        return element;
    }

    refresh() {
        ApplicationNodeProvider.nodeProvider._onDidChangeTreeData.fire();
    }

    async getChildren(element?: ApplicationItem): Promise<ApplicationItem[]> {
        let ret: ApplicationItem[] = [];

        if (iDevices.shared.getDevice() === null) {
            ret.push(new ApplicationItem("No iDevice Selected", "", "", "", vscode.TreeItemCollapsibleState.None));
            return Promise.resolve(ret);
        }

        return Promise.resolve(ret);
    }

}

