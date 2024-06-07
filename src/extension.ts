
import * as vscode from 'vscode';

import { SidebarProvider } from './SidebarProvider';

import { GlobalStorageService } from './storage';

export function activate(context: vscode.ExtensionContext) {

	let storageManager = new GlobalStorageService(context.globalState);

	const sidebarProvider = new SidebarProvider(context.extensionUri, storageManager);
	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

	item.text = "$(notebook) Add Resource";
	item.command = 'projectlog.addResource';
	item.show();
	checkToDos(storageManager, sidebarProvider);

	//Add onStartupFinished event listener
	

	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("projectlog-sidebar", sidebarProvider)
	);
  

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.addTask', async () => {
		
		const value = await vscode.window.showInputBox({
			placeHolder: "Describe your task"
		});

		if (value) {
			const project = vscode.workspace.name;
			const tasks = storageManager.getValue<Object[]>(project + "-tasks") || [];
			tasks.push({
				text: value,
				completed: false,
				id: tasks.length + 1
			});
			storageManager.setValue(project + "-tasks", tasks);
			sidebarProvider._view?.webview.postMessage({
				type: "update-tasks",

				tasks: tasks,
			});
		}
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.viewTasks', async () => {
		
		await vscode.commands.executeCommand("workbench.view.extension.projectlog-sidebar-view");
		setTimeout(() => {
			sidebarProvider._view?.webview.postMessage({
				type: "view-tasks",
			});
		}, 500);
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.addResource', async () => {
		const project = vscode.workspace.name;
          const resources = storageManager.getValue<Object[]>(project + "-resources") || [];
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
            storageManager.setValue(project + "-resources", resources);
            sidebarProvider._view?.webview.postMessage({
              type: "update-resources",
              resources: resources,
            });
          } else {
            vscode.window.showErrorMessage("Resource name and link are required");
          }
	}));

}

async function checkToDos(storageManager: GlobalStorageService, sidebarProvider: SidebarProvider){
	interface Todo {
		text: string;
		completed: boolean;
		id: number;
	}
	const projectName = vscode.workspace.name;
	if (!projectName) {
		return;
	}
	const currentTodos = storageManager.getValue<Todo[]>(projectName + '-tasks') || [];
	if (currentTodos.length === 0) {
		return;
	}
	
	const incompleteTodos = currentTodos.filter((todo) => !todo.completed);
	if (incompleteTodos.length === 0) {
		return;
	}
	const taskWord = incompleteTodos.length === 1 ? ' task' : ' tasks';
	const response = await vscode.window.showInformationMessage('You have ' + incompleteTodos.length + taskWord + ' to complete!', 'View');
	if(response === 'View'){
		vscode.commands.executeCommand('workbench.view.extension.projectlog-sidebar-view');
		setTimeout(() => {
			sidebarProvider._view?.webview.postMessage({
				type: "view-tasks",
			});
		}, 500);
	}
}




export function deactivate() {}
