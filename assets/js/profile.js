// Function to load user profile data
function loadUserProfile() {
    console.log('Loading user profile...');
    fetch('includes/get_user_profile.php')
        .then(response => {
            console.log('Raw response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Profile data received:', data);
            if (data.success) {
                updateProfilePictures(data.profile_picture, data.full_name);
                
                // Update form fields if they exist
                const fullNameInput = document.getElementById('fullName');
                const emailInput = document.getElementById('email');
                if (fullNameInput) fullNameInput.value = data.full_name || '';
                if (emailInput) emailInput.value = data.email || '';

                // Update user info in menu
                const userNameElement = document.getElementById('userName');
                const userEmailElement = document.getElementById('userEmail');
                if (userNameElement) userNameElement.textContent = data.full_name || 'User';
                if (userEmailElement) userEmailElement.textContent = data.email || '';
            } else {
                console.error('Error loading user profile:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Show default avatar on error
            updateProfilePictures(null, 'U');
        });
}

// Function to update all profile pictures on the page
function updateProfilePictures(profilePicture, fullName) {
    const userAvatar = document.getElementById('userAvatar');
    const currentProfilePic = document.getElementById('currentProfilePic');
    
    const updateElement = (element) => {
        if (!element) return;
        
        if (profilePicture && profilePicture.trim() !== '') {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const imgSrc = `${profilePicture}?t=${timestamp}`;
            element.innerHTML = `<img src="${imgSrc}" alt="Profile Picture">`;
        } else {
            const initial = (fullName || 'U')[0].toUpperCase();
            element.innerHTML = `<span>${initial}</span>`;
        }
    };

    updateElement(userAvatar);
    updateElement(currentProfilePic);
}

function setupImageUpload() {
    const fileInput = document.getElementById('profilePicture');
    const currentProfilePic = document.getElementById('currentProfilePic');
    
    if (!fileInput || !currentProfilePic) {
        console.log('Profile picture elements not found, skipping setup');
        return;
    }
    
    console.log('Setting up image upload...');
    
    // Make the entire profile picture area clickable
    currentProfilePic.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await fetch('includes/upload_profile_picture.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Upload response:', data);

            if (data.status === 'success') {
                // Force reload user profile data to update all instances
                loadUserProfile();
                alert('Profile picture updated successfully!');
            } else {
                alert(data.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
        }
    });
}

function setupPasswordToggles() {
    // Only setup password toggles if we're on the profile settings page
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    
    if (currentPassword) {
        setupPasswordToggle('currentPassword');
    }
    if (newPassword) {
        setupPasswordToggle('newPassword');
    }
}

function setupPasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.nextElementSibling;
    if (!button) return;
    
    button.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
        button.style.color = input.type === 'text' ? '#0052CC' : '#6B778C';
    });
}

function setupFormSubmit() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById('fullName').value,
            current_password: document.getElementById('currentPassword').value,
            new_password: document.getElementById('newPassword').value || null
        };

        try {
            const response = await fetch('includes/update_profile.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('Profile updated successfully!');
                // Reload profile data
                loadUserProfile();
            } else {
                alert(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
}

// Utility functions for avatar
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

function generateInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Initialize profile menu functionality
function initializeProfileMenu() {
    console.log('Initializing profile menu...');
    const userAvatar = document.getElementById('userAvatar');
    const profileMenu = document.getElementById('profileMenu');
    
    if (!userAvatar || !profileMenu) {
        console.error('Profile menu elements not found:', {
            userAvatar: !!userAvatar,
            profileMenu: !!profileMenu
        });
        return;
    }

    console.log('Found profile elements, setting up event listeners...');

    // Toggle menu on avatar click
    userAvatar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        profileMenu.classList.toggle('active');
        console.log('Menu active state:', profileMenu.classList.contains('active'));
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!userAvatar.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Prevent menu from closing when clicking inside it
    profileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// When the DOM is loaded, initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing profile functionality...');
    loadUserProfile();
    initializeProfileMenu();
    setupPasswordToggles();
    setupFormSubmit();
    setupImageUpload();
}); 