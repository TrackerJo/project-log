
import * as vscode from 'vscode';

import { SidebarProvider } from './SidebarProvider';

import { GlobalStorageService } from './storage';

export function activate(context: vscode.ExtensionContext) {

	let storageManager = new GlobalStorageService(context.globalState);
	const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	const timer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	const sidebarProvider = new SidebarProvider(context.extensionUri, storageManager, timer);
	
	item.text = "$(notebook) Add Resource";
	item.command = 'projectlog.addResource';
	item.show();
	checkToDos(storageManager, sidebarProvider);
	const project = vscode.workspace.name;

	startTimer(storageManager, sidebarProvider, timer);

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

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.viewTimer', async (id: number) => {
		await vscode.commands.executeCommand("workbench.view.extension.projectlog-sidebar-view");
		setTimeout(() => {
			sidebarProvider._view?.webview.postMessage({
				type: "view-timer",
			});
		}, 500);
		
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.startTimer', async (id: number) => {
		const project = vscode.workspace.name;
		storageManager.setValue(project + '-continue-timer', true);
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.stopTimer', async (id: number) => {
		const project = vscode.workspace.name;
		storageManager.setValue(project + '-continue-timer', false);
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.resetTimer', async (id: number) => {
		const project = vscode.workspace.name;
		storageManager.setValue(project + '-continue-timer', false);
		storageManager.setValue(project + '-time', {
			minutes: 0,
			seconds: 0,
			hours: 0
		});
		sidebarProvider._view?.webview.postMessage({
			type: "update-timer",
			time: {
				minutes: '00',
				seconds: '00',
				hours: 0
			}
		});
		timer.text = "$(clock) 0:00:00";
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.logTimer', async (id: number) => {

		const project = vscode.workspace.name;
		storageManager.setValue(project + '-continue-timer', false);
		const time = storageManager.getValue<{minutes: number, seconds: number, hours: number}>(project + '-time');
		const logs = storageManager.getValue<Object[]>(project + "-logs") || [];
		let description = await vscode.window.showInputBox({ placeHolder: "Enter description of work for the log" });
		if(!description){
			description = 'No description';
		}
		logs.push({
			time: time,
			description: description
		});
		storageManager.setValue(project + "-logs", logs);
		sidebarProvider._view?.webview.postMessage({
			type: "update-logs",
			logs: logs,
		});
		storageManager.setValue(project + '-time', {
			minutes: 0,
			seconds: 0,
			hours: 0
		});
		sidebarProvider._view?.webview.postMessage({
			type: "update-timer",
			time: {
				minutes: '00',
				seconds: '00',
				hours: 0
			}
		});
		timer.text = "$(clock) 0:00:00";
		
	}));

	context.subscriptions.push( vscode.commands.registerCommand('projectlog.showTimerControls', async () => {
		const project = vscode.workspace.name;
		const isTimerRunning = storageManager.getValue<boolean>(project + '-continue-timer');
		const time = storageManager.getValue<{minutes: number, seconds: number, hours: number}>(project + '-time');
		const timeGreaterThanZero = time && (time.minutes > 0 || time.seconds > 0 || time.hours > 0);
		const choices = [];
		if(!isTimerRunning){
			choices.push({
				label: "Start Timer",
				description: "Start the timer",
				picked: true
			});
		} else {
			choices.push({
				label: "Stop Timer",
				description: "Stop the timer",
				picked: true
			});
		}
		if(timeGreaterThanZero){
			choices.push({
				label: "Reset Timer",
				description: "Reset the timer"
			});
		}
		if(timeGreaterThanZero){
			choices.push({
				label: "Log Timer",
				description: "Log the timer"
			});
		}
		choices.push({
			label: "View Timer",
			description: "View the timer"
		});
		const choice = await vscode.window.showQuickPick(choices);
		if(!choice){
			return;
		}
		switch(choice.label){
			case "Start Timer":
				vscode.commands.executeCommand('projectlog.startTimer');
				break;
			case "Stop Timer":
				vscode.commands.executeCommand('projectlog.stopTimer');
				break;
			case "Reset Timer":
				vscode.commands.executeCommand('projectlog.resetTimer');
				break;
			case "Log Timer":
				vscode.commands.executeCommand('projectlog.logTimer');
				break;
			case "View Timer":
				vscode.commands.executeCommand('projectlog.viewTimer');
				break;
		}
	}));

}

function startTimer(storageManager: GlobalStorageService, sidebarProvider: SidebarProvider, timer: vscode.StatusBarItem){
	
	let seconds = 0;
	let minutes = 0;
	let hours = 0;
	timer.text = "$(clock) 0:00:00";
	timer.command = 'projectlog.showTimerControls';
	timer.show();
	setInterval(() => {
		const project = vscode.workspace.name;
		const continueTimer = storageManager.getValue<boolean>(project + '-continue-timer');
		const time = storageManager.getValue<{minutes: number, seconds: number, hours: number}>(project + '-time');


		if(time){
			seconds = time.seconds;
			minutes = time.minutes;
			hours = time.hours;
		}
		if(!continueTimer){
			return;
		}
		seconds++;
		if(seconds === 60){
			minutes++;
			seconds = 0;
		}
		if(minutes === 60){
			hours++;
			minutes = 0;
		}
		//Update the timer
		storageManager.setValue(project + '-time', {
			minutes: minutes,
			seconds: seconds,
			hours: hours
		});
		//Update sidebar
		
		let hoursString = hours;
		let minutesString = minutes < 10 ? '0' + minutes : minutes;
		let secondsString = seconds < 10 ? '0' + seconds : seconds;
		sidebarProvider._view?.webview.postMessage({
			type: "update-timer",
			time: {
				minutes: minutesString,
				seconds: secondsString,
				hours: hoursString
			}
		});
		timer.text = `$(clock) ${hoursString}:${minutesString}:${secondsString}`;
	}, 1000);

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
