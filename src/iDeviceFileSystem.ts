import * as vscode from 'vscode'
import { join } from 'path'
import { iDevices } from './iDevices'



export class FileItem extends vscode.TreeItem {
     constructor(
         public readonly label: string,
         public readonly collapsibleState: vscode.TreeItemCollapsibleState,
         public parent: FileItem | null
    ) {
       super(label, collapsibleState)
    }

    getpath(): string {
        return this.parent?join(this.parent.getpath(),this.label):this.label
    }

    iconPath = this.collapsibleState == vscode.TreeItemCollapsibleState.None ? join(__filename, '..', '..', 'res', 'file.svg') : join(__filename, '..', '..', 'res', 'dir.svg')    
    contextValue = this.collapsibleState == vscode.TreeItemCollapsibleState.None ? "fileItems" : "dirItems"
}



export class FileSystemNodeProvider implements vscode.TreeDataProvider<FileItem>{  
    constructor(
        public rootDir: string
    ){

    }
    public static nodeProvider: FileSystemNodeProvider;

    public static init() {
        const np = new FileSystemNodeProvider('/');
        vscode.window.registerTreeDataProvider('iosreIDtabSectionFileSystem', np);
    } 
       
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;


    getTreeItem(element: FileItem): vscode.TreeItem {
        return element
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

    getChildren(element?: FileItem | undefined): vscode.ProviderResult<FileItem[]> {
        if(!element){
            return [new FileItem(this.rootDir,vscode.TreeItemCollapsibleState.Expanded,null)]
        }else{
            let items: FileItem[] = []
            let path=element.getpath()
            let tmp=iDevices.shared.executeOnDevice(`python3 filelist.py ${path}`)
            let result:Array<Array<string>>= JSON.parse(tmp)
            result[0].forEach(e=>items.push(new FileItem(e,vscode.TreeItemCollapsibleState.Collapsed,element)))          
            result[1].forEach(e=>items.push(new FileItem(e,vscode.TreeItemCollapsibleState.None,element)))

            return items
        }
    }
}


