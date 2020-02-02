import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './iDevices';
import { utils } from 'mocha';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';
import { openSync, writeFileSync, realpath, read } from 'fs';
import { execSync } from 'child_process';

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
            vscode.window.showInformationMessage("Continue Dump " + ApplicationObject.infoObject[0] + " ?", "Sure", "Cancel").then((str) => {
                if (str !== "Sure") {
                    return;
                }
                let selection = iDevices.shared.getDevice() as iDeviceItem;
                iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
                let terminal = vscode.window.createTerminal("Decrypt => " + ApplicationObject.infoObject[1]);
                terminal.show();
                let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
                writeFileSync(passpath, selection.iSSH_password);
                terminal.show();
                let aopen = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'iOS' ,'open'));
                let binpath = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'py3' ,'dump_oem.py'));
                let terminalCommands: Array<string> = [];
                terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
                terminalCommands.push("rm -f \'" + passpath + "\'");
                terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\"");
                terminalCommands.push("sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -P" + selection.iSSH_mappedPort + " " + aopen.path + " root@127.0.0.1:/bin/");
                terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 \'ldid -S /bin/ &> /dev/null\'");
                terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 /bin/open " + ApplicationObject.infoObject[1]);
                terminalCommands.push("mkdir -p ~/Documents/iOSre");
                terminalCommands.push("rm -rf ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                terminalCommands.push("rm -f ~/Documents/iOSre/" + ApplicationObject.infoObject[1] + ".ipa");
                terminalCommands.push(binpath.path + " " + selection.udid + " " + ApplicationObject.infoObject[1] + " $SSHPASSWORD " + selection.iSSH_mappedPort + " ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                terminalCommands.push("mkdir ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                terminalCommands.push("cd ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                terminalCommands.push("unzip ../" + ApplicationObject.infoObject[1] + ".ipa");
                let bashScript = "";
                let bashpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
                terminalCommands.forEach((cmd) => {
                    bashScript += "\n";
                    bashScript += cmd;
                });
                writeFileSync(bashpath, bashScript, 'utf8');
                terminal.sendText("/bin/bash -C \'" + bashpath + "\' && exit");
                vscode.window.onDidCloseTerminal((isthisone) => {
                    if (isthisone.name === "Decrypt => " + ApplicationObject.infoObject[1]) {
                        vscode.window.showInformationMessage("iOSre -> Decrypt " + ApplicationObject.infoObject[0] + " has finished", "open").then((selection) => {
                            if (selection === "open") {
                                LKutils.shared.execute("open ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                            }
                        });
                    }
                });
            });
            return;
        }
        if (ApplicationObject.label === "- dyld Start") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Starting => " + ApplicationObject.infoObject[1]);
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            let aopen = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'iOS' ,'open'));
            let terminalCommands: Array<string> = [];
            terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminalCommands.push("rm -f \'" + passpath + "\'");
            terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\"");
            terminalCommands.push("sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -P" + selection.iSSH_mappedPort + " " + aopen.path + " root@127.0.0.1:/bin/");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 \'ldid -S /bin/ &> /dev/null\'");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 /bin/open " + ApplicationObject.infoObject[1]);
            let bashScript = "";
            let bashpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            terminalCommands.forEach((cmd) => {
                bashScript += "\n";
                bashScript += cmd;
            });
            writeFileSync(bashpath, bashScript, 'utf8');
            terminal.sendText("/bin/bash -C \'" + bashpath + "\' && exit");
            vscode.window.onDidCloseTerminal((isthisone) => {
                if (isthisone.name === "Starting => " + ApplicationObject.infoObject[1]) {
                    this.refresh();
                }
            });
            return;
        }
        if (ApplicationObject.label === "- Terminate") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Terminate => " + ApplicationObject.infoObject[1]);
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            let aopen = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'iOS' ,'open'));
            let terminalCommands: Array<string> = [];
            terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminalCommands.push("rm -f \'" + passpath + "\'");
            terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\"");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p 2222 root@127.0.0.1 kill -9 " + ApplicationObject.infoObject[2]);
            let bashScript = "";
            let bashpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            terminalCommands.forEach((cmd) => {
                bashScript += "\n";
                bashScript += cmd;
            });
            writeFileSync(bashpath, bashScript, 'utf8');
            terminal.sendText("/bin/bash -C \'" + bashpath + "\' && exit");
            vscode.window.onDidCloseTerminal((isthisone) => {
                if (isthisone.name === "Terminate => " + ApplicationObject.infoObject[1]) {
                    this.refresh();
                }
            });
            return;
        }
        if (ApplicationObject.label === "- Watch Logs") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Watch => " + ApplicationObject.infoObject[1]);
            terminal.show();
            let readps = iDevices.shared.executeOnDevice("ps -e");
            let processName: string | undefined;
            readps.split("\n").forEach((line) => {
                if (line.startsWith(String(ApplicationObject.infoObject[2]))) {
                    let sp = line.split("/");
                    let name = sp[sp.length - 1];
                    console.log("[*] Captured name : " + name);
                    processName = name;
                }
            });
            if (processName === undefined) {
                vscode.window.showErrorMessage("iOSre -> Error obtain executable name: " + ApplicationObject.infoObject[1]);
                return;
            }
            let watcherbin = vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'local' ,'idsyslog'));
            execSync("chmod +x \'" + watcherbin.path + "\'");
            terminal.sendText("\'" + watcherbin.path + "\' " + selection.udid + " \'" + processName + "\'");
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
                po.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'id.svg'));
                details.push(po);
            }
            let id:string = element.infoObject[1];
            let bid = new ApplicationItem(id, true, [], vscode.TreeItemCollapsibleState.None);
            bid.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'xcode.svg'));
            details.push(bid);
            let start = new ApplicationItem("- dyld Start", true, [], vscode.TreeItemCollapsibleState.None);
            start.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'rocket.svg'));
            start.infoObject = element.infoObject;
            details.push(start);
            if (Number(element.infoObject[2]) > 0) {
                let stop = new ApplicationItem("- Terminate", true, [], vscode.TreeItemCollapsibleState.None);
                stop.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'terminate.svg'));
                stop.infoObject = element.infoObject;
                details.push(stop);
                let log = new ApplicationItem("- Watch Logs", true, [], vscode.TreeItemCollapsibleState.None);
                log.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'log.svg'));
                log.infoObject = element.infoObject;
                details.push(log);
            }
            let dmp = new ApplicationItem("- Decrypt & Dump", true, [], vscode.TreeItemCollapsibleState.None);
            dmp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'exchange.svg'));
            dmp.infoObject = element.infoObject;
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
        let sp = read.split("\n");
        sp = sp.sort((obj1: string, obj2: string) => {
            let x1 = obj1.split("|");
            let x2 = obj2.split("|");
            if (x1.length < 3 || x2.length < 3) {
                return 1;
            }
            if (x1[0] < x2[0]) {
                return -1;
            }
            return 1;
        });
        sp.forEach((item: string) => {
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

