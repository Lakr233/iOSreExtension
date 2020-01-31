import * as vscode from 'vscode';

export class LKutils {

    public static shared = new LKutils();

    constructor() { }

    public async execute(cmd: string): Promise<String> {
        var promise = new Promise<String>(resolve => {
            const cp = require('child_process');
            cp.exec('idevice_id -l', (err: string, stdout: string, stderr: string) => {
                if (err) {
                    vscode.window.showErrorMessage("iOSre -> EXECUTE_COMMAND_ERROR -> stderr:" + stderr + " -> stdout:" + stdout + " -> whenExec:" + cmd + "  ==> Install dependency may solve the problem.");
                }
                resolve(stdout);
            });
        });
        return promise;
    }

}