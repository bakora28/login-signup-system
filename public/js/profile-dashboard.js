// Profile Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Initialize form handlers
    setupFormHandlers();
    
    // Initialize form validation
    setupFormValidation();
    
    // Add smooth animations
    animateElements();
    
    console.log('Profile dashboard initialized');
}

// Form Handling
function setupFormHandlers() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = Object.fromEntries(formData.entries());
    
    showLoading(true);
    
    try {
        const response = await fetch('/profile/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Profile updated successfully!', 'success');
            
            // Update UI with new data
            updateProfileDisplay(result.profile);
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Profile Picture Upload
async function uploadProfilePicture() {
    const fileInput = document.getElementById('profilePictureInput');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file.', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('File size must be less than 5MB.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/profile/api/profile/upload-picture', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Update profile picture in UI
            const profileImg = document.getElementById('profileImg');
            if (profileImg) {
                profileImg.src = result.profilePictureUrl;
            } else {
                // Create img element if placeholder was there
                const container = document.querySelector('.profile-picture-container');
                const placeholder = container.querySelector('.profile-picture-placeholder');
                if (placeholder) {
                    const img = document.createElement('img');
                    img.src = result.profilePictureUrl;
                    img.alt = 'Profile Picture';
                    img.className = 'profile-picture';
                    img.id = 'profileImg';
                    container.replaceChild(img, placeholder);
                }
            }
            
            // Show success message with storage type info
            const storageType = result.storageType || 'local';
            const storageMessage = storageType === 's3' ? ' (stored in AWS S3)' : ' (stored locally)';
            showNotification(`Profile picture updated successfully!${storageMessage}`, 'success');
            
            // Log storage information
            console.log('Profile picture uploaded:', {
                url: result.profilePictureUrl,
                storageType: storageType,
                fileSize: file.size,
                mimeType: file.type
            });
            
            // Update progress bar
            updateProfileCompletion();
            
            // Clear file input
            fileInput.value = '';
            
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to upload profile picture');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showNotification(`Failed to upload profile picture: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// UI Helper Functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#38a169';
        case 'error': return '#e53e3e';
        case 'warning': return '#ed8936';
        default: return '#667eea';
    }
}

function updateProfileDisplay(profile) {
    // Update name
    const nameElement = document.querySelector('.profile-info h2');
    if (nameElement) {
        nameElement.textContent = profile.name;
    }
    
    // Update email
    const emailElement = document.querySelector('.profile-info .email');
    if (emailElement) {
        emailElement.textContent = profile.email;
    }
    
    // Update form fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phoneNumber');
    const bioInput = document.getElementById('bio');
    
    if (nameInput) nameInput.value = profile.name;
    if (emailInput) emailInput.value = profile.email;
    if (phoneInput) phoneInput.value = profile.phoneNumber || '';
    if (bioInput) bioInput.value = profile.bio || '';
    
    // Update completion percentage
    updateProfileCompletion();
}

function updateProfileCompletion() {
    // Calculate completion based on filled fields
    const fields = ['name', 'email', 'phoneNumber', 'bio'];
    const profileImg = document.getElementById('profileImg');
    
    let completed = 0;
    
    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input && input.value.trim()) {
            completed++;
        }
    });
    
    if (profileImg) {
        completed++;
    }
    
    const total = fields.length + 1; // +1 for profile picture
    const percentage = Math.round((completed / total) * 100);
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    const percentageText = document.querySelector('.completion-percentage');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (percentageText) {
        percentageText.textContent = percentage + '%';
    }
}

function resetForm() {
    const form = document.getElementById('profileForm');
    if (form) {
        form.reset();
        showNotification('Form reset to original values', 'info');
    }
}

function animateElements() {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .profile-card {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
    }
}

// Settings Functions
function changePassword() {
    showNotification('Password change feature coming soon!', 'info');
    // TODO: Implement password change modal
}

function downloadData() {
    showNotification('Preparing your data for download...', 'info');
    // TODO: Implement data export functionality
    setTimeout(() => {
        showNotification('Data export feature coming soon!', 'warning');
    }, 2000);
}

// Account deactivation is handled by administrators only
// Users no longer have access to deactivate their own accounts

// Settings Toggle Handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupSettingsHandlers();
});

function setupSettingsHandlers() {
    // Profile Public Toggle
    const profilePublicToggle = document.getElementById('profilePublic');
    if (profilePublicToggle) {
        profilePublicToggle.addEventListener('change', function() {
            const isPublic = this.checked;
            updatePrivacySetting('privacy', isPublic ? 'public' : 'private');
        });
    }

    // Notifications Toggle
    const notificationsToggle = document.getElementById('notificationsEnabled');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', function() {
            const enabled = this.checked;
            updatePrivacySetting('notifications', enabled);
        });
    }
}

async function updatePrivacySetting(setting, value) {
    try {
        showLoading(true);
        
        const response = await fetch('/profile/api/profile/update-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                setting: setting,
                value: value
            })
        });

        if (response.ok) {
            const result = await response.json();
            showNotification(`${setting} setting updated successfully!`, 'success');
        } else {
            throw new Error('Failed to update setting');
        }
    } catch (error) {
        console.error('Error updating setting:', error);
        showNotification('Failed to update setting. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Enhanced Profile Display Update
function updateProfileDisplay(profile) {
    // Update name
    const nameElement = document.querySelector('.profile-info h2');
    if (nameElement) {
        nameElement.textContent = profile.name;
    }
    
    // Update welcome text
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${profile.name}!`;
    }
    
    // Update email
    const emailElement = document.querySelector('.profile-info .email');
    if (emailElement) {
        emailElement.textContent = profile.email;
    }
    
    // Update form fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phoneNumber');
    const bioInput = document.getElementById('bio');
    
    if (nameInput) nameInput.value = profile.name;
    if (emailInput) emailInput.value = profile.email;
    if (phoneInput) phoneInput.value = profile.phoneNumber || '';
    if (bioInput) bioInput.value = profile.bio || '';
    
    // Update completion percentage
    updateProfileCompletion();
}

// Add smooth scroll to sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add real-time validation for form fields
function setupFormValidation() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'tel':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;
    }

    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--danger-color);
        font-size: 12px;
        margin-top: 5px;
    `;
    
    field.parentNode.appendChild(errorElement);
    field.style.borderColor = 'var(--danger-color)';
}

function clearFieldError(field) {
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.style.borderColor = '';
}