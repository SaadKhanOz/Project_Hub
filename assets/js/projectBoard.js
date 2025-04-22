document.addEventListener('DOMContentLoaded', () => {
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    // Sample project data (replace with actual data from backend)
    const project = {
        id: projectId,
        name: 'Website Redesign',
        tasks: [
            {
                id: 1,
                title: 'Design Homepage',
                description: 'Create new homepage design with modern UI',
                assignee: 'SK',
                priority: 'high',
                status: 'todo',
                dueDate: '2024-03-30'
            },
            {
                id: 2,
                title: 'Implement Navigation',
                description: 'Develop responsive navigation menu',
                assignee: 'JD',
                priority: 'medium',
                status: 'inProgress',
                dueDate: '2024-03-25'
            }
        ],
        team: [
            { id: 1, name: 'Saad Khan', initials: 'SK' },
            { id: 2, name: 'John Doe', initials: 'JD' }
        ]
    };

    // Initialize project
    initializeProject(project);

    // Add task button
    const addTaskButton = document.querySelector('.action-button');
    addTaskButton.addEventListener('click', () => {
        openTaskModal();
    });

    // Analytics button
    const analyticsButton = document.querySelector('.analytics-button');
    analyticsButton.addEventListener('click', () => {
        window.location.href = `projectAnalytics.html?id=${projectId}`;
    });
});

// Initialize project
function initializeProject(project) {
    // Set project name
    document.getElementById('projectName').textContent = project.name;

    // Initialize tasks
    project.tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        const column = document.getElementById(`${task.status}Column`).querySelector('.column-content');
        column.appendChild(taskElement);
    });

    // Initialize task table
    renderTaskTable(project.tasks);

    // Update task counts
    updateTaskCounts();

    // Initialize filters
    initializeFilters(project.tasks);
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-card';
    taskElement.draggable = true;
    taskElement.id = `task-${task.id}`;
    
    taskElement.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
            <div class="assignee">
                <div class="member-avatar">${task.assignee}</div>
            </div>
            <span class="priority ${task.priority}">${task.priority}</span>
        </div>
    `;

    // Add drag events
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);

    return taskElement;
}

// Drag and drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    const column = e.target.closest('.column-content');
    
    if (column && taskElement) {
        column.appendChild(taskElement);
        updateTaskCounts();
        // Here you would typically update the task status in your backend
    }
}

// Modal handlers
function openTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.style.display = 'block';

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close button
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', closeModal);

    // Form submission
    const form = document.getElementById('taskForm');
    form.addEventListener('submit', handleTaskSubmit);
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    modal.style.display = 'none';
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
        id: Date.now(),
        title: formData.get('taskTitle'),
        description: formData.get('taskDescription'),
        assignee: formData.get('assignee'),
        priority: formData.get('priority'),
        status: 'todo',
        dueDate: formData.get('dueDate')
    };

    // Create and add new task to board
    const taskElement = createTaskElement(taskData);
    const todoColumn = document.getElementById('todoColumn').querySelector('.column-content');
    todoColumn.appendChild(taskElement);

    // Add task to table
    const tasks = [...document.querySelectorAll('.task-card')].map(card => ({
        id: parseInt(card.id.split('-')[1]),
        title: card.querySelector('.task-title').textContent,
        description: card.querySelector('.task-description')?.textContent || '',
        assignee: card.querySelector('.member-avatar').textContent,
        priority: card.querySelector('.priority').textContent,
        status: card.closest('.board-column').id.replace('Column', ''),
        dueDate: new Date().toISOString().split('T')[0] // Today's date as default
    }));
    renderTaskTable(tasks);

    // Update counts and close modal
    updateTaskCounts();
    closeModal();
    e.target.reset();
}

// Update task counts
function updateTaskCounts() {
    const columns = ['todo', 'inProgress', 'done'];
    columns.forEach(status => {
        const column = document.getElementById(`${status}Column`);
        const count = column.querySelector('.column-content').children.length;
        column.querySelector('.task-count').textContent = count;
    });
}

// Render task table
function renderTaskTable(tasks) {
    const tableBody = document.getElementById('taskTableBody');
    tableBody.innerHTML = '';

    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
            </td>
            <td>
                <div class="assignee">
                    <div class="assignee-avatar">${task.assignee}</div>
                    <span>${task.assignee}</span>
                </div>
            </td>
            <td>
                <span class="status-badge ${task.status}">${formatStatus(task.status)}</span>
            </td>
            <td>
                <span class="priority-badge ${task.priority}">${task.priority}</span>
            </td>
            <td>${formatDate(task.dueDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-button" onclick="editTask(${task.id})">Edit</button>
                    <button class="action-button" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize filters
function initializeFilters(tasks) {
    const searchInput = document.getElementById('taskSearch');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');

    // Search functionality
    searchInput.addEventListener('input', () => filterTasks(tasks));

    // Status filter
    statusFilter.addEventListener('change', () => filterTasks(tasks));

    // Priority filter
    priorityFilter.addEventListener('change', () => filterTasks(tasks));
}

// Filter tasks
function filterTasks(tasks) {
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                            task.description.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    renderTaskTable(filteredTasks);
}

// Format status
function formatStatus(status) {
    switch (status) {
        case 'todo': return 'To Do';
        case 'inProgress': return 'In Progress';
        case 'done': return 'Done';
        default: return status;
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Edit task
function editTask(taskId) {
    // Open task modal with existing task data
    openTaskModal(taskId);
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove task from board
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }

        // Remove task from table
        const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
        if (row) {
            row.remove();
        }

        // Update counts
        updateTaskCounts();
    }
} 