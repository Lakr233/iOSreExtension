import * as vscode from 'vscode';
import { join } from 'path';
import { iDevices } from './iDevices';
import { iDeviceItem, iDeviceNodeProvider } from './iDeviceConnections';
import { LKutils } from './Utils';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

export class FileItem extends vscode.TreeItem {

    // used for caches and future use
    public infoObject: {[key: string]: string} = {};

    public iconPath = this.collapsibleState === vscode.TreeItemCollapsibleState.None ? join(__filename, '..', '..', 'res', 'file.svg') : join(__filename, '..', '..', 'res', 'dir.svg');  
    public contextValue = this.collapsibleState === vscode.TreeItemCollapsibleState.None ? "fileItems" : "dirItems";

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

}



export class FileSystemNodeProvider implements vscode.TreeDataProvider<FileItem>{  

    public static nodeProvider: FileSystemNodeProvider;
    private workingRoot: string = "/";

    constructor(

    ){

    }

    public static init() {
        const np = new FileSystemNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectionFileSystem', np);
        vscode.commands.registerCommand("iosreIDtabSectionFileSystem.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
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
                let back = new FileItem("Go back to /", "", "", false, null, vscode.TreeItemCollapsibleState.None)
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


