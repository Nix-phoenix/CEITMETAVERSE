/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UI Utilities - Shared Functions for Consistent UX/UI
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-24 right-4 z-[60] px-6 py-4 rounded-lg shadow-2xl border-2 transform transition-all duration-300 max-w-md`;
    
    // Style based on type
    const styles = {
        success: 'bg-green-900 border-green-500 text-green-100',
        error: 'bg-red-900 border-red-500 text-red-100',
        warning: 'bg-yellow-900 border-yellow-500 text-yellow-100',
        info: 'bg-blue-900 border-blue-500 text-blue-100'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.className += ` ${styles[type] || styles.info}`;
    
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="text-2xl">${icons[type] || icons.info}</span>
            <p class="font-semibold">${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show loading overlay
 * @param {string} message - Loading message (default: 'Loading...')
 */
function showLoading(message = 'Loading...') {
    // Remove existing loading overlay
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center';
    overlay.innerHTML = `
        <div class="bg-gray-900 border-2 border-blue-500 rounded-2xl p-8 text-center max-w-sm">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p class="text-xl font-semibold text-gray-100">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Show button loading state
 * @param {HTMLElement} button - Button element
 * @param {string} loadingText - Text to show while loading
 */
function setButtonLoading(button, loadingText = 'Processing...') {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            <span>${loadingText}</span>
        </div>
    `;
}

/**
 * Reset button from loading state
 * @param {HTMLElement} button - Button element
 */
function resetButton(button) {
    button.disabled = false;
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user is authenticated
 * @param {boolean} redirectIfNot - Redirect to login if not authenticated
 * @returns {boolean} True if authenticated
 */
function requireAuth(redirectIfNot = true) {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        if (redirectIfNot) {
            showToast('Please login to continue', 'warning');
            setTimeout(() => {
                window.location.href = 'LogIn.html';
            }, 1000);
        }
        return false;
    }
    return true;
}

/**
 * Update auth UI elements
 */
function updateAuthUI() {
    const token = sessionStorage.getItem('authToken');
    const loginLinks = document.querySelectorAll('#loginLink, .login-link');
    const logoutBtns = document.querySelectorAll('#logoutBtn, .logout-btn');
    const authRequired = document.querySelectorAll('.auth-required');
    
    if (token) {
        loginLinks.forEach(el => el.style.display = 'none');
        logoutBtns.forEach(el => el.style.display = 'block');
        authRequired.forEach(el => el.classList.remove('hidden'));
    } else {
        loginLinks.forEach(el => el.style.display = 'block');
        logoutBtns.forEach(el => el.style.display = 'none');
        authRequired.forEach(el => el.classList.add('hidden'));
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        localStorage.removeItem('profilePicture');
        showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'LogIn.html';
        }, 1000);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {isValid: boolean, strength: string, message: string}
 */
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 'weak';
    let score = 0;
    
    if (password.length >= minLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';
    
    return {
        isValid: password.length >= minLength,
        strength: strength,
        score: score,
        message: password.length < minLength 
            ? `Password must be at least ${minLength} characters`
            : ''
    };
}

/**
 * Show field error
 * @param {HTMLElement} field - Input field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    field.classList.add('border-red-500', 'ring-2', 'ring-red-500');
    
    let errorDiv = field.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('field-error')) {
        errorDiv = document.createElement('p');
        errorDiv.className = 'field-error text-red-400 text-sm mt-1';
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
    errorDiv.textContent = message;
}

/**
 * Clear field error
 * @param {HTMLElement} field - Input field
 */
function clearFieldError(field) {
    field.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
    
    const errorDiv = field.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('field-error')) {
        errorDiv.remove();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION DIALOGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 */
function showConfirm(message, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4';
    dialog.innerHTML = `
        <div class="bg-gray-900 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full">
            <h3 class="text-2xl font-bold mb-4 text-gray-100">Confirm Action</h3>
            <p class="text-gray-300 mb-6">${message}</p>
            <div class="flex space-x-4">
                <button id="confirmYes" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition">
                    Yes, Continue
                </button>
                <button id="confirmNo" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('#confirmYes').onclick = () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    };
    
    dialog.querySelector('#confirmNo').onclick = () => {
        dialog.remove();
        if (onCancel) onCancel();
    };
    
    // Click outside to cancel
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            dialog.remove();
            if (onCancel) onCancel();
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Navigate to page with optional delay
 * @param {string} url - URL to navigate to
 * @param {number} delay - Delay in milliseconds
 */
function navigateTo(url, delay = 0) {
    if (delay > 0) {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    } else {
        window.location.href = url;
    }
}

/**
 * Toggle user menu dropdown
 */
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('hidden');
    }
}

/**
 * Close user menu when clicking outside
 */
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    
    if (userMenu && userMenuBtn && !userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.add('hidden');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SCROLL & ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Scroll to top
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIPBOARD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success', 2000);
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!', 'success', 2000);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCE & THROTTLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showLoading,
        hideLoading,
        setButtonLoading,
        resetButton,
        requireAuth,
        updateAuthUI,
        handleLogout,
        validateEmail,
        validatePassword,
        showFieldError,
        clearFieldError,
        showConfirm,
        navigateTo,
        toggleUserMenu,
        scrollToElement,
        scrollToTop,
        copyToClipboard,
        debounce
    };
}
