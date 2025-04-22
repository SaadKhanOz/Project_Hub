// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // User profile setup
    const userAvatar = document.getElementById('userAvatar');
    const profileMenu = document.getElementById('profileMenu');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    // Set user details (replace with actual user data)
    const user = {
        name: 'Saad Khan',
        email: 'saad.khan@example.com'
    };

    // Set avatar initials
    userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('');
    userName.textContent = user.name;
    userEmail.textContent = user.email;

    // Toggle profile menu
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
    });

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target) && profileMenu.classList.contains('active')) {
            profileMenu.classList.remove('active');
        }
    });

    // Handle logout
    const logoutButton = document.querySelector('.profile-link.logout');
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Add any logout logic here (e.g., clearing session)
        window.location.href = 'index.html';
    });
});

// Toggle profile menu
function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('active');

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        const isClickInside = profileMenu.contains(e.target) || 
                            e.target.closest('.user-profile');
        
        if (!isClickInside) {
            profileMenu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Generate initials from name
function generateInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Generate consistent color based on name
function generateAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
        '#FF5630', '#FF8B00', '#36B37E', '#00B8D9', 
        '#6554C0', '#172B4D', '#091E42', '#0052CC'
    ];
    
    return colors[Math.abs(hash) % colors.length];
}

// Handle logout
document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    // Here we'll add the actual logout logic later
    window.location.href = 'login.html';
}); 