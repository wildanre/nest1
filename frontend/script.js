// API Base URL
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const messageDiv = document.getElementById('message');
const profileDiv = document.getElementById('profile');
const profileInfo = document.getElementById('profileInfo');

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (token) {
        fetchUserProfile();
    }
    
    // Check URL parameters for codes
    checkUrlParameters();
    
    // Add form event listeners
    setupFormEventListeners();
    
    // Add auto-format for code inputs
    setupCodeInputs();
});

// Setup auto-formatting for code inputs
function setupCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Only allow numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // Limit to 6 digits
            if (e.target.value.length > 6) {
                e.target.value = e.target.value.slice(0, 6);
            }
        });
    });
}

// Check URL parameters for verification or reset codes
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyCode = urlParams.get('verify');
    const resetCode = urlParams.get('reset');
    
    if (verifyCode) {
        showTab('verify-email');
        document.getElementById('verifyCode').value = verifyCode;
        showMessage('Verification code detected from URL. Click "Verify Email" to proceed.', 'info');
    }
    
    if (resetCode) {
        showTab('reset-password');
        document.getElementById('resetCode').value = resetCode;
        showMessage('Reset code detected from URL. Enter your new password below.', 'info');
    }
}

// Setup form event listeners
function setupFormEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        await register(email, password, firstName, lastName);
    });

    // Forgot password form
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        await forgotPassword(email);
    });

    // Verify email form
    document.getElementById('verifyEmailForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('verifyCode').value;
        await verifyEmail(code);
    });

    // Resend verification form
    document.getElementById('resendVerificationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resendEmail').value;
        await resendVerification(email);
    });

    // Reset password form
    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('resetCode').value;
        const newPassword = document.getElementById('newPassword').value;
        await resetPassword(code, newPassword);
    });
}

// Show/Hide tabs
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Show message
function showMessage(message, type = 'info') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// API Functions
async function makeRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
async function register(email, password, firstName, lastName) {
    try {
        const data = await makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, firstName, lastName })
        });
        
        showMessage(data.message, 'success');
        document.getElementById('registerForm').reset();
        
        // Switch to verify email tab
        setTimeout(() => {
            showTab('verify-email');
            document.getElementById('resendEmail').value = email;
        }, 2000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function login(email, password) {
    try {
        const data = await makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store token
        localStorage.setItem('authToken', data.access_token);
        
        showMessage('Login successful!', 'success');
        document.getElementById('loginForm').reset();
        
        // Show profile
        displayUserProfile(data.user);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function forgotPassword(email) {
    try {
        const data = await makeRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        showMessage(data.message, 'success');
        document.getElementById('forgotPasswordForm').reset();
        
        // Show reset password tab
        setTimeout(() => {
            showTab('reset-password');
        }, 2000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function verifyEmail(code) {
    try {
        // Validate 6-digit code
        if (!/^\d{6}$/.test(code)) {
            showMessage('Please enter a valid 6-digit code', 'error');
            return;
        }
        
        const data = await makeRequest('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        
        showMessage(data.message, 'success');
        document.getElementById('verifyEmailForm').reset();
        
        // Switch to login tab
        setTimeout(() => {
            showTab('login');
        }, 2000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function resendVerification(email) {
    try {
        const data = await makeRequest('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        showMessage(data.message, 'success');
        document.getElementById('resendVerificationForm').reset();
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function resetPassword(code, newPassword) {
    try {
        // Validate 6-digit code
        if (!/^\d{6}$/.test(code)) {
            showMessage('Please enter a valid 6-digit code', 'error');
            return;
        }
        
        const data = await makeRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ code, newPassword })
        });
        
        showMessage(data.message, 'success');
        document.getElementById('resetPasswordForm').reset();
        
        // Switch to login tab
        setTimeout(() => {
            showTab('login');
        }, 2000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const data = await makeRequest('/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        displayUserProfile(data);
        
    } catch (error) {
        // Token might be expired
        localStorage.removeItem('authToken');
        showMessage('Session expired. Please login again.', 'error');
    }
}

function displayUserProfile(user) {
    // Hide all tabs and show profile
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    profileDiv.classList.add('active');
    
    // Display user information
    profileInfo.innerHTML = `
        <h3>Welcome, ${user.firstName} ${user.lastName}!</h3>
        <div class="profile-field">
            <span><strong>ID:</strong></span>
            <span>${user.id}</span>
        </div>
        <div class="profile-field">
            <span><strong>Email:</strong></span>
            <span>${user.email}</span>
        </div>
        <div class="profile-field">
            <span><strong>First Name:</strong></span>
            <span>${user.firstName}</span>
        </div>
        <div class="profile-field">
            <span><strong>Last Name:</strong></span>
            <span>${user.lastName}</span>
        </div>
        <div class="profile-field">
            <span><strong>Email Verified:</strong></span>
            <span style="color: ${user.isEmailVerified ? 'green' : 'red'}">
                ${user.isEmailVerified ? '✓ Verified' : '✗ Not Verified'}
            </span>
        </div>
        <div class="profile-field">
            <span><strong>Account Status:</strong></span>
            <span style="color: ${user.isActive ? 'green' : 'red'}">
                ${user.isActive ? '✓ Active' : '✗ Inactive'}
            </span>
        </div>
        <div class="profile-field">
            <span><strong>Member Since:</strong></span>
            <span>${new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('authToken');
    
    // Hide profile and show login tab
    profileDiv.classList.remove('active');
    showTab('login');
    
    showMessage('Logged out successfully!', 'success');
    
    // Reset all forms
    document.querySelectorAll('form').forEach(form => form.reset());
}
