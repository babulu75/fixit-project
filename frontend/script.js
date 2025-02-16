async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form data
    const form = event.target;
    const formData = new FormData(form);

    // Convert FormData to a plain object
    const data = Object.fromEntries(formData.entries());

    // Validate CAPTCHA
    const captchaInput = data.captcha; // Ensure this matches the `name` attribute in the HTML
    const captchaCode = document.getElementById('captcha-code-login').textContent;

    if (!captchaInput || !captchaCode) {
        alert('CAPTCHA validation failed. Please try again.');
        generateCaptcha('captcha-code-login'); // Regenerate CAPTCHA
        return;
    }

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
        alert('Invalid CAPTCHA. Please try again.');
        generateCaptcha('captcha-code-login'); // Regenerate CAPTCHA
        return;
    }

    try {
        // Send data to the backend
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email, password: data.password }) // Send only required fields
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            closePopup('loginPopup');
            window.location.href = 'dashboard.html'; // Redirect to dashboard
        } else {
            alert(result.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        alert('Error logging in. Please try again later.');
        console.error(error);
    }
}


// Function to handle signup form submission
async function handleSignup(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form data
    const form = event.target;
    const formData = new FormData(form);

    // Convert FormData to a plain object
    const data = Object.fromEntries(formData.entries());

    // Validate CAPTCHA
    const captchaInput = data.captcha;
    const captchaCode = document.getElementById('captcha-code-signup').textContent;
    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
        alert('Invalid CAPTCHA. Please try again.');
        generateCaptcha('captcha-code-signup'); // Regenerate CAPTCHA
        return;
    }

    // Validate password strength
    if (!validatePassword(data.password)) {
        alert('Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
        return;
    }

    // Match password and confirm password
    if (data.password !== data.confirm_password) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    try {
        // Send data to the backend
        const response = await fetch('http://localhost:5000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            closePopup('signupPopup');
            openPopup('loginPopup'); // Redirect to login popup
        } else {
            alert(result.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        alert('Error signing up. Please try again later.');
        console.error(error);
    }
}

// Function to validate password strength
function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return regex.test(password);
}

// Function to generate CAPTCHA
function generateCaptcha(containerId) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById(containerId).textContent = captcha;
}

// Initialize CAPTCHA for signup form
generateCaptcha('captcha-code-signup');

// Initialize CAPTCHA for login form
generateCaptcha('captcha-code-login');

// Function to toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Function to open a popup
function openPopup(popupId) {
    document.getElementById(popupId).style.display = 'flex';
}

// Function to close a popup
function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Function to switch between login and signup popups
function switchPopup(currentPopupId, targetPopupId) {
    closePopup(currentPopupId);
    openPopup(targetPopupId);
}