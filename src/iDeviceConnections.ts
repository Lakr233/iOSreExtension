import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';

// tslint:disable-next-line: class-name
export class iDeviceItem extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ){
        super(label, collapsibleState);
    }

    command = {
        title: this.label,                  // 标题
        command: 'iDeviceItemClick',        // 命令 ID
        tooltip: this.label,                // 鼠标覆盖时的小小提示框
        arguments: [                        // 向 registerCommand 传递的参数。
            this.label,                     // 目前这里我们只传递一个 label
        ]
    };

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ios.svg'));

}

// tslint:disable-next-line: class-name
export class iDeviceNodeProvider implements vscode.TreeDataProvider<iDeviceItem> {

    public deviceList: Array<string> = []; // 储存udid
    public static nodeProvider: iDeviceNodeProvider;

    public static init() {
        const np = new iDeviceNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectioniDevices', np);
        this.nodeProvider = np;
    }

    onDidChangeTreeData?: vscode.Event<iDeviceItem | null | undefined> | undefined;
    getTreeItem(element: iDeviceItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: iDeviceItem | undefined): Promise<iDeviceItem[]> {

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
        return this.deviceList.map(
            item => new iDeviceItem(
                ("ID: " + item.substring(0, 8).toUpperCase()), vscode.TreeItemCollapsibleState.None
            )
        );
    }

}
