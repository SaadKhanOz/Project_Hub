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

    // Check if user is already logged in
    checkSession();
});

async function checkSession() {
    try {
        const response = await fetch('includes/check_session.php');
        const data = await response.json();
        
        // Only store the session state, don't redirect automatically
        window.isLoggedIn = data.logged_in && data.status === 'success';
    } catch (error) {
        console.error('Session check failed:', error);
        window.isLoggedIn = false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    try {
        const response = await fetch('includes/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Store remember me preference if checked
            if (remember) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('userEmail', email);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('userEmail');
            }

            // Only redirect after successful login
            window.location.href = 'home.html';
        } else {
            alert(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your connection and try again.');
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
        const response = await fetch('includes/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            alert('Registration successful! Please log in.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup failed:', error);
        alert('Signup failed. Please check your connection and try again.');
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