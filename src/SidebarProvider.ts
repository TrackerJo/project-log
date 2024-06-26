import * as vscode from "vscode";

import { getNonce } from "./getNonce";
import { GlobalStorageService } from "./storage";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _storage: GlobalStorageService;
  _timer: vscode.StatusBarItem;

  constructor(private readonly _extensionUri: vscode.Uri, storage: GlobalStorageService, timer: vscode.StatusBarItem) {
    this._storage = storage;
    this._timer = timer;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    function generateId(){
      //Generate a random id with 16 characters with a mix of numbers and letters
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "get-project-tasks": {
          const project = vscode.workspace.name;
          const tasks = this._storage.getValue<Object[]>(project + "-tasks") || [];

          webviewView.webview.postMessage({
            type: "get-project-tasks",
            projectName: project,
            tasks: tasks,
          });
          break;
        }

        case "save-tasks": {
          const project = data.projectName;
          
          this._storage.setValue(project + "-tasks", data.tasks);
          
          break;
        }

        case "get-project-name": {
          const project = vscode.workspace.name;
          webviewView.webview.postMessage({
            type: "project-name",
            projectName: project,
          });
          break;
        }

        case "add-resource": {
          const project = vscode.workspace.name;
          const resources = this._storage.getValue<Object[]>(project + "-resources") || [];
          const resourceLink = await vscode.window.showInputBox({
            placeHolder: "Enter the resource link",
          });
          const resourceName = await vscode.window.showInputBox({
            placeHolder: "Enter the resource name",
          });
          if (resourceLink && resourceName) {
            resources.push({
              name: resourceName,
              link: resourceLink,
            });
            this._storage.setValue(project + "-resources", resources);
            webviewView.webview.postMessage({
              type: "update-resources",
              resources: resources,
            });
          } else {
            vscode.window.showErrorMessage("Resource name and link are required");
          }
          break;
        
        }
        case "get-resources": {
          const project = vscode.workspace.name;
          const resources = this._storage.getValue<Object[]>(project + "-resources") || [];
          webviewView.webview.postMessage({
            type: "update-resources",
            resources: resources,
          });
          break;
        }
        case "save-resources": {
          const project = data.projectName;
          this._storage.setValue(project + "-resources", data.resources);
          break;
        }

        case "start-timer": {
          const project = vscode.workspace.name;
          this._storage.setValue(project + "-continue-timer", true);
          break;
        }

        case "stop-timer": {
          const project = vscode.workspace.name;
          this._storage.setValue(project + "-continue-timer", false);
          break;
        }

        case "reset-timer": {
          const project = vscode.workspace.name;
          this._storage.setValue(project + "-time", {
            minutes: 0,
            seconds: 0,
            hours: 0,
          });
          webviewView.webview.postMessage({
            type: "update-timer",
            time: {
              minutes: "00",
              seconds: "00",
              hours: 0,
            },
          });
          this._timer.text = "$(clock) 0:00:00";
          break;
        }

        case "log-timer": {
          const project = vscode.workspace.name;
          this._storage.setValue(project + "-continue-timer", false);

          let description = await vscode.window.showInputBox({placeHolder: "Enter description of work for the log"});
          if (!description){
            description = "No description";
          }

          const logs = this._storage.getValue<Object[]>(project + "-logs") || [];
          const time = this._storage.getValue<{minutes: number, seconds: number, hours: number}>(project + "-time");
          logs.push({
            time: time,
            description: description,
            id: generateId(),
          });
          this._storage.setValue(project + "-logs", logs);
          this._storage.setValue(project + "-time", {
            minutes: 0,
            seconds: 0,
            hours: 0,
          });
          webviewView.webview.postMessage({
            type: "update-logs",
            logs: logs,
          });
          webviewView.webview.postMessage({
            type: "update-timer",
            time: {
              minutes: "00",
              seconds: "00",
              hours: "0",
            },
          });
          this._timer.text = "$(clock) 0:00:00";
          break;

        }
        case "get-logs": {
          const project = vscode.workspace.name;
          const logs = this._storage.getValue<Object[]>(project + "-logs") || [];
          webviewView.webview.postMessage({
            type: "update-logs",
            logs: logs,
          });
          break;
        }
        case "get-timer": {
          const project = vscode.workspace.name;
          const time = this._storage.getValue<{minutes: number, seconds: number, hours: number}>(project + "-time");
          webviewView.webview.postMessage({
            type: "update-timer",
            time: time,
          });
          break;
        }
        case "save-logs": {
          const project = data.projectName;
          this._storage.setValue(project + "-logs", data.logs);
          break;
        }
        case "show-add-log-form": {
          const project = vscode.workspace.name;
          const logs = this._storage.getValue<Object[]>(project + "-logs") || [];
          const logDescription = await vscode.window.showInputBox({placeHolder: "Enter description of work for the log"});
          if (!logDescription){
            vscode.window.showErrorMessage("Description is required");
            return;
          }
          const time = await vscode.window.showInputBox({placeHolder: "Enter time spent on the task (xxh xxm xxs)"});
          if (!time){
            vscode.window.showErrorMessage("Time is required");
            return;
          }
          const timeArr = time.split(" ");
          let hours = "0";
          let minutes = "0";
          let seconds = "0";
          for (let i = 0; i < timeArr.length; i++){
            if (timeArr[i].includes("h")){
              hours = timeArr[i].replace("h", "");
            } else if (timeArr[i].includes("m")){
              minutes = timeArr[i].replace("m", "");
              
            } else if (timeArr[i].includes("s")){
              seconds = timeArr[i].replace("s", "");
              
            }
          }
          logs.push({
            time: {
              hours: hours,
              minutes: minutes,
              seconds: seconds,
            },
            description: logDescription,
            id: generateId(),
          });
          this._storage.setValue(project + "-logs", logs);
          webviewView.webview.postMessage({
            type: "update-logs",
            logs: logs,
          });

          break;
        
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
      );
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    const tasksScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "tasks.js")
    );
    const styleCodeToDoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "projectlog.css")
    );
    const tasksStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "tasks.css")
    );

    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
			
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <link href="${styleCodeToDoUri}" rel="stylesheet">
        <link href="${tasksStyleUri}" rel="stylesheet">
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
        </script>
       
			</head>
      <body>
      <div class="window">
           
            <div class="pane vertical resources-pane active">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-down pane-indicator"></div>
                    <h3 class="pane-header-title">Resources</h3>
                    <div class="actions">
                        <div class="monaco-toolbar">
                            <div class="monaco-action-bar">
                                <ul class="actions-container" role="toolbar" aria-label="delete actions">
                                    <li class="action-item menu-entry" role="presentation" custom-hover="true">
                                        <a class="action-label codicon codicon-add" role="button" aria-label="Add Resource..." tabindex="0" id="add-resource-button"></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content resources-content" style="height: 100vh;">
                <div class="resources-list">

                </div>


            </div>
            <div class="pane vertical timer-pane">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-right pane-indicator"></div>
                    <h3 class="pane-header-title">Timer</h3>
                </div>
            </div>
            
            <div class="content timer-content">
                <div class="timer">
                    <div class="timer-display">
                        <span class="time-hours">00</span>:<span class="time-minutes">00</span>:<span class="time-seconds">00</span>
                    </div>
                    <div class="timer-controls">
                        <button class="start-timer">Start</button>
                        <button class="stop-timer">Stop</button>
                        <button class="reset-timer">Reset</button>
                        <button class="log-timer">Log</button>
                    </div>
                </div>
            </div>

            <div class="pane vertical logs-pane">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-right pane-indicator"></div>
                    <h3 class="pane-header-title">Logs</h3>
                    <div class="actions">
                        <div class="monaco-toolbar">
                            <div class="monaco-action-bar">
                                <ul class="actions-container" role="toolbar" aria-label="delete actions">
                                    <li class="action-item menu-entry" role="presentation" custom-hover="true">
                                        <a class="action-label codicon codicon-add" role="button" aria-label="Add Log..." tabindex="0" id="add-log-button"></a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content logs-content">

                    <div class="logs-list">
                        
                    </div>
                    <div class="divider">

                    </div>
                    <label class="log-total-time">Total Time: 0:00:00</label>

            </div>
        
            
            <div class="pane vertical tasks-list-pane">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-right pane-indicator"></div>
                    <h3 class="pane-header-title">Tasks</h3>
                </div>
            </div>
            
            <div class="content tasks-content">
                <form id="tasks-form">
                    <input type="text" id="tasks-input"> 
                </form>
                <div id="tasks-list">
                    
                </div>
            </div>
            <div class="pane vertical completed-pane">
                <div class="pane-header">
                    <div class="codicon codicon-chevron-right pane-indicator"></div>
                    <h3 class="pane-header-title">Completed Tasks</h3>
                </div>
            </div>
            
            <div class="content completed-tasks-content">
                
                <div id="completed-tasks-list">
                    
                </div>
            </div>
        </div>

       

        <script src="${mainScriptUri}" nonce="${nonce}"></script>
        <script src="${tasksScriptUri}" nonce="${nonce}"></script>
			
			</body>
			</html>`;
  }
}