import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './UserEnv';
import { utils } from 'mocha';
import { iDeviceItem } from './iDeviceConnections';

// tslint:disable-next-line: class-name
export class ApplicationItem extends vscode.TreeItem {

	constructor(
        public readonly label: string,
        public isinSubContext: Boolean,
        public infoObject: Array<string>,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
        super(label, collapsibleState);
        this.tooltip = infoObject[1];
    }

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'bundle.svg'));

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

    public performSelector(ApplicationObject: ApplicationItem) {
        if (!ApplicationObject.isinSubContext) {
            return;
        }
        if (ApplicationObject.label === "- Decrypt & Dump") {

            return;
        }
        vscode.env.clipboard.writeText(ApplicationObject.label);
        vscode.window.showInformationMessage("Cpoied Item: " + ApplicationObject.label);
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

        if (element) {
            let details: Array<ApplicationItem> = [];
            let pid:string = element.infoObject[2];
            if (pid !== "0") {
                let po = new ApplicationItem(pid, true, [], vscode.TreeItemCollapsibleState.None);
                po.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pid.svg'));
                details.push(po);
            }
            let id:string = element.infoObject[1];
            let bid = new ApplicationItem(id, true, [], vscode.TreeItemCollapsibleState.None);
            bid.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'xcode.svg'));
            details.push(bid);
            let dmp = new ApplicationItem("- Decrypt & Dump", true, [], vscode.TreeItemCollapsibleState.None);
            dmp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'exchange.svg'));
            details.push(dmp);
            return details;
        }

        let ret: ApplicationItem[] = [];
        if (iDevices.shared.getDevice() === null) {
            const piggy = new ApplicationItem("No Application", false, [], vscode.TreeItemCollapsibleState.None);
            piggy.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
            ret.push(piggy);
            return Promise.resolve(ret);
        }

        const pyb = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'py3' ,'lsapps.py')).path;
        let read = await LKutils.shared.python(pyb, iDevices.shared.getDevice()?.udid as string) as String;

        let haveApp = false;
        read.split("\n").forEach((item: string) => {
            const sp = item.split("|");
            if (item === "") {
                return;
            }
            if (sp.length < 3) {
                console.log("[E] Application descriptor invalid: " + item);
                return;
            }
            haveApp = true;
            if (Number(sp[2]) > 0) {
                ret.push(new ApplicationItem(sp[0], false, sp, vscode.TreeItemCollapsibleState.Collapsed));
            }
        });
        read.split("\n").forEach((item: string) => {
            if (item === "") {
                return;
            }
            const sp = item.split("|");
            if (sp.length < 3) {
                console.log("[E] Application descriptor invalid: " + item);
                return;
            }
            haveApp = true;
            if (Number(sp[2]) === 0) {
                ret.push(new ApplicationItem(sp[0], false, sp, vscode.TreeItemCollapsibleState.Collapsed));
            }
        });
        if (!haveApp) {
            const piggy = new ApplicationItem("No Application", false, [], vscode.TreeItemCollapsibleState.None);
            piggy.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
            ret.push(piggy);
        }
        return Promise.resolve(ret);
    }

}

