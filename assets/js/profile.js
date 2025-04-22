// Initialize profile functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
});

// Initialize profile data and avatar
function initializeProfile() {
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        const fullName = document.getElementById('fullName').value;
        updateAvatar(fullName);
    }
}

// Update avatar with user's initials and color
function updateAvatar(name) {
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        const initials = generateInitials(name);
        const color = generateAvatarColor(name);
        
        avatar.style.backgroundColor = color;
        avatar.querySelector('span').textContent = initials;
    }
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

// Handle profile form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updates = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmNewPassword: formData.get('confirmNewPassword'),
        emailNotifications: formData.get('emailNotifications') === 'on',
        taskReminders: formData.get('taskReminders') === 'on'
    };

    // Validate password change if attempted
    if (updates.newPassword) {
        if (updates.newPassword !== updates.confirmNewPassword) {
            alert('New passwords do not match!');
            return;
        }
        
        if (updates.newPassword.length < 8) {
            alert('New password must be at least 8 characters long!');
            return;
        }
        
        if (!updates.currentPassword) {
            alert('Please enter your current password to change it!');
            return;
        }
    }

    try {
        // Here we'll add the actual API call later
        console.log('Profile update:', updates);
        
        // Update the avatar if name changed
        updateAvatar(updates.fullName);
        
        // Show success message
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Profile update failed:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Toggle password visibility functions
function toggleCurrentPassword() {
    togglePasswordVisibility('currentPassword', event.currentTarget);
}

function toggleNewPassword() {
    togglePasswordVisibility('newPassword', event.currentTarget);
}

function toggleConfirmNewPassword() {
    togglePasswordVisibility('confirmNewPassword', event.currentTarget);
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    
    if (input.type === 'password') {
        input.type = 'text';
        button.style.color = '#0052CC';
    } else {
        input.type = 'password';
        button.style.color = '#6B778C';
    }
} 