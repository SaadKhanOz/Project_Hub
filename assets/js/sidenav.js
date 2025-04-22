document.addEventListener('DOMContentLoaded', function() {
    // Handle dropdown toggles in side navigation
    const dropdowns = document.querySelectorAll('.side-nav .dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-item');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
            
            // Close other dropdowns
            dropdowns.forEach(other => {
                if (other !== dropdown && other.classList.contains('active')) {
                    other.classList.remove('active');
                }
            });
        });
    });

    // Handle mobile menu toggle
    const menuButton = document.querySelector('.menu-button');
    const sideNav = document.querySelector('.side-nav');
    
    if (menuButton && sideNav) {
        menuButton.addEventListener('click', () => {
            sideNav.classList.toggle('active');
        });
    }

    // Close side nav when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sideNav.contains(e.target) && !menuButton.contains(e.target)) {
                sideNav.classList.remove('active');
            }
        }
    });

    // Set active states based on current page
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Remove all active classes first
    document.querySelectorAll('.side-nav .nav-item, .side-nav .dropdown-content a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and set active link
    const activeLink = document.querySelector(`.side-nav a[href="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        
        // If it's in a dropdown, activate the dropdown too
        const parentDropdown = activeLink.closest('.dropdown');
        if (parentDropdown) {
            parentDropdown.classList.add('active');
            const dropdownToggle = parentDropdown.querySelector('.nav-item');
            if (dropdownToggle) {
                dropdownToggle.classList.add('active');
            }
        }
    }
}); 