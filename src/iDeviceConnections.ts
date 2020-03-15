import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './iDevices';
import { ApplicationItem, ApplicationNodeProvider } from './iDeviceApplications';
import { writeFileSync } from 'fs';
import { exec, ChildProcess } from 'child_process';
import { LKBootStrap } from './LKBootstrap';
import { FileSystemNodeProvider } from './iDeviceFileSystem';

// tslint:disable-next-line: class-name
export class iDeviceItem extends vscode.TreeItem {

    iSSH_devicePort = 22;
    iSSH_mappedPort = 2222;
    iSSH_password   = "alpine";
    iSSH_iProxyPID  = 0;

	constructor(
		public readonly label: string,
        public readonly udid: string,
        public readonly ecid: string,
        public readonly isinSubContext: Boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
        super(label, collapsibleState);
        if (udid !== "") {
            this.tooltip = udid;
        }
    }

    father: iDeviceItem | undefined;

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ios.svg'));

    command = {
        title: this.label,
        command: 'iDeviceSelect',
        tooltip: this.udid,
        arguments: [
            this,
        ]
    };

}

// tslint:disable-next-line: class-name
export class iDeviceNodeProvider implements vscode.TreeDataProvider<iDeviceItem> {

    public deviceInfoList: Array<string> = []; // 储存udid
    public static nodeProvider: iDeviceNodeProvider;
    public static iProxyPool: {[key: string]: ChildProcess} = {};

    public static init() {
        const np = new iDeviceNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectioniDevices', np);
        vscode.commands.registerCommand("iosreIDtabSectioniDevices.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
    }

    public async performSelector(iDeviceObject: iDeviceItem) {
        if (!iDeviceObject.isinSubContext) {
            iDevices.shared.setDevice(iDeviceObject);
            return;
        }
        if (iDeviceObject.label.startsWith("Set devicePort:")) {
            vscode.window.showInputBox({prompt: "Set on device SSH port, default to 22"}).then((val => {
                let port = Number(val);
                if (port < 1) {
                    port = 22;
                }
                LKutils.shared.saveKeyPairValue(iDeviceObject.udid + "iSSH_devicePort", String(port));
                this.refresh();
                iDevices.shared.bootstrapDeviceConfig();
            }));
            return;
        }
        if (iDeviceObject.label.startsWith("Set mappedPort:")) {
            vscode.window.showInputBox({prompt: "Set local linker SSH port, default to 2222"}).then((val => {
                let port = Number(val);
                if (port < 1) {
                    port = 2222;
                }
                LKutils.shared.saveKeyPairValue(iDeviceObject.udid + "iSSH_mappedPort", String(port));
                this.refresh();
                iDevices.shared.bootstrapDeviceConfig();
            }));
            return;
        }
        if (iDeviceObject.label.startsWith("Set root Password")) {
            vscode.window.showInputBox({prompt: "Set SSH password for this device, default to alpine"}).then((val => {
                let pass = val;
                if (pass === undefined || pass === "") {
                    pass = "alpine";
                }
                LKutils.shared.saveKeyPairValue(iDeviceObject.udid + "iSSH_password", pass);
                this.refresh();
                iDevices.shared.bootstrapDeviceConfig();
            }));
            return;
        }
        if (iDeviceObject.label.startsWith("iProxy:")) {
            let element = iDeviceObject.father as iDeviceItem;
            if (iDeviceNodeProvider.iProxyPool[element.udid] === undefined) {
                this.ensureiProxy(element);
            } else {
                iDeviceNodeProvider.iProxyPool[element.udid].kill();
                delete iDeviceNodeProvider.iProxyPool[element.udid];
            }
            this.refresh();
            iDevices.shared.bootstrapDeviceConfig();
            return;
        }
        if (iDeviceObject.label.startsWith("SSH Connect")) {
            iDevices.shared.bootstrapDeviceConfig();
            let element = iDeviceObject.father as iDeviceItem;
            this.ensureiProxy(element);
            let terminal = vscode.window.createTerminal("SSH =>" + element.label);
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, element.iSSH_password);
            terminal.show();
            // iDevices.executionLock = true;
            terminal.sendText(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminal.sendText(" rm -f \'" + passpath + "\'");
            terminal.sendText(" ssh-keygen -R \"[127.0.0.1]:" + element.iSSH_mappedPort + "\" &> /dev/null");
            terminal.sendText(" sshpass -p $SSHPASSWORD ssh root@127.0.0.1 -oStrictHostKeyChecking=no -p " + element.iSSH_mappedPort);
            // iDevices.executionLock = false;
            return;
        }
    }

    public ensureiProxy(element: iDeviceItem) {
        if (iDeviceNodeProvider.iProxyPool[element.udid] === undefined) {
            let dp = (element).iSSH_devicePort;
            let mp = (element).iSSH_mappedPort;
            console.log("[*] Starting iProxy " + mp + " " + dp + " " + element.udid + " &");
            let execObject = exec("iproxy " + mp + " " + dp + " " + element.udid + "", (err, stdout, stderr) => {
                console.log(stdout + stderr);
                this.refresh();
            });
            iDeviceNodeProvider.iProxyPool[element.udid] = execObject;
            this.refresh();
            ApplicationNodeProvider.nodeProvider.refresh();
            FileSystemNodeProvider.nodeProvider.refresh();
        }
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

        if (element !== undefined && !(element as iDeviceItem).isinSubContext) {

            let device = element;
            device.iSSH_devicePort = Number(LKutils.shared.readKeyPairValue(device.udid + "iSSH_devicePort"));
            device.iSSH_mappedPort = Number(LKutils.shared.readKeyPairValue(device.udid + "iSSH_mappedPort"));
            device.iSSH_password = LKutils.shared.readKeyPairValue(device.udid + "iSSH_password");
    
            // VAILD THIS CONFIG FIRST
            if (isNaN(device.iSSH_devicePort) || device.iSSH_devicePort < 1 || device.iSSH_devicePort > 65533) {
                device.iSSH_devicePort = 22;
                LKutils.shared.saveKeyPairValue(device.udid + "iSSH_devicePort", "22");
            }
            if (isNaN(device.iSSH_mappedPort) || device.iSSH_mappedPort < 1 || device.iSSH_mappedPort > 65533) {
                device.iSSH_mappedPort = 2222;
                LKutils.shared.saveKeyPairValue(device.udid + "iSSH_mappedPort", "2222");
            }
            if (device.iSSH_password === "") {
                device.iSSH_password = "alpine";
                LKutils.shared.saveKeyPairValue(device.udid + "iSSH_password", "alpine");
            }

            let details: Array<iDeviceItem> = [];
            let sshp = new iDeviceItem("Set devicePort: " + device.iSSH_devicePort, device.udid, device.ecid, true, vscode.TreeItemCollapsibleState.None);
            sshp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ports.svg'));
            details.push(sshp);
            let sshpp = new iDeviceItem("Set mappedPort: " + device.iSSH_mappedPort, device.udid, device.ecid, true, vscode.TreeItemCollapsibleState.None);
            sshpp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ports.svg'));
            details.push(sshpp);
            let pass = new iDeviceItem("Set root Password ", device.udid, device.ecid, true, vscode.TreeItemCollapsibleState.None);
            pass.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'password.svg'));
            details.push(pass);
            let pp = new iDeviceItem("iProxy: " + device.iSSH_iProxyPID, device.udid, device.ecid, true, vscode.TreeItemCollapsibleState.None);
            pp.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'id.svg'));
            pp.father = element;
            details.push(pp);
            let ssh = new iDeviceItem("SSH Connect ", device.udid, device.ecid, true, vscode.TreeItemCollapsibleState.None);
            ssh.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'shell.svg'));
            ssh.father = element;
            details.push(ssh);
            return details;
        }

        let lsd = "\'" + LKBootStrap.shared.getBinPath() + "/bins/local/lsdevs\'"; //vscode.Uri.file(join(__filename,'..', '..' ,'src', 'bins', 'local', 'lsdevs')).path;
        let read = await LKutils.shared.execute(lsd);

        this.deviceInfoList = [];
        read.split("\n").forEach(element => {
            if (element === "") {
                return;
            }
            var found = false;
            for(var i = 0; i < this.deviceInfoList.length; i++) {
               if (this.deviceInfoList[i] === element) {
                   found = true;
                   break;
               }
            }
            if (!found) {
                this.deviceInfoList.push(element);
            }
        });

        console.log("[*] Reloading device lists...");
        for(var i = 0; i < this.deviceInfoList.length; i++) {
            console.log("    -> %s", this.deviceInfoList[i]);
        }
        let wasADevice = 0;
        let foundSelectedDevice: iDeviceItem | undefined;
        let privSelected = iDevices.shared.getDevice();
        let ret: Array<iDeviceItem> = [];
        this.deviceInfoList.forEach(
            item => {
                let elements = item.split("|");
                let dev: iDeviceItem | undefined;
                if (elements.length === 1) {
                    let udid = elements[0];
                    dev = new iDeviceItem(("ID: " + item.substring(0, 8).toUpperCase()), udid, "", false, vscode.TreeItemCollapsibleState.Expanded);
                    ret.push(dev);
                } else if (elements.length === 2) {
                    let udid = elements[0];
                    let ecid = elements[1];
                    dev = new iDeviceItem(("ID: " + item.substring(0, 8).toUpperCase()), udid, ecid, false, vscode.TreeItemCollapsibleState.Expanded);
                    ret.push(dev);
                } else if (elements.length === 3) {
                    let udid = elements[0];
                    let ecid = elements[1];
                    let name = elements[2];
                    dev = new iDeviceItem(name, udid, ecid, false, vscode.TreeItemCollapsibleState.Expanded);
                    ret.push(dev);
                } else {
                    return;
                }
                wasADevice += 1;
                if (privSelected !== null && (privSelected as iDeviceItem).udid === elements[0]) {
                    foundSelectedDevice = dev;
                }
                // let readdevport = LKutils.shared.readKeyPairValue(dev.udid + "iSSH_devicePort");
                // if (readdevport === undefined || readdevport === "" || Number(readdevport) < 1) {
                //     dev.iSSH_devicePort = 22;
                // } else {
                //     dev.iSSH_devicePort = Number(readdevport);
                // }
                // let readmapport = LKutils.shared.readKeyPairValue(dev.udid + "iSSH_mappedPort");
                // if (readmapport === undefined || readmapport === "" || Number(readmapport) < 1) {
                //     dev.iSSH_mappedPort = 2222;
                // } else {
                //     dev.iSSH_mappedPort = Number(readmapport);
                // }
                // let password = LKutils.shared.readKeyPairValue(dev.udid + "iSSH_password");
                // if (password === undefined || password === "") {
                //     dev.iSSH_password = password;
                // } else {
                //     dev.iSSH_password = password;
                // }
                if (iDeviceNodeProvider.iProxyPool[dev.udid] !== undefined) {
                    dev.iSSH_iProxyPID = iDeviceNodeProvider.iProxyPool[dev.udid].pid;
                }
            }
        );
        if (wasADevice === 0) {
            ret = [new iDeviceItem("No Device Connected", "", "", false, vscode.TreeItemCollapsibleState.None)];
            ret[0].iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
        } else if (wasADevice === 1) {
            iDevices.shared.setDevice(ret[0]);
            iDevices.shared.bootstrapDeviceConfig();
        }
        if (foundSelectedDevice === undefined && privSelected !== null) {
            iDevices.shared.setDevice(null);
        } else if (foundSelectedDevice !== undefined) {
            iDevices.shared.setDevice(foundSelectedDevice);
            iDevices.shared.bootstrapDeviceConfig();
        }

        return Promise.resolve(ret);
    }

}

