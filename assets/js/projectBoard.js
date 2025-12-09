// Get project ID from URL
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

// Team Members Modal logic
function setupTeamMembersModal() {
    const teamMembersBtn = document.getElementById('teamMembersBtn');
    const teamMembersModal = document.getElementById('teamMembersModal');
    const closeTeamMembersModal = document.getElementById('closeTeamMembersModal');
    const teamMembersList = document.getElementById('teamMembersList');

    if (!teamMembersBtn || !teamMembersModal || !closeTeamMembersModal || !teamMembersList) {
        console.error('Team members modal elements not found');
        return;
    }

    teamMembersBtn.addEventListener('click', async () => {
        teamMembersModal.style.display = 'block';
        await loadTeamMembers();
    });

    closeTeamMembersModal.addEventListener('click', () => {
        teamMembersModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === teamMembersModal) {
            teamMembersModal.style.display = 'none';
        }
    });
}

// Initialize the board
document.addEventListener('DOMContentLoaded', () => {
    setSessionUserFromDOM();
    if (!projectId) {
        alert('No project ID specified');
        window.location.href = 'projects.html';
        return;
    }

    loadProjectDetails();
    loadTasks();
    setupTaskModal();
    setupDragAndDrop();
    setupFilters();
    setupInviteModal();
    setupTeamMembersModal();
    setupTaskFilter();
});

// Load project details
async function loadProjectDetails() {
    try {
        const response = await fetch(`includes/get_project_details.php?id=${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON response from server');
        }
        
        if (data.success) {
            document.getElementById('projectName').textContent = data.project.project_name;
        } else {
            throw new Error(data.message || 'Failed to load project details');
        }
    } catch (error) {
        console.error('Error loading project details:', error);
        alert('Failed to load project details: ' + error.message);
    }
}

// Load tasks for the project
async function loadTasks() {
    try {
        const response = await fetch(`includes/get_project_tasks.php?project_id=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            // Clear existing tasks
            document.querySelectorAll('.column-content').forEach(column => {
                column.innerHTML = '';
            });

            // Update task counts
            const taskCounts = {
                'To Do': 0,
                'In Progress': 0,
                'Done': 0
            };

            // Distribute tasks to columns
            data.tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                const columnId = getColumnId(task.status);
                document.querySelector(`#${columnId} .column-content`).appendChild(taskElement);
                taskCounts[task.status]++;
            });

            // Update task count displays
            Object.keys(taskCounts).forEach(status => {
                const columnId = getColumnId(status);
                document.querySelector(`#${columnId} .task-count`).textContent = taskCounts[status];
            });

            // Update task table
            updateTaskTable(data.tasks);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load tasks');
    }
}

// Create task element for board
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true;
    div.id = `task-${task.task_id}`;
    div.dataset.status = task.status;
    div.innerHTML = `
        <div class="task-header">
            <h4>${task.title}</h4>
            <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        <p class="task-description">${task.description || ''}</p>
        <div class="task-footer">
            <span class="task-status ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
        </div>
    `;

    // Add drag event listeners
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

// Setup drag and drop
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.column-content');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
    });
}

// Drag and drop event handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.column-content').forEach(column => {
        column.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    const taskElement = document.getElementById(taskId);
    const targetColumn = e.currentTarget;

    if (!taskElement || !targetColumn) return;

    // Get new status from column
    const newStatus = getStatusFromColumn(targetColumn.parentElement.id);
    const actualTaskId = taskId.replace('task-', '');

    try {
        // Update task status in database
        const response = await fetch('includes/update_task_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task_id: actualTaskId,
                status: newStatus
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Move task element to new column
            targetColumn.appendChild(taskElement);
            
            // Update task counts
            updateTaskCounts();
            
            // Update task in table
            const statusCell = document.querySelector(`tr[data-task-id="${actualTaskId}"] .status-cell`);
            if (statusCell) {
                statusCell.innerHTML = `<span class="status-badge ${newStatus.toLowerCase().replace(' ', '-')}">${newStatus}</span>`;
            }

            // Update the task card's status
            const taskStatusElement = taskElement.querySelector('.task-status');
            if (taskStatusElement) {
                taskStatusElement.textContent = newStatus;
                taskStatusElement.className = `task-status ${newStatus.toLowerCase().replace(' ', '-')}`;
            }
        } else {
            console.error('Failed to update task status:', data.message);
            alert('Failed to update task status: ' + (data.message || 'Unknown error'));
            // Don't reload entire board, just revert the task
            const originalColumn = document.querySelector(`#${getColumnId(taskElement.dataset.status)} .column-content`);
            if (originalColumn) {
                originalColumn.appendChild(taskElement);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update task status. Please try again.');
        // Revert the task to its original position
        const originalColumn = document.querySelector(`#${getColumnId(taskElement.dataset.status)} .column-content`);
        if (originalColumn) {
            originalColumn.appendChild(taskElement);
        }
    }
}

// Update task counts
function updateTaskCounts() {
    const columns = ['todoColumn', 'inProgressColumn', 'doneColumn'];
    columns.forEach(columnId => {
        const column = document.getElementById(columnId);
        const count = column.querySelector('.column-content').children.length;
        column.querySelector('.task-count').textContent = count;
    });
}

// Utility functions
function getColumnId(status) {
    const statusMap = {
        'To Do': 'todoColumn',
        'In Progress': 'inProgressColumn',
        'Done': 'doneColumn'
    };
    return statusMap[status] || 'todoColumn';
}

function getStatusFromColumn(columnId) {
    const statusMap = {
        'todoColumn': 'To Do',
        'inProgressColumn': 'In Progress',
        'doneColumn': 'Done'
    };
    return statusMap[columnId];
}

// Modal handling
function setupTaskModal() {
    const modal = document.getElementById('taskModal');
    const addTaskButton = document.querySelector('.action-button');
    const closeButton = document.querySelector('.close-button');

    // Add status field for edit mode
    const statusField = document.createElement('div');
    statusField.className = 'form-group';
    statusField.innerHTML = `
        <label for="status">Status</label>
        <select id="status" name="status" required>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
        </select>
    `;
    
    // Insert status field before the buttons
    const form = document.getElementById('taskForm');
    const buttonGroup = form.querySelector('.button-group');
    form.insertBefore(statusField, buttonGroup);
    
    // Hide status field by default (only show in edit mode)
    document.getElementById('status').closest('.form-group').style.display = 'none';

    addTaskButton.addEventListener('click', async () => {
        modal.querySelector('h2').textContent = 'Create New Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskForm').dataset.mode = 'create';
        delete document.getElementById('taskForm').dataset.taskId;
        document.getElementById('status').closest('.form-group').style.display = 'none';
        await populateAssigneeDropdown();
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Setup form submission
    form.addEventListener('submit', handleTaskSubmit);
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
}

// Handle task form submission (create or edit)
async function handleTaskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const taskId = isEdit ? form.dataset.taskId : null;
    const assigneeSelect = document.getElementById('assignee');
    const selectedAssignees = Array.from(assigneeSelect.selectedOptions).map(opt => opt.value);
    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('priority').value,
        status: isEdit ? document.getElementById('status').value : 'To Do',
        assignees: selectedAssignees,
        due_date: document.getElementById('dueDate').value
    };
    if (isEdit) {
        formData.task_id = taskId;
    } else {
        formData.project_id = projectId;
    }
    try {
        const response = await fetch(isEdit ? 'includes/update_task.php' : 'includes/create_task.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.status === 'success') {
            closeModal();
            loadTasks();
            alert(isEdit ? 'Task updated successfully' : 'Task created successfully');
        } else {
            throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} task`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to ${isEdit ? 'update' : 'create'} task: ` + error.message);
    }
}

// Helper to fetch assignees for a task
async function getTaskAssignees(taskId) {
    try {
        const response = await fetch(`includes/get_task_assignees.php?task_id=${taskId}`);
        const data = await response.json();
        if (data.success) {
            return data.assignees.map(a => a.email).join(', ');
        }
    } catch (e) {}
    return '';
}

// Update task table
async function updateTaskTable(tasks) {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';

    // Get filter values
    const searchText = document.querySelector('input[placeholder="Search tasks..."]').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchText) || 
                            task.description.toLowerCase().includes(searchText);
        const matchesStatus = statusFilter === 'All Status' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'All Priorities' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    for (const task of filteredTasks) {
        const tr = document.createElement('tr');
        tr.dataset.taskId = task.task_id;
        tr.dataset.status = task.status;
        // Fetch assignees for this task
        const assignees = await getTaskAssignees(task.task_id);
        tr.innerHTML = `
            <td>${task.title}</td>
            <td>${assignees}</td>
            <td class="status-cell"><span class="status-badge ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span></td>
            <td><span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span></td>
            <td>${task.due_date ? task.due_date : ''}</td>
            <td>
                <button onclick="editTask(${task.task_id})" class="action-btn edit">Edit</button>
                <button onclick="deleteTask(${task.task_id})" class="action-btn delete">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Setup filters
function setupFilters() {
    // Setup search input
    const searchInput = document.querySelector('input[placeholder="Search tasks..."]');
    searchInput.addEventListener('input', () => {
        loadTasks(); // This will trigger updateTaskTable with the current search value
    });

    // Setup status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', () => {
        loadTasks();
    });

    // Setup priority filter
    const priorityFilter = document.getElementById('priorityFilter');
    priorityFilter.addEventListener('change', () => {
        loadTasks();
    });
}

// Edit task
async function editTask(taskId) {
    try {
        // Get current task data
        const taskCard = document.getElementById(`task-${taskId}`);
        const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
        
        if (!taskCard || !taskRow) {
            throw new Error('Task not found');
        }

        // Get task details
        const title = taskRow.cells[0].textContent;
        const status = taskRow.querySelector('.status-badge').textContent;
        const priority = taskRow.querySelector('.priority-badge').textContent;
        const description = taskCard.querySelector('.task-description').textContent;

        // Populate modal with task data
        document.getElementById('taskTitle').value = title;
        document.getElementById('taskDescription').value = description;
        document.getElementById('priority').value = priority;
        document.getElementById('status').value = status;

        // Update modal for edit mode
        const modal = document.getElementById('taskModal');
        modal.querySelector('h2').textContent = 'Edit Task';
        document.getElementById('taskForm').dataset.mode = 'edit';
        document.getElementById('taskForm').dataset.taskId = taskId;
        
        // Show status field in edit mode
        document.getElementById('status').closest('.form-group').style.display = 'block';
        
        // Show modal
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error preparing edit:', error);
        alert('Failed to prepare task for editing');
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch('includes/delete_task.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task_id: taskId })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Remove task from board
            const taskCard = document.getElementById(`task-${taskId}`);
            if (taskCard) {
                taskCard.remove();
            }

            // Remove task from table
            const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
            if (taskRow) {
                taskRow.remove();
            }

            // Update task counts
            updateTaskCounts();
            
            alert('Task deleted successfully');
        } else {
            throw new Error(data.message || 'Failed to delete task');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete task: ' + error.message);
    }
}

// Setup invite modal functionality
function setupInviteModal() {
    const manageTeamButton = document.getElementById('manageTeamBtn');
    const inviteModal = document.getElementById('inviteModal');
    const inviteForm = document.getElementById('inviteForm');
    const closeButton = inviteModal.querySelector('.close-button');

    manageTeamButton.addEventListener('click', () => {
        inviteModal.style.display = 'block';
        loadPendingInvites();
    });

    closeButton.addEventListener('click', () => {
        closeInviteModal();
    });

    inviteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('inviteEmail');
        const email = emailInput.value.trim();

        try {
            const response = await fetch('includes/send_invite.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `email=${encodeURIComponent(email)}&project_id=${encodeURIComponent(projectId)}`
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('Invitation sent successfully!');
                emailInput.value = '';
                loadPendingInvites();
            } else {
                throw new Error(data.message || 'Failed to send invitation');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === inviteModal) {
            closeInviteModal();
        }
    });
}

async function loadPendingInvites() {
    const invitesList = document.getElementById('invitesList');
    try {
        const response = await fetch(`includes/get_pending_invites.php?project_id=${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data;
        try {
            const text = await response.text();
            data = JSON.parse(text);
        } catch (e) {
            console.error('Server response:', await response.text());
            throw new Error('Invalid response from server');
        }

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        invitesList.innerHTML = '';

        if (data.invites && data.invites.length > 0) {
            data.invites.forEach(invite => {
                const date = new Date(invite.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                const inviteElement = document.createElement('div');
                inviteElement.className = 'invite-item';
                inviteElement.innerHTML = `
                    <span class="invite-email">${invite.email}</span>
                    <span class="invite-info">
                        <span class="invite-date">${date}</span>
                        <span class="invite-status">Pending</span>
                    </span>
                    <button onclick="cancelInvite(${invite.invite_id})" class="cancel-invite">Cancel</button>
                `;
                invitesList.appendChild(inviteElement);
            });
        } else {
            invitesList.innerHTML = '<p class="no-invites">No pending invites</p>';
        }
    } catch (error) {
        console.error('Error loading pending invites:', error);
        invitesList.innerHTML = `
            <div class="error-message">
                <p>${error.message}</p>
                <button onclick="loadPendingInvites()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

async function cancelInvite(inviteId) {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
        return;
    }

    try {
        const response = await fetch('includes/cancel_invite.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ invite_id: inviteId })
        });

        const data = await response.json();

        if (data.status === 'success') {
            loadPendingInvites();
        } else {
            throw new Error(data.message || 'Failed to cancel invitation');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function closeInviteModal() {
    document.getElementById('inviteModal').style.display = 'none';
}

async function loadTeamMembers() {
    const teamMembersList = document.getElementById('teamMembersList');
    teamMembersList.innerHTML = '<li>Loading team members...</li>';
    
    try {
        const response = await fetch(`includes/get_project_members.php?project_id=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            teamMembersList.innerHTML = '';
            
            if (data.members.length === 0) {
                teamMembersList.innerHTML = '<li>No team members found</li>';
                return;
            }
            
            data.members.forEach(member => {
                const li = document.createElement('li');
                const initials = member.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
                
                li.innerHTML = `
                    <div class="member-info">
                        <div class="member-avatar">${initials}</div>
                        <div class="member-details">
                            <span class="member-name">${member.full_name}</span>
                            <span class="member-email">${member.email}</span>
                        </div>
                    </div>
                `;
                // Add Remove button if allowed
                if (data.is_creator && member.user_id !== data.current_user_id) {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-member';
                    removeBtn.textContent = 'Remove';
                    removeBtn.addEventListener('click', async () => {
                        if (confirm('Remove this member from the project?')) {
                            await removeProjectMember(member.user_id);
                            await loadTeamMembers();
                        }
                    });
                    li.appendChild(removeBtn);
                }
                teamMembersList.appendChild(li);
            });
        } else {
            teamMembersList.innerHTML = `<li>Error: ${data.message}</li>`;
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        teamMembersList.innerHTML = '<li>Error loading team members</li>';
    }
}

async function removeProjectMember(userId) {
    try {
        const response = await fetch('includes/remove_project_member.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, user_id: userId })
        });
        // Optionally, check for success here
    } catch (err) {
        alert('Failed to remove member.');
    }
}

// Fetch project members for assignee dropdown
async function populateAssigneeDropdown() {
    const assigneeSelect = document.getElementById('assignee');
    assigneeSelect.innerHTML = '';
    try {
        const response = await fetch(`includes/get_project_members.php?project_id=${projectId}`);
        const data = await response.json();
        if (data.success) {
            data.members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.user_id;
                option.textContent = member.full_name + ' (' + member.email + ')';
                assigneeSelect.appendChild(option);
            });
        } else {
            assigneeSelect.innerHTML = '<option value="">No members found</option>';
        }
    } catch (err) {
        assigneeSelect.innerHTML = '<option value="">Error loading members</option>';
    }
}

// Ensure sessionStorage has user_id and email for 'Me' option
function setSessionUserFromDOM() {
    // Try to get from a hidden input or data attribute if available
    let userId = sessionStorage.getItem('user_id');
    let email = sessionStorage.getItem('email');
    if (!userId || !email) {
        // Try to get from DOM (customize as needed)
        const metaUserId = document.querySelector('meta[name="current-user-id"]');
        const metaEmail = document.querySelector('meta[name="current-user-email"]');
        if (metaUserId && metaUserId.content) {
            userId = metaUserId.content;
            sessionStorage.setItem('user_id', userId);
        }
        if (metaEmail && metaEmail.content) {
            email = metaEmail.content;
            sessionStorage.setItem('email', email);
        }
    }
}

// Setup task filter
function setupTaskFilter() {
    // Implementation of task filter logic
} 