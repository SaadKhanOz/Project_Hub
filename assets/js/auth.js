// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const button = event.currentTarget;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        button.style.color = '#0052CC';
    } else {
        passwordInput.type = 'password';
        button.style.color = '#6B778C';
    }
}

function toggleConfirmPassword() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const button = event.currentTarget;
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        button.style.color = '#0052CC';
    } else {
        confirmPasswordInput.type = 'password';
        button.style.color = '#6B778C';
    }
}

// Form validation and submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    try {
        // Here we'll add the actual API call later
        console.log('Login attempt:', { email, password, remember });
        
        // For now, simulate successful login
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials and try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long!');
        return;
    }

    try {
        // Here we'll add the actual API call later
        console.log('Signup attempt:', { fullName, email, password });
        
        // For now, simulate successful signup
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Signup failed:', error);
        alert('Signup failed. Please try again.');
    }
}

// Generate avatar color based on name
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

// Generate initials from name
function generateInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
} 