// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    let projectName = '';
    let resources = [];
    const projectNameElement = document.querySelector('.project-name');
    const resourcesList = document.querySelector('.resources-list');
    const addResourceButton = document.querySelector('.add-resource-button');

    document.addEventListener('DOMContentLoaded', function () {
        vscode.postMessage({
            type: 'get-project-name'
        });
        vscode.postMessage({
            type: 'get-resources'
        });
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'project-name':
                projectName = message.projectName;
                projectNameElement.textContent = "Project: " + projectName;
                break;
            case 'update-resources':
                resources = message.resources;
                renderResources();
                break;
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

    
   
}());