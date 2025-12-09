document.addEventListener('DOMContentLoaded', () => {
    // Initialize user avatar
    const userAvatar = document.getElementById('userAvatar');
    const fullName = document.getElementById('fullName').value;
    userAvatar.textContent = fullName.split(' ').map(n => n[0]).join('');

    // Handle form submission
    const profileForm = document.querySelector('.profile-form');
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(profileForm);
        const userData = Object.fromEntries(formData.entries());
        
        // Here you would typically send this data to your backend
        console.log('Saving user data:', userData);
        
        // Show success message
        alert('Profile updated successfully!');
    });

    // Handle avatar change button
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    changeAvatarBtn.addEventListener('click', () => {
        // Here you would typically open a file picker
        alert('Avatar change functionality will be implemented soon!');
    });
}); 