import * as vscode from 'vscode';
import * as fs from 'fs';

export class LKutils {

    public static shared = new LKutils();
    public storagePath: string | undefined;
    public userHome: String | undefined;

    constructor() { }

    public setStoragePath(location: string | undefined) {
        console.log("[i] setStoragePath called with: " + location);
        if (this.storagePath !== undefined) {
            vscode.window.showErrorMessage("iOSre -> storagePath Already Exists");
            return;
        }
        if (location === undefined) {
            if (this.userHome === undefined) {
                vscode.window.showErrorMessage("iOSre -> No where to save docs");
            }
            this.storagePath = (this.userHome as string) + "/iOSre";
            return;
        }
        this.storagePath = location;
    }

    public setUserHome(location: string) {
        console.log("[i] setUserHome called with: " + location);
        if (this.userHome !== undefined) {
            vscode.window.showErrorMessage("iOSre -> userHome Already Exists");
            return;
        }
        this.userHome = location;
    }

    public async execute(cmd: string): Promise<String> {
        var promise = new Promise<String>(resolve => {
            const cp = require('child_process');
            cp.exec(cmd, (err: string, stdout: string, stderr: string) => {
                if (err) {
                    vscode.window.showErrorMessage("iOSre -> EXECUTE_COMMAND_ERROR -> stderr:" + stderr + " -> stdout:" + stdout + " -> whenExec:" + cmd + "  ==> Install dependency may solve the problem.");
                }
                resolve(stdout);
            });
        });
        return promise;
    }

    public async python(executable: string, arg: string): Promise<String> {
        var promise = new Promise<String>(resolve => {
            const cp = require('child_process');
            if (executable.startsWith("\'")) {
                cp.exec("python3 " + executable + " " + arg, (err: string, stdout: string, stderr: string) => {
                    if (err) {
                        vscode.window.showErrorMessage("iOSre -> EXECUTE_PYTHON_ERROR -> stderr:" + stderr + " -> stdout:" + stdout + " -> whenExec:" + executable + " " + arg + "  ==> Install dependency may solve the problem.");
                    }
                    resolve(stdout);
                });
            } else {
                cp.exec("python3 \'" + executable + "\' " + arg, (err: string, stdout: string, stderr: string) => {
                    if (err) {
                        vscode.window.showErrorMessage("iOSre -> EXECUTE_PYTHON_ERROR -> stderr:" + stderr + " -> stdout:" + stdout + " -> whenExec:" + executable + " " + arg + "  ==> Install dependency may solve the problem.");
                    }
                    resolve(stdout);
                });
            }
        });
        return promise;
    }

    // '"KEY"':'"VALUE"
    public saveKeyPairValue(key: string, val: string) {
        if (!fs.existsSync(this.storagePath as string)) {
            fs.mkdirSync(this.storagePath as string);
        }
        const jsonFile = (this.storagePath as string) + "/envs.json";
        if (!fs.existsSync(jsonFile)) {
            fs.closeSync(fs.openSync(jsonFile, 'w'));
        }
        console.log("[i] Write key pair value: " + key + " " + val); // + " to " + jsonFile);
        let read = fs.readFileSync(jsonFile, 'utf8');
        if (read === "") {
            let papapa = {"" : ""};
            let json = JSON.stringify(papapa);
            fs.writeFileSync(jsonFile, json, 'utf8');
            read = fs.readFileSync(jsonFile, 'utf8');
        }
        let readJson = JSON.parse(read);
        readJson[key] = val;
        var json = JSON.stringify(readJson);
        fs.writeFileSync(jsonFile, json, 'utf8');
    }

    public readKeyPairValue(key: string): string {
        if (!fs.existsSync(this.storagePath as string)) {
            fs.mkdirSync(this.storagePath as string);
        }
        const jsonFile = (this.storagePath as string) + "/envs.json";
        if (!fs.existsSync(jsonFile)) {
            fs.closeSync(fs.openSync(jsonFile, 'w'));
        }
        let read = fs.readFileSync(jsonFile, 'utf8');
        if (read === "") {
            let papapa = {"" : ""};
            let json = JSON.stringify(papapa);
            fs.writeFileSync(jsonFile, json, 'utf8');
            read = fs.readFileSync(jsonFile, 'utf8');
        }
        let readJson = JSON.parse(read);
        let ret = readJson[key];
        console.log("[i] Read key pair value: " + key + " " + ret); // + " from " + jsonFile);
        return ret;
    }

    public makeid(howlong: Number): string {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < howlong; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}