// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    let projectName = '';
    let resources = [];
    let logs = [];

    const resourcesList = document.querySelector('.resources-list');
    const addResourceButton = document.querySelector('.add-resource-button');
    const timeHours = document.querySelector('.time-hours');
    const timeMinutes = document.querySelector('.time-minutes');
    const timeSeconds = document.querySelector('.time-seconds');
    const stopTimer = document.querySelector('.stop-timer');
    const startTimer = document.querySelector('.start-timer');
    const resetTimer = document.querySelector('.reset-timer');
    const logTimer = document.querySelector('.log-timer');
    const logsList = document.querySelector('.logs-list');
    const timerPane = document.querySelector('.timer-pane');

    document.addEventListener('DOMContentLoaded', function () {
        vscode.postMessage({
            type: 'get-project-name'
        });
        vscode.postMessage({
            type: 'get-resources'
        });
        vscode.postMessage({
            type: 'get-timer'
        });
        vscode.postMessage({
            type: 'get-logs'
        });
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'project-name':
                projectName = message.projectName;

                break;
            case 'update-resources':
                resources = message.resources;
                renderResources();
                break;
            case 'update-timer':
                timeHours.textContent = message.time.hours;
                timeMinutes.textContent = message.time.minutes;
                timeSeconds.textContent = message.time.seconds;
                break;
            case 'update-logs':
                logs = message.logs;
                renderLogs();
                break;
            case 'view-timer':
                case 'view-tasks':
                //Remove the active class from all panes
                const activePane = document.querySelector('.pane.active');
                if(activePane){
                    activePane.classList.remove('active');
                    const indicator = activePane.querySelector('.pane-indicator');
                    if(indicator.classList.contains('codicon-chevron-down')){
                        indicator.classList.remove('codicon-chevron-down');
                        indicator.classList.add('codicon-chevron-right');
                        
                    } else {
                        indicator.classList.remove('codicon-chevron-right');
                        indicator.classList.add('codicon-chevron-down');

                    }
                    const content = activePane.nextElementSibling;
                    if (content.style.height){
                        content.style.height = null;
                    } else {
                        content.style.height = "100vh";


                    }
                }
                timerPane.classList.toggle("active");
                const indicator = timerPane.querySelector('.pane-indicator');

                if(indicator.classList.contains('codicon-chevron-down')){
                    indicator.classList.remove('codicon-chevron-down');
                    indicator.classList.add('codicon-chevron-right');
                    
                } else {
                    indicator.classList.remove('codicon-chevron-right');
                    indicator.classList.add('codicon-chevron-down');

                }
                const content = timerPane.nextElementSibling;
                if (content.style.height){
                    content.style.height = null;
                } else {
                    content.style.height = "100vh";
                }
        }
    });

    addResourceButton.addEventListener('click', function(){
        vscode.postMessage({
            type: 'add-resource'
        });
    });

    function saveResources(){
        vscode.postMessage({
            type: 'save-resources',
            resources: resources,
            projectName: projectName
        });
    }

    function renderResources(){
        resourcesList.innerHTML = '';
        resources.forEach(function(resource){
            //Update the todo id
            resource.id = resources.indexOf(resource) + 1;
            resources[resources.findIndex(x => x.id === resource.id)] = resource;
           
            const resourceItem = document.createElement('div');
            resourceItem.id = `resource-${resource.id}`;
            resourceItem.style.cursor = 'pointer';  
            resourceItem.style.padding = '5px';
            resourceItem.style.fontSize = '14px';
            //Make grey border

            resourceItem.style.margin = '5px';

            //Make display flex
            resourceItem.style.display = 'flex';
            resourceItem.style.justifyContent = 'space-between';
            const resourceTextDiv = document.createElement('div');
            resourceTextDiv.style.width = '85%';
            resourceTextDiv.style.textWrap = 'wrap';



            const resourceText = document.createElement('a');
            resourceText.textContent = resource.name;
            resourceText.style.overflowWrap = 'break-word';
            resourceText.href = resource.link;
            resourceTextDiv.appendChild(resourceText);

            resourceItem.appendChild(resourceTextDiv);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function(){
                resources = resources.filter(function(item){
                    return item.id !== resource.id;
                });
                renderResources();

            });
            resourceItem.appendChild(deleteButton);
        
           
            
            resourcesList.appendChild(resourceItem);

        });
        saveResources();
    }

    stopTimer.addEventListener('click', function(){
        vscode.postMessage({
            type: 'stop-timer'
        });
    });

    startTimer.addEventListener('click', function(){
        vscode.postMessage({
            type: 'start-timer'
        });
    });

    resetTimer.addEventListener('click', function(){


        vscode.postMessage({
            type: 'reset-timer'
        });
    });

    logTimer.addEventListener('click', function(){
        vscode.postMessage({
            type: 'log-timer'
        });
    });

    function renderLogs(){
        logsList.innerHTML = '';
        logs.forEach(function(log){
            const logDiv = document.createElement('div');
            logDiv.style.padding = '5px';
            logDiv.style.fontSize = '14px';
            logDiv.style.display = 'flex';
            logDiv.style.justifyContent = 'space-between';
            const logTextDiv = document.createElement('div');
            logTextDiv.style.width = '85%';
            const logText = document.createElement('span');
            logText.textContent = log.description;
            logTextDiv.appendChild(logText);
            const logTime = document.createElement('span');
            logTime.style.paddingLeft = '10px';
            let timeString = '';
            if(log.time.hours > 0){
                timeString += log.time.hours + 'h ';
            }
            if(log.time.minutes > 0){
                timeString += log.time.minutes + 'm ';
            }
            if(log.time.seconds > 0){
                timeString += log.time.seconds + 's';
            }
            logTime.textContent = timeString;
            logTextDiv.appendChild(logTime);
            logDiv.appendChild(logTextDiv);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function(){
                logs = logs.filter(function(item){
                    return item.description !== log.description && item.time !== log.time; 
                });
                renderLogs();
            });
            logDiv.appendChild(deleteButton);
            logsList.appendChild(logDiv);
        });
    }

    
   
}());