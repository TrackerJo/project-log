// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {

    let tasks = [];

    let projectName = '';

   

    const tasksForm = document.getElementById('tasks-form');
    const tasksInput = document.getElementById('tasks-input');
    const tasksList = document.getElementById('tasks-list');
    const tasksContent = document.querySelector('.tasks-content');
    const tasksListPane = document.querySelector('.tasks-list-pane');
    const completedList = document.getElementById('completed-tasks-list');
    const completedContent = document.querySelector('.completed-tasks-content');
    

    tasksForm.addEventListener('submit', function(e){
        e.preventDefault();
       addTask();

    });


    function addTask(){
        if(!tasksInput.value){
            vscode.postMessage({
                type:"onError",
                value: 'Please enter a todo item.'
            });
            return;
        }
        tasks.push({
            id: tasks.length + 1,
            text: tasksInput.value,
            completed: false
        });
        tasksInput.value = '';
        
        renderTasks();


    }

    function saveTasks(){
        vscode.postMessage({
            type: 'save-tasks',
            tasks: tasks,
            projectName: projectName
        });
    }

    function renderTasks(){
        tasksList.innerHTML = '';
        tasks.forEach(function(task){
            //Update the todo id
            task.id = tasks.indexOf(task) + 1;
            tasks[tasks.findIndex(x => x.id === task.id)] = task;
            if(task.completed){
                return;
            }
            const taskItem = document.createElement('div');
            taskItem.id = `task-${task.id}`;
            taskItem.style.cursor = 'pointer';  
            taskItem.style.padding = '5px';
            taskItem.style.fontSize = '14px';
            //Make grey border

            taskItem.style.margin = '5px';

            //Make display flex
            taskItem.style.display = 'flex';
            taskItem.style.justifyContent = 'space-between';
            const taskTextDiv = document.createElement('div');
            taskTextDiv.style.width = '85%';
            taskTextDiv.style.textWrap = 'wrap';



            const taskText = document.createElement('p');
            taskText.innerHTML = task.text;
            taskText.style.overflowWrap = 'break-word';
            taskTextDiv.appendChild(taskText);

            taskItem.appendChild(taskTextDiv);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function(){
                tasks = tasks.filter(function(item){
                    return item.id !== task.id;
                });
                renderTasks();
                saveTasks();
            });
            taskItem.appendChild(deleteButton);
            
            

            if(task.completed){
                taskItem.style.textDecoration = 'line-through';
                taskItem.style.color = 'grey';
                

            }
           
            taskItem.addEventListener('click', function(){
                task.completed = !task.completed;
                taskItem.style.textDecoration = 'line-through';
                taskItem.style.color = 'grey';

                //Animate the todo item falling off the list
                taskItem.animate([
                    { transform: 'translateX(0px)', opacity: 1 },
                    { transform: 'translateX(100px)', opacity: 0 }
                ], {
                    duration: 500,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });
                setTimeout(function(){
                    
                    renderTasks();
                }, 500);
                renderCompletedTasks();

            });
            tasksList.appendChild(taskItem);
        });
        if (tasksContent.style.maxHeight){
            tasksContent.style.maxHeight = tasksContent.scrollHeight + "px";
        }
        //Save the todos
        saveTasks();
    }

    function renderCompletedTasks(){
        completedList.innerHTML = '';
        const completedTasks = tasks.filter(function(task){
            return task.completed;
        });
        completedTasks.forEach(function(task){
            //Update the todo id
            completedTasks.id = completedTasks.indexOf(task) + 1;
            completedTasks[completedTasks.findIndex(x => x.id === task.id)] = task;
            const taskItem = document.createElement('div');
            taskItem.id = `task-${task.id}`;
            taskItem.style.cursor = 'pointer';  
            taskItem.style.padding = '5px';
            taskItem.style.fontSize = '14px';
            //Make grey border

            taskItem.style.margin = '5px';

            //Make display flex
            taskItem.style.display = 'flex';
            taskItem.style.justifyContent = 'space-between';
            const taskTextDiv = document.createElement('div');
            taskTextDiv.style.width = '85%';
            taskTextDiv.style.textWrap = 'wrap';



            const taskText = document.createElement('p');
            taskText.innerHTML = task.text;
            taskText.style.overflowWrap = 'break-word';
            taskTextDiv.appendChild(taskText);

            taskItem.appendChild(taskTextDiv);
            const deleteButton = document.createElement('i');
            deleteButton.className = 'codicon codicon-trash';
            deleteButton.style.width = '14px';
            deleteButton.style.height = '14px';
            deleteButton.style.float = 'right';
            deleteButton.style.cursor = 'pointer';
            deleteButton.style.margin = '5px';
            deleteButton.addEventListener('click', function(){
                tasks = tasks.filter(function(item){
                    if(item.completed){
                        return item.id !== task.id;
                    }
                    return item;
                });
                
                renderCompletedTasks();

            });
            taskItem.appendChild(deleteButton);
            
            taskItem.addEventListener('click', function(){
                task.completed = !task.completed;

                //Animate the todo item falling off the list
                taskItem.animate([
                    { transform: 'translateX(0px)', opacity: 1 },
                    { transform: 'translateX(100px)', opacity: 0 }
                ], {
                    duration: 500,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });
                setTimeout(function(){
                    
                    renderCompletedTasks();
                }, 500);
                renderTasks();
            });
            completedList.appendChild(taskItem);
        });
        if (completedContent.style.maxHeight){
            completedContent.style.maxHeight = completedContent.scrollHeight + "px";
           }
        //Save the todos
        saveTasks();
    }



    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        switch (message.type) {
            case 'update-tasks':
                tasks = message.tasks;
                renderTasks();
                break;
            case 'get-project-tasks':

                projectName = message.projectName;
                tasks = message.tasks;

                renderTasks();

                renderCompletedTasks();

                break;
            case 'view-tasks':
                tasksListPane.classList.toggle("active");
                const indicator = tasksListPane.querySelector('.tasks-pane-indicator');

                if(indicator.classList.contains('codicon-chevron-down')){
                    indicator.classList.remove('codicon-chevron-down');
                    indicator.classList.add('codicon-chevron-right');
                    
                } else {
                    indicator.classList.remove('codicon-chevron-right');
                    indicator.classList.add('codicon-chevron-down');

                }
                const content = tasksListPane.nextElementSibling;
                if (content.style.maxHeight){
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                } 


        }
    });


    window.addEventListener('DOMContentLoaded', (event) => {
        

        vscode.postMessage({
            type: 'get-project-tasks'
        });
    });

    const panes = document.querySelectorAll(".tasks-pane");

    for (let i = 0; i < panes.length; i++) {
        panes[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const indicator = this.querySelector('.tasks-pane-indicator');
            console.log(indicator);
            if(indicator.classList.contains('codicon-chevron-down')){
                indicator.classList.remove('codicon-chevron-down');
                indicator.classList.add('codicon-chevron-right');
                
            } else {
                indicator.classList.remove('codicon-chevron-right');
                indicator.classList.add('codicon-chevron-down');

            }
            const content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            } 
        });
    }

   
}());