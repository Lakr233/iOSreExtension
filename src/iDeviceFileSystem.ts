import * as vscode from 'vscode';
import { join } from 'path';
import { iDevices } from './iDevices';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';
import { LKutils } from './Utils';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { writeFileSync } from 'fs';
import { URL } from 'url';

export class FileItem extends vscode.TreeItem {

    // used for caches and future use
    public infoObject: {[key: string]: string} = {};
    public iconPath = this.collapsibleState === vscode.TreeItemCollapsibleState.None ? join(__filename, '..', '..', 'res', 'file.svg') : join(__filename, '..', '..', 'res', 'dir.svg');

    // DO NOT USE LABEL TO STORE INFOMATION
    // LABEL IS USED FOR USER FRIENDLY OBJECTS

    constructor(
        public label: string, // if sym link, set it
        public name: string,
        public location: string,
        public isLink: Boolean,
        public parent: FileItem | null,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
       super(label, collapsibleState);
    }

    public getExtension(): string | undefined {
        if (this.contextValue === "dirItems") {
            return undefined;
        }
        let read = this.name.split(".");
        if (read.length > 1) {
            return read.pop();
        }
        return undefined;
    }

    public getpath(): string {
        if (!this.location.endsWith("/")) {
            this.location += "/";
        }
        let ret = this.location + this.name;
        // console.log(ret);
        return ret;
    }

    // returns f: file, d: dir, l: link, u: unkown (maybe user friendly hints)
    public getType(): string {
        if (this.iconPath === join(__filename, '..', '..', 'res', 'file.svg')) {
            return "f";
        }
        if (this.iconPath === join(__filename, '..', '..', 'res', 'dir.svg')) {
            return "d";
        }
        if (this.iconPath === join(__filename, '..', '..', 'res', 'connect.svg')) {
            return "l";
        }
        return "u";
    }


    command = {
        title: this.label,
        command: 'iFileSelected',
        tooltip: this.getpath(),
        arguments: [
            this,
        ]
    };

}



export class FileSystemNodeProvider implements vscode.TreeDataProvider<FileItem>{

    public static nodeProvider: FileSystemNodeProvider;
    private workingRoot: string = "/";

    constructor(

    ){

    }

    public static vetoList = [
        "",
        " ",
        "/",
        "/Developer",
        "/User",
        "/boot",
        "/etc",
        "/private",
        "/usr",
        "/Library",
        "/lib",
        "/sbin",
        "/var",
        "/Applications",
        "/System",
        "/bin",
        "/dev",
        "/mnt",
    ];

    public static init() {
        const np = new FileSystemNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectionFileSystem', np);
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.download", (item) => np.fso_download(item));
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.upload", (item) => np.fso_upload(item));
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.delete", (item) => np.fso_delete(item));
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.replace", (item) => np.fso_replace(item));
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.create", (item) => np.fso_newfolder(item));
    }

    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
    }

    public pushToDir(whereto: string) {
        this.workingRoot = whereto;
        this.refresh();
    }

    async getChildren(element?: FileItem | undefined): Promise<FileItem[]> {

        let device = iDevices.shared.getDevice();
        if (device === undefined || device === null) {
            let ret = new FileItem("No Device Selected", "No Device Selected", "No Device Selected", false, null, vscode.TreeItemCollapsibleState.None);
            ret.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg')).path;
            return [ret];
        }
        if (iDeviceNodeProvider.iProxyPool[device!.udid] === undefined) {
            let ret = new FileItem("iProxy Required", "iProxy Required", "iProxy Required", false, null, vscode.TreeItemCollapsibleState.None);
            ret.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg')).path;
            return [ret];
        }

        // root items
        if (!element) {
            let ret = [];
            ret.push(new FileItem("working root: " + this.workingRoot, "", this.workingRoot, false, null, vscode.TreeItemCollapsibleState.Expanded));
            if (this.workingRoot !== "/") {
                let back = new FileItem("Go back to /", "", "", false, null, vscode.TreeItemCollapsibleState.None);
                back.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'rocket.svg')).path;
                ret.unshift(back);
            }
            return ret;
        }

        let read = iDevices.shared.executeOnDevice("ls -la \"" + element.getpath() + "\"");
        return this.lswrapper(element, read);

    }

    public lswrapper(object: FileItem, read: string): Array<FileItem> {
        let line = read.split("\n");
        let ret: Array<FileItem> = [];
        line.forEach((str) => {
            if (!str.startsWith("d") && !str.startsWith("-") && !str.startsWith("l")) {
                return;
            }
            if (str.endsWith(" .") || str.endsWith(" ..")) {
                return;
            }
            if (str.split(" -> ").length > 2) {
                return; // 淦 爬 *see possible data feed below*
            }

            while (str.endsWith("\r") || str.endsWith("\r\n") || str.endsWith("\n")) {
                str = str.substring(0, str.length - 1);
            }

            let inSpace = false;
            let inSpaceCount = 0;
            let prefixLenth = 0;
            let finalPrefixLenth = 0;
            let charset = str.split("");
            charset.forEach((char) => {
                if (inSpace && char === ' ') {
                    prefixLenth += 1;
                    return;
                }
                if (!inSpace && char === ' ') {
                    prefixLenth += 1;
                    inSpaceCount += 1;
                    inSpace = true;
                    return;
                }
                inSpace = false;
                prefixLenth += 1;
                if (inSpaceCount > 7 && finalPrefixLenth === 0) {
                    finalPrefixLenth = prefixLenth;
                }
            });

            let name = str.substring(finalPrefixLenth - 1, str.length);
            if (str.startsWith("l")) {
                let cut = name.split(" -> ");
                if (cut.length < 1) {
                    return; // ????????
                }
                let item = new FileItem(name, cut[0], object.getpath(), true, object, vscode.TreeItemCollapsibleState.None);
                item.iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'connect.svg')).path;
                ret.push(item);
                return;
            }

            if (str.startsWith("d")) {
                let item = new FileItem(name, name, object.getpath(), true, object, vscode.TreeItemCollapsibleState.Collapsed);
                ret.push(item);
                return;
            }

            let item = new FileItem(name, name, object.getpath(), true, object, vscode.TreeItemCollapsibleState.None);
            ret.push(item);
            return; // Id love to
        });
        return ret;
    }

    // fso stands for File System Operation
    private lastSelected: string = "";
    public performSelector(fileObject: FileItem) {
        if (fileObject.label === "Go back to /") {
            FileSystemNodeProvider.nodeProvider.pushToDir("/");
            return;
        }
        if (this.lastSelected === fileObject.getpath()) {
            vscode.window.showInformationMessage("iOSre -> File Path Copied + " + fileObject.getpath().substring(0, 8) + "...");
            vscode.env.clipboard.writeText(fileObject.getpath());
            if (fileObject.getType() === "f") {
                let selection = iDevices.shared.getDevice() as iDeviceItem;
                iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
                let terminal = vscode.window.createTerminal("preview => " + fileObject.getpath());
                terminal.show();
                let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
                writeFileSync(passpath, selection.iSSH_password);
                terminal.show();
                terminal.sendText(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
                terminal.sendText(" rm -f \'" + passpath + "\'");
                terminal.sendText(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
                terminal.sendText(`sshpass -p $SSHPASSWORD ssh -oStrictHostKeyChecking=no -p  ${selection.iSSH_mappedPort} root@127.0.0.1  "cat ${fileObject.getpath()}"|code -`);
                terminal.sendText("exit");
            }
            return;
        }
        this.lastSelected = fileObject.getpath();
    }

    public fso_download(fileObject: FileItem) {
        if (fileObject.getpath() === undefined || fileObject.getpath() === "") {
            return;
        }
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Put Here',
            filters: {
               'All files': ['*']
            }
        };
        vscode.window.showOpenDialog(options).then((uri) => {
            if (uri === undefined || uri === null || uri.length !== 1) {
                return;
            }
            let path = uri.shift()?.path;
            if (path === undefined || path === null || path === "") {
                return;
            }
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Download => " + fileObject.getpath());
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            terminal.sendText(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminal.sendText(" rm -f \'" + passpath + "\'");
            terminal.sendText(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
            terminal.sendText(" sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -r -P" + selection.iSSH_mappedPort + " \"root@127.0.0.1:" + fileObject.getpath() + "\" \"" + path + "/\"");
            terminal.sendText("exit");
        });

    }

    public fso_upload(fileObject: FileItem) {
        if (fileObject.getpath() === undefined || fileObject.getpath() === "") {
            return;
        }
        if (fileObject.getType() !== "d") {
            vscode.window.showWarningMessage("iOSre -> Upload only available for directories");
            return;
        }
        const options: vscode.OpenDialogOptions = {
            canSelectMany: true,
            canSelectFolders: true,
            canSelectFiles: true,
            openLabel: 'Put Here',
            filters: {
               'All files': ['*']
            }
        };
        vscode.window.showOpenDialog(options).then((uri) => {
            if (uri === undefined || uri === null) {
                return;
            }
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Upload => " + fileObject.getpath());
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            let script = "#!/bin/bash\n";
            let items = [];
            items.push(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
            items.push(" rm -f \'" + passpath + "\'");
            items.push(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
            uri.forEach((sel) => {
                items.push(" sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -r -P" + selection.iSSH_mappedPort + " \"" + sel.path + "\" \"root@127.0.0.1:" + fileObject.getpath() +  "/\"");
            });
            items.push(" exit");
            items.forEach((line) => {
                script += line + "\n";
            });
            let scriptpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(scriptpath, script);
            terminal.sendText(" chmod +x \"" + scriptpath + "\"");
            terminal.sendText(" \"" + scriptpath + "\"");
            // let sleep = 0;
            // while (sleep < 1000000) {
            //     sleep += 1;
            // }
            terminal.sendText(" exit");
            vscode.window.onDidCloseTerminal((isthisone) => {
                if (isthisone.name === "Upload => " + fileObject.getpath()) {
                    FileSystemNodeProvider.nodeProvider.refresh();
                }
            });

        });

    }
    public fso_delete(fileObject: FileItem) {
        let path = fileObject.getpath();
        if (path === undefined || path === "") {
            return;
        }
        if (FileSystemNodeProvider.vetoList.includes(path)) {
            vscode.window.showWarningMessage("iOSre -> This file is protected or required by system: " + path);
            return;
        }
        vscode.window.showInformationMessage("Are you sure? The delete operation can not be undo on: " + path, "Contunie", "Stop").then((str) => {
            if (str !== "Contunie") {
                return;
            }
            iDevices.shared.executeOnDevice("rm -rf \"" + path + "\"");
            this.refresh();
        });
    }

    public fso_replace(fileObject: FileItem) {
        let path = fileObject.getpath();
        if (path === undefined || path === "") {
            return;
        }
        if (FileSystemNodeProvider.vetoList.includes(path)) {
            vscode.window.showWarningMessage("iOSre -> This file is protected or required by system: " + path);
            return;
        }
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFolders: true,
            canSelectFiles: true,
            openLabel: 'Put Here',
            filters: {
               'All files': ['*']
            }
        };
        iDevices.shared.executeOnDevice("rm -rf \"" + path + "\"");
        vscode.window.showOpenDialog(options).then((uri) => {
            if (uri === undefined || uri === null || uri.length !== 1) {
                return;
            }
            let uploadpath = uri.shift()?.path;
            if (uploadpath === undefined || uploadpath === null || uploadpath === "") {
                return;
            }
            let selection = iDevices.shared.getDevice() as iDeviceItem;
            iDeviceNodeProvider.nodeProvider.ensureiProxy(selection);
            let terminal = vscode.window.createTerminal("Replace => " + fileObject.getpath());
            terminal.show();
            let passpath = LKutils.shared.storagePath + "/" + LKutils.shared.makeid(10);
            writeFileSync(passpath, selection.iSSH_password);
            terminal.show();
            terminal.sendText(" export SSHPASSWORD=$(cat \'" + passpath + "\')");
            terminal.sendText(" rm -f \'" + passpath + "\'");
            terminal.sendText(" ssh-keygen -R \"[127.0.0.1]:" + selection.iSSH_mappedPort + "\" &> /dev/null");
            terminal.sendText(" sshpass -p $SSHPASSWORD scp -oStrictHostKeyChecking=no -r -P" + selection.iSSH_mappedPort + " \"" + uploadpath + "\" \"root@127.0.0.1:" + fileObject.location + "\"");
            terminal.sendText(" exit");
            vscode.window.onDidCloseTerminal((isthisone) => {
                if (isthisone.name === "Replace => " + fileObject.getpath()) {
                    FileSystemNodeProvider.nodeProvider.refresh();
                }
            });
        });

    }

    public fso_newfolder(fileObject: FileItem) {
        if (fileObject.getpath() === undefined || fileObject.getpath() === "") {
            return;
        }
        if (fileObject.getType() !== "d") {
            vscode.window.showWarningMessage("iOSre -> Create new folder only available under directories");
            return;
        }
        vscode.window.showInputBox({prompt: "New folder's name here, press ESC to cancel."}).then((val => {
            if (val === undefined || val === null || val === " " || val.includes("/")) {
                return;
            }
            let fullpath = fileObject.location + "/" + val;
            iDevices.shared.executeOnDevice("mkdir \"" + fullpath + "\"");
            this.refresh();
        }));
    }

    /*
    1          2  3    4      5   6    7 8     9
    drwxr-xr-x 28 root wheel  896 Mar  5 05:35 .
    drwxr-xr-x 28 root wheel  896 Mar  5 05:35 ..
    -rw-r--r--  1 root wheel    0 Dec  5 13:22 .Trashes
    drwx------  2 root wheel   64 Dec  5 13:08 .ba
    ----------  1 root admin    0 Dec  5 13:09 .file
    drwx------  2 root wheel   64 Dec  5 13:08 .mb
    -rwxr-----  1 root wheel    0 Feb 26 20:35 .mount_rw
    drwxr-xr-x  2 root wheel   64 Feb 27 21:12 AppleInternal
    drwxr-xr-x 28 root wheel  896 Feb 28 15:46 sbin
    lrwxr-xr-x  1 root admin   11 Dec  5 13:22 var -> private/var
    -rw-r--r--  1 qaq  staff    0 Mar  7 19:29 hi hi hi
    -rw-r--r--  1 qaq  staff    0 Mar  7 19:31 hi -> hi  //草 口吐芬芳
    lrwxr-xr-x  1 qaq  staff   13 Mar  7 19:32 ln -> ln -> ./filelist.py // 再见 这种用户咱们就放弃吧
     */

}
