document.addEventListener('DOMContentLoaded', () => {
    // Sample project data (replace with actual data from backend)
    const projects = [
        {
            id: 1,
            name: 'Website Redesign',
            type: 'Kanban',
            description: 'Redesigning the company website with modern UI/UX',
            progress: 75,
            members: ['SK', 'JD', 'AM'],
            tasks: { total: 20, completed: 15 }
        },
        {
            id: 2,
            name: 'Mobile App Development',
            type: 'Scrum',
            description: 'Developing a new mobile app for customer engagement',
            progress: 45,
            members: ['SK', 'RK', 'MS'],
            tasks: { total: 30, completed: 12 }
        }
    ];

    const projectsGrid = document.getElementById('projectsGrid');
    const searchInput = document.getElementById('projectSearch');

    // Render project cards
    function renderProjects(projectsToRender) {
        projectsGrid.innerHTML = '';
        projectsToRender.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.onclick = () => window.location.href = `projectBoard.html?id=${project.id}`;
            
            card.innerHTML = `
                <div class="project-type">${project.type}</div>
                <div class="project-name">${project.name}</div>
                <div class="project-description">${project.description}</div>
                <div class="project-meta">
                    <div class="project-members">
                        ${project.members.map(member => `
                            <div class="member-avatar">${member}</div>
                        `).join('')}
                    </div>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                        <span>${project.progress}%</span>
                    </div>
                </div>
            `;
            
            projectsGrid.appendChild(card);
        });
    }

    // Initialize with all projects
    renderProjects(projects);

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProjects = projects.filter(project => 
            project.name.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm) ||
            project.type.toLowerCase().includes(searchTerm)
        );
        renderProjects(filteredProjects);
    });

    // Filter button functionality
    const filterButton = document.querySelector('.filter-button');
    filterButton.addEventListener('click', () => {
        const filterOptions = ['All', 'Kanban', 'Scrum'];
        // Implement filter dropdown or modal
        console.log('Filter options:', filterOptions);
    });
}); 