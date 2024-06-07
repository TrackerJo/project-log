import * as vscode from "vscode";

import { getNonce } from "./getNonce";
import { GlobalStorageService } from "./storage";


export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  _storage: GlobalStorageService;

  constructor(private readonly _extensionUri: vscode.Uri, storage: GlobalStorageService) {
    this._storage = storage;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

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
            <div class="main-window">
                <h2 class="project-name"></h2>
                <br>
                <h3>Resources</h3>
                <div class="resources-list">

                </div>
                <br>
                <button class="add-resource-button">Add Resource</button>
            </div>
            <div class="more-options">
               
                <div class="tasks-pane vertical tasks-list-pane">
                    <div class="tasks-pane-header">
                        <div class="codicon codicon-chevron-right tasks-pane-indicator"></div>
                        <h3 class="tasks-pane-header-title">Tasks</h3>
                    </div>
                </div>
                
                <div class="content tasks-content">
                    <form id="tasks-form">
                        <input type="text" id="tasks-input"> 
                    </form>
                    <div id="tasks-list">
                       
                    </div>
                </div>
                <div class="tasks-pane vertical completed-tasks-pane">
                    <div class="tasks-pane-header">
                        <div class="codicon codicon-chevron-right tasks-pane-indicator"></div>
                        <h3 class="tasks-pane-header-title">Completed Tasks</h3>
                    </div>
                </div>
                
                <div class="content completed-tasks-content">
                    
                    <div id="completed-tasks-list">
                       
                    </div>
                </div>
            </div>
        </div>
        
       

        <script src="${mainScriptUri}" nonce="${nonce}"></script>
        <script src="${tasksScriptUri}" nonce="${nonce}"></script>
			
			</body>
			</html>`;
  }
}