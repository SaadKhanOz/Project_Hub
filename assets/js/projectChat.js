// Project Chat JS
let currentProjectId = null;
let currentProjectName = '';
let pollingInterval = null;

// DOM elements
const projectList = document.getElementById('projectList');
const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const attachBtn = document.getElementById('attachBtn');
const chatProjectName = document.getElementById('chatProjectName');
const projectIdDisplay = document.getElementById('projectId');

// Load projects for sidebar
async function loadProjects() {
    const res = await fetch('includes/get_user_speci_proj.php');
    const data = await res.json();
    if (data.success) {
        projectList.innerHTML = '';
        data.projects.forEach(proj => {
            const li = document.createElement('li');
            li.textContent = proj.project_name;
            li.dataset.projectId = proj.project_id;
            li.addEventListener('click', () => selectProject(proj.project_id, proj.project_name, li));
            projectList.appendChild(li);
        });
        // Auto-select first project
        if (data.projects.length > 0) {
            selectProject(data.projects[0].project_id, data.projects[0].project_name, projectList.firstChild);
        }
    } else {
        projectList.innerHTML = '<li>No projects found</li>';
    }
}

function selectProject(projectId, projectName, liElem) {
    currentProjectId = projectId;
    currentProjectName = projectName;
    chatProjectName.textContent = projectName;
    projectIdDisplay.textContent = projectId;
    // Highlight active
    Array.from(projectList.children).forEach(li => li.classList.remove('active'));
    if (liElem) liElem.classList.add('active');
    loadMessages();
    // Clear previous polling interval
    if (pollingInterval) clearInterval(pollingInterval);
    // Start polling for new messages every 1 second
    pollingInterval = setInterval(loadMessages, 1000);
}

// Load messages for selected project
async function loadMessages() {
    messagesContainer.innerHTML = '<div style="color:#888;">Loading messages...</div>';
    const res = await fetch(`includes/get_project_messages.php?project_id=${currentProjectId}`);
    const data = await res.json();
    if (data.success) {
        messagesContainer.innerHTML = '';
        if (data.messages.length === 0) {
            messagesContainer.innerHTML = '<div style="color:#888;">No messages yet.</div>';
        }
        data.messages.forEach(msg => {
            messagesContainer.appendChild(renderMessage(msg));
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        messagesContainer.innerHTML = `<div style='color:red;'>${data.message || 'Failed to load messages.'}</div>`;
    }
}

// Render a single message
function renderMessage(msg) {
    const div = document.createElement('div');
    // Add 'sent' class if the message is from the current user
    const isSent = msg.user_id == window.currentUserId;
    div.className = 'message-row' + (isSent ? ' sent' : '');
    div.innerHTML = `
        <div class="message-avatar">
            ${msg.profile_picture ? `<img src="${msg.profile_picture}" alt="avatar">` : `<span>${getInitials(msg.full_name)}</span>`}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${msg.full_name}</span>
                <span class="message-time">${formatTime(msg.sent_at)}</span>
            </div>
            <div class="message-text">${escapeHTML(msg.message)}</div>
            ${msg.file_path ? `<div class="message-file"><a href="${msg.file_path}" download target="_blank">📎 Download file</a></div>` : ''}
        </div>
    `;
    return div;
}

// Send message (with file)
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProjectId) return;
    const msg = messageInput.value.trim();
    const file = fileInput.files[0];
    if (!msg && !file) return;
    const formData = new FormData();
    formData.append('project_id', currentProjectId);
    formData.append('message', msg);
    if (file) formData.append('file', file);
    messageInput.value = '';
    fileInput.value = '';
    try {
        const res = await fetch('includes/send_project_message.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            loadMessages();
        } else {
            alert(data.message || 'Failed to send message.');
        }
    } catch (err) {
        alert('Failed to send message.');
    }
});

// Attach file button
attachBtn.addEventListener('click', () => {
    fileInput.click();
});

// Show selected file name (optional, can be improved)
fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
        messageInput.value = messageInput.value + ` [File: ${fileInput.files[0].name}]`;
    }
});

// Helpers
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}
function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
}
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return charsToReplace[tag] || tag;
    });
}

// Get current user ID for sent message highlighting
fetch('includes/check_session.php')
  .then(res => res.json())
  .then(data => {
    if (data.logged_in) {
      window.currentUserId = data.user.user_id;
    }
  });

// Initial load
loadProjects();

// Optionally, clear polling when leaving the page
window.addEventListener('beforeunload', () => {
    if (pollingInterval) clearInterval(pollingInterval);
});
