import * as vscode from 'vscode';

export class LKutils {

    public static shared = new LKutils();

    constructor() { }

    public async execute(cmd: string): Promise<String> {
        var promise = new Promise<String>(resolve => {
            const cp = require('child_process');
            cp.exec('idevice_id -l', (err: string, stdout: string, stderr: string) => {
                if (err) {
                    vscode.window.showErrorMessage("iOSre -> EXECUTE_COMMAND_ERROR <- stderr:%s stdout:%s => %s", stderr, stdout, cmd);
                }
                resolve(stdout);
            });
        });
        return promise;
    }

}