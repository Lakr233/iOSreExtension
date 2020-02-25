import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './iDevices';
import { utils } from 'mocha';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';
import { openSync, writeFileSync, realpath, read } from 'fs';
import { execSync } from 'child_process';
import { LKBootStrap } from './LKBootstrap';
import { setFlagsFromString } from 'v8';
import { brotliCompressSync } from 'zlib';

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
        this.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'bundle.svg'));

        if (infoObject.length > 3) {
            let tryImageUri = vscode.Uri.parse(infoObject[3]);
            if (tryImageUri !== undefined && tryImageUri !== null) {
                this.iconPath = tryImageUri;
            }
        }
    }


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
    public static spPIDcache: Number;

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
                let aopen = "\'" + LKBootStrap.shared.getBinPath() + "/bins/iOS/open\'"; // vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'iOS' ,'open'));
                let binpath = "\'" + LKBootStrap.shared.getBinPath() + "/bins/py3/dump_oem.py\'"; // vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'py3' ,'dump_oem.py'));
                let terminalCommands: Array<string> = [];
                terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
                terminalCommands.push("rm -f \'" + passpath + "\'");
                terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
                terminalCommands.push("sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -P" + selection.iSSH_mappedPort + " " + aopen + " root@127.0.0.1:/bin/");
                terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 \'ldid -S /bin/ &> /dev/null\'");
                terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 /bin/open " + ApplicationObject.infoObject[1]);
                terminalCommands.push("mkdir -p ~/Documents/iOSre");
                terminalCommands.push("rm -rf ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
                terminalCommands.push("rm -f ~/Documents/iOSre/" + ApplicationObject.infoObject[1] + ".ipa");
                terminalCommands.push(binpath + " " + selection.udid + " " + ApplicationObject.infoObject[1] + " $SSHPASSWORD " + selection.iSSH_mappedPort + " ~/Documents/iOSre/" + ApplicationObject.infoObject[1]);
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
        if (ApplicationObject.label === "- dyld Start" || ApplicationObject.label === "- Open") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Starting => " + ApplicationObject.infoObject[1]);
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            let aopen = "\'" + LKBootStrap.shared.getBinPath() + "/bins/iOS/open\'";
            let terminalCommands: Array<string> = [];
            terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminalCommands.push("rm -f \'" + passpath + "\'");
            terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
            terminalCommands.push("sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -P" + selection.iSSH_mappedPort + " " + aopen + " root@127.0.0.1:/bin/");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 \'ldid -S /bin/ &> /dev/null\'");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 /bin/open " + ApplicationObject.infoObject[1]);
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
            let terminalCommands: Array<string> = [];
            terminalCommands.push("export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminalCommands.push("rm -f \'" + passpath + "\'");
            terminalCommands.push("ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\"");
            terminalCommands.push("sshpass -p $SSHPASSWORD ssh -o StrictHostKeyChecking=no -p " + selection.iSSH_mappedPort + " root@127.0.0.1 kill -9 " + ApplicationObject.infoObject[2]);
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
                let dude = line;
                while (dude.startsWith(" ")) {
                    dude = dude.substring(1, dude.length);
                }
                if (dude.startsWith(String(ApplicationObject.infoObject[2]))) {
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
            let watcherbin = "\'" + LKBootStrap.shared.getBinPath() + "/bins/local/idsyslog\'"; // vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'local' ,'idsyslog'));
            terminal.sendText("" + watcherbin + " " + selection.udid + " \'" + processName + "\'");
            return;
        }
        if (ApplicationObject.label === "- Debugger > Frida") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Frida => " + ApplicationObject.infoObject[1]);
            terminal.show();
            terminal.sendText("frida --device=" + selection.udid + " -p " + ApplicationObject.infoObject[2]);
            return;
        }
        if (ApplicationObject.label === "- Debugger > lldb") {
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("lldb => " + ApplicationObject.infoObject[1]);
            let randport = Math.floor(Math.random() * 2000) + 2000;
            iDevices.shared.executeOnDeviceAsync("debugserver localhost:" + String(randport) + " --attach=" + ApplicationObject.infoObject[2] + " &");
            terminal.show();
            terminal.sendText("echo 'If anything went wrong, make sure to have debugserver installed on your iDevice then restart the app and try again'");
            terminal.sendText("iproxy " + String(randport) + " " + String(randport) + " &");
            terminal.sendText("lldb");
            execSync("sleep 3");
            terminal.sendText("process connect connect://127.0.0.1:" + String(randport) + "");
            return;
        }
        vscode.env.clipboard.writeText(ApplicationObject.label);
        vscode.window.showInformationMessage("Cpoied Item: " + ApplicationObject.label);
    }

	private _onDidChangeTreeData: vscode.EventEmitter<ApplicationItem> = new vscode.EventEmitter<ApplicationItem>();
    readonly onDidChangeTreeData: vscode.Event<ApplicationItem | undefined> = this._onDidChangeTreeData.event;


    private treeItemCache: Array<ApplicationItem> = [];

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
            if (element.label !== "SpringBoard") {
                if (pid !== "0") {
                    let start = new ApplicationItem("- Open", true, [], vscode.TreeItemCollapsibleState.None);
                    start.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'rocket.svg'));
                    start.infoObject = element.infoObject;
                    details.push(start);
                } else {
                    let start = new ApplicationItem("- dyld Start", true, [], vscode.TreeItemCollapsibleState.None);
                    start.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'rocket.svg'));
                    start.infoObject = element.infoObject;
                    details.push(start);
                }
            }
            if (Number(element.infoObject[2]) > 0) {
                let stop = new ApplicationItem("- Terminate", true, [], vscode.TreeItemCollapsibleState.None);
                stop.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'terminate.svg'));
                stop.infoObject = element.infoObject;
                details.push(stop);
                let log = new ApplicationItem("- Watch Logs", true, [], vscode.TreeItemCollapsibleState.None);
                log.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'log.svg'));
                log.infoObject = element.infoObject;
                details.push(log);
                let frida = new ApplicationItem("- Debugger > Frida", true, [], vscode.TreeItemCollapsibleState.None);
                frida.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'debug.svg'));
                frida.infoObject = element.infoObject;
                details.push(frida);
                let lldb = new ApplicationItem("- Debugger > lldb", true, [], vscode.TreeItemCollapsibleState.None);
                lldb.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'debug.svg'));
                lldb.infoObject = element.infoObject;
                details.push(lldb);
            }
            if (element.label !== "SpringBoard") {
                let dmp = new ApplicationItem("- Decrypt & Dump", true, [], vscode.TreeItemCollapsibleState.None);
                dmp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'exchange.svg'));
                dmp.infoObject = element.infoObject;
                details.push(dmp);
            }
            return details;
        }

        if (this.treeItemCache.length > 0) {
            let copy = this.treeItemCache;
            this.treeItemCache = [];
            return copy;
        }

        let ret: ApplicationItem[] = [];
        if (iDevices.shared.getDevice() === null) {
            const piggy = new ApplicationItem("No Application", false, [], vscode.TreeItemCollapsibleState.None);
            piggy.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
            ret.push(piggy);
            return Promise.resolve(ret);
        }

        const pyb = "\'" + LKBootStrap.shared.getBinPath() + "/bins/py3/lsapps.py\'"; // vscode.Uri.file(join(__filename,'..', '..' ,'src' ,'bins' ,'py3' ,'lsapps.py')).path;
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
            return Promise.resolve(ret);
        }

        this.loadSpringBoard(ret);

        return Promise.resolve(ret);
    }

    async loadSpringBoard(pass: Array<ApplicationItem>) {
        let ret = pass;
        let spbInfo = ["SpringBoard", "com.apple.springboard", "Faild Getting PID",
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB20lEQVQ4T6WSvWsUURTFz3lkhYBBEBZLYWcImBnFaCM2EUlhZSr/gDS2AYm6OxNMBPclgiCpBCsFQdBOCxsx2oiIiu7uENCZGEGws1EUv96RmXFDXLbY6O3eO+f93rmXS/xnMX+/6jcmBuX8hIo3ee1Nlx6yXYsWaEhIewaBCDlBX0l+cXC3CoABFKzZ84MAup7Ei2cdfz37Z0Dbb0SAHpctECbM7LktJahF8864R2UCshJkzbgfIPHnjktuGdA6YJ4COkNqCo7jBSCpRfMyGA5TW+8H6HjRW9FMG6gKpzFR9wHeoHBtAwBye5A1T/cCOl58EtBsmNnRllc/mOv7sqXniRe9FnElTO3lboIdYWpPbQa0/foRylxwcDPk0IhxbsIZcAha+SF9NuAlB14vAKB2BtniTB/A3TCzIy0/nqLTeK4boxdBunin4zVWAHOzTABURa3nw4RTBWC5bURFwmS4Zg+V7QBh1rzaqUVPCNzLd6cwJl79mGC+iU69czAyk0Fm5xI/PpFrQdq83fGiB2Fmj5Z//Km2Fx821IIc3nTvRASQ3pMcBWgA9wniMIjVMLPTfwHywys/OtCb4GO6rbVr9/fq2Dv7Idde+meD/enFpOvbSLCVLdzs/Q0NO9PSniFXWwAAAABJRU5ErkJggg=="];
        let spb = new ApplicationItem("SpringBoard", false, spbInfo, vscode.TreeItemCollapsibleState.Collapsed);
        let resort = [spb];
        let byVal = [spb];
        byVal = []; // remove sp for a while.
        ret.forEach((item) => {
            resort.push(item);
            byVal.push(item);
        });
        this.treeItemCache = resort;
        this.refresh();
        this.getSpringBoardPIDIfAvailable(byVal);
    }

    public getSpringBoardPIDIfAvailable(cacheItem: Array<ApplicationItem>) {
        let str = String(this.getPIDviaProcessName("SpringBoard"));
        let spbInfo = ["SpringBoard", "com.apple.springboard", str,
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB20lEQVQ4T6WSvWsUURTFz3lkhYBBEBZLYWcImBnFaCM2EUlhZSr/gDS2AYm6OxNMBPclgiCpBCsFQdBOCxsx2oiIiu7uENCZGEGws1EUv96RmXFDXLbY6O3eO+f93rmXS/xnMX+/6jcmBuX8hIo3ee1Nlx6yXYsWaEhIewaBCDlBX0l+cXC3CoABFKzZ84MAup7Ei2cdfz37Z0Dbb0SAHpctECbM7LktJahF8864R2UCshJkzbgfIPHnjktuGdA6YJ4COkNqCo7jBSCpRfMyGA5TW+8H6HjRW9FMG6gKpzFR9wHeoHBtAwBye5A1T/cCOl58EtBsmNnRllc/mOv7sqXniRe9FnElTO3lboIdYWpPbQa0/foRylxwcDPk0IhxbsIZcAha+SF9NuAlB14vAKB2BtniTB/A3TCzIy0/nqLTeK4boxdBunin4zVWAHOzTABURa3nw4RTBWC5bURFwmS4Zg+V7QBh1rzaqUVPCNzLd6cwJl79mGC+iU69czAyk0Fm5xI/PpFrQdq83fGiB2Fmj5Z//Km2Fx821IIc3nTvRASQ3pMcBWgA9wniMIjVMLPTfwHywys/OtCb4GO6rbVr9/fq2Dv7Idde+meD/enFpOvbSLCVLdzs/Q0NO9PSniFXWwAAAABJRU5ErkJggg=="];
        let spb = new ApplicationItem("SpringBoard", false, spbInfo, vscode.TreeItemCollapsibleState.Collapsed);
        let sort = [spb];
        cacheItem.forEach((item) => {
            sort.push(item);
        });
        this.treeItemCache = sort;
        this.refresh();
    }

    public getPIDviaProcessName(name: String): String {
        if (name === undefined || name === null) {
            return "0";
        }
        let device = iDevices.shared.getDevice();
        if (device === undefined || iDeviceNodeProvider.iProxyPool[device!.udid] === undefined) {
            // Do nothing if there is no iProxy instance
            return "iProxy Required";
        }
        let nameRead: string = name.toLowerCase();
        let selection = iDevices.shared.getDevice() as iDeviceItem;
        iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
        let readps = iDevices.shared.executeOnDevice("ps -e");
        let processName: string | undefined;
        let items = readps.split("\n");
        for (const index in items) {
            let trimmed = items[index];
            while (trimmed.endsWith(" ")) {
                trimmed = trimmed.substr(0, trimmed.length - 1);
            }
            while (trimmed.startsWith(" ")) {
                trimmed = trimmed.substr(1, trimmed.length);
            }
            if (trimmed.toLocaleLowerCase().endsWith(nameRead)) {
                let pidstr = trimmed.split(" ")[0];
                console.log("[*] -> " + nameRead + " has PID " + pidstr);
                return pidstr;
            }
        }
        vscode.window.showErrorMessage("iOSre -> SSH Connection Invalid");
        return "0";
    }

}

