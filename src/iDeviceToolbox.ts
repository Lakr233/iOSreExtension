import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './iDevices';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';
import { writeFileSync } from 'fs';
import { url } from 'inspector';


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
        } else if (name === "Shutdown iProxy") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'kill.svg'));
        } else if (name === "Add iProxy") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'connect.svg'));
        } else if (name === "Install deb") {
            return vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'package.svg'));
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

    public static tools = ["Copy UDID", "Copy ECID", "Install deb", "sbreload", "ldrestart", "Safemode", "Shutdown iProxy", "Add iProxy"];
    public static nodeProvider: ToolboxNodeProvider;

    public static init() {
        const np = new ToolboxNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectionToolboxs', np);
        this.nodeProvider = np;
    }

    public performSelector(toolObject: ToolItem) {
        if (iDevices.shared.getDevice() === null) {
            vscode.window.showErrorMessage("iDevice not selected");
            return;
        }
        const vdev = iDevices.shared.getDevice() as iDeviceItem;
        if (toolObject.label === "Copy UDID") {
            vscode.window.showInformationMessage("UDID Copied + " + vdev?.udid.substring(0, 8) + "...");
            vscode.env.clipboard.writeText(vdev?.udid);
            return;
        }
        if (toolObject.label === "Copy ECID") {
            vscode.window.showInformationMessage("ECID Copied + " + vdev?.ecid + "...");
            vscode.env.clipboard.writeText(vdev?.ecid);
            return;
        }
        if (toolObject.label === "Install deb") {
            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                canSelectFolders: false,
                canSelectFiles: true,
                openLabel: 'deb pls',
                filters: {
                   'DEBIAN Package': ['deb']
                }
            };
            vscode.window.showOpenDialog(options).then((uri) => {
                if (uri === undefined || uri === null) {
                    return;
                }
                let selection = iDevices.shared.getDevice() as iDeviceItem;
                iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
                let terminal = vscode.window.createTerminal("Install DEB");
                terminal.show();
                let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
                writeFileSync(passpath, selection.iSSH_password);
                terminal.show();
                let script = "#!/bin/bash\n";
                let items = [];
                items.push(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
                items.push(" rm -f \'" + passpath + "\'");
                items.push(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
                items.push(" sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 \'rm -rf /var/mobile/Media/DEBIAN && mkdir -p /var/mobile/Media/DEBIAN\'");
                uri.forEach((sel) => {
                    items.push(" sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -r -P" + selection.iSSH_mappedPort + " \"" + sel.path + "\" \"root@127.0.0.1:/var/mobile/Media/DEBIAN\"");
                });
                items.push(" sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 \'dpkg -i  /var/mobile/Media/DEBIAN/*.deb\'");
                items.forEach((line) => {
                    script += line + "\n";
                });
                let scriptpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
                writeFileSync(scriptpath, script);
                terminal.sendText(" chmod +x \"" + scriptpath + "\"");
                terminal.sendText(" \"" + scriptpath + "\"");
            });
            return;
        }
        if (toolObject.label === "sbreload") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("sbreload");
            return;
        }
        if (toolObject.label === "ldrestart") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("( ldrestart & )");
            return;
        }
        if (toolObject.label === "Safemode") {
            iDeviceNodeProvider.nodeProvider.ensureiProxy(vdev);
            iDevices.shared.executeOnDevice("killall -SEGV SpringBoard");
            return;
        }
        if (toolObject.label === "Shutdown iProxy") {
            Object.keys(iDeviceNodeProvider.iProxyPool).forEach(element => {
                let child = iDeviceNodeProvider.iProxyPool[element]!;
                child.kill();
            });
            iDeviceNodeProvider.iProxyPool = {};
            iDeviceNodeProvider.nodeProvider.refresh();
            LKutils.shared.execute("killall iproxy"); // last thing because if some stderr job will kill over refresh
            return;
        }
        if (toolObject.label === "Add iProxy") {
            vscode.window.showInputBox({prompt: "Which port to map?"}).then((val => {
                let port = Number(val);
                let device = iDevices.shared.getDevice()!;
                let terminal = vscode.window.createTerminal("iProxy => " + String(port) + device.udid);
                terminal.show();
                terminal.sendText(" iproxy " + String(port) + " " + String(port) + " " + device.udid);
                terminal.sendText(" exit");
            }));
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
        ret.push(new ToolItem("SELECTED " + dev.udid.substr(0, 8).toLocaleUpperCase(), "", vscode.TreeItemCollapsibleState.None));
        ToolboxNodeProvider.tools.forEach((str) => {
            ret.push(new ToolItem(str, "", vscode.TreeItemCollapsibleState.None));
        });
        return ret;
    }
}
