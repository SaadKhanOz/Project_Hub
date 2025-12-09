// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupLogout();
    setupProfileMenu();
});

async function checkSession() {
    try {
        const response = await fetch('includes/check_session.php');
        const data = await response.json();
        
        if (!data.logged_in) {
            window.location.href = 'login.html';
            return;
        }

        // Set user details
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        userName.textContent = data.user.full_name;
        userEmail.textContent = data.user.email;

        // Set avatar (either profile picture or initials)
        if (data.user.profile_picture) {
            userAvatar.innerHTML = `<img src="${data.user.profile_picture}" alt="Profile Picture">`;
        } else {
            const initials = data.user.full_name.split(' ').map(n => n[0]).join('');
            userAvatar.textContent = initials;
        }
    } catch (error) {
        console.error('Session check failed:', error);
        window.location.href = 'login.html';
    }
}

function setupProfileMenu() {
    const userAvatar = document.getElementById('userAvatar');
    const profileMenu = document.getElementById('profileMenu');

    // Toggle profile menu
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
    });

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target) && !userAvatar.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });
}

function setupLogout() {
    const logoutButton = document.querySelector('.profile-link.logout');
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('includes/logout.php');
            const data = await response.json();
            
            if (data.status === 'success') {
                // Clear any stored user data
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('userEmail');
                
                // Redirect to login page
                window.location.href = 'login.html';
            } else {
                alert('Logout failed: ' + data.message);
            }
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    });
}

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