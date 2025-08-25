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

// Profile Information Update
async function updateProfileInfo() {
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const bioInput = document.getElementById('bioInput');
    
    const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phoneNumber: phoneInput.value.trim(),
        bio: bioInput.value.trim()
    };
    
    // Basic validation
    if (!formData.name || !formData.email) {
        showNotification('Name and email are required fields.', 'error');
        return;
    }
    
    if (!formData.email.includes('@')) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/profile/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Profile updated successfully!', 'success');
            
            // Update progress bar
            updateProfileCompletion();
            
            // Update displayed stats if available
            if (result.stats) {
                updateStatsDisplay(result.stats);
            }
            
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(`Failed to update profile: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Update Profile Completion Progress
function updateProfileCompletion() {
    const progressBar = document.getElementById('profileCompletionProgress');
    const progressText = document.getElementById('profileCompletionText');
    
    if (progressBar && progressText) {
        // Calculate completion percentage based on filled fields
        const requiredFields = ['name', 'email', 'phoneNumber'];
        const optionalFields = ['bio', 'profilePicture'];
        
        let completed = 0;
        let total = requiredFields.length + optionalFields.length;
        
        // Check required fields
        requiredFields.forEach(field => {
            const element = document.getElementById(field + 'Input') || document.getElementById(field.replace('phoneNumber', 'phone') + 'Input');
            if (element && element.value.trim()) completed++;
        });
        
        // Check optional fields
        if (document.getElementById('bioInput') && document.getElementById('bioInput').value.trim()) completed++;
        if (document.getElementById('profileImg') && document.getElementById('profileImg').src && !document.getElementById('profileImg').src.includes('placeholder')) completed++;
        
        const percentage = Math.round((completed / total) * 100);
        
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
        progressText.textContent = `${percentage}% Complete`;
        
        // Update progress bar color based on completion
        if (percentage >= 80) {
            progressBar.className = 'progress-bar bg-success';
        } else if (percentage >= 60) {
            progressBar.className = 'progress-bar bg-info';
        } else if (percentage >= 40) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-danger';
        }
    }
}

// Update Stats Display
function updateStatsDisplay(stats) {
    const statsElements = {
        memberSince: document.getElementById('memberSince'),
        daysSinceJoin: document.getElementById('daysSinceJoin'),
        lastLoginDate: document.getElementById('lastLoginDate'),
        daysSinceLastLogin: document.getElementById('daysSinceLastLogin'),
        totalFiles: document.getElementById('totalFiles'),
        totalStorage: document.getElementById('totalStorage')
    };
    
    Object.entries(statsElements).forEach(([key, element]) => {
        if (element && stats[key] !== undefined) {
            if (key === 'totalStorage' && typeof stats[key] === 'number') {
                element.textContent = formatFileSize(stats[key]);
            } else {
                element.textContent = stats[key];
            }
        }
    });
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show/Hide Loading State
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize Profile Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile Dashboard initialized');
    
    // Set up event listeners
    const uploadBtn = document.getElementById('uploadProfilePictureBtn');
    const updateBtn = document.getElementById('updateProfileBtn');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadProfilePicture);
    }
    
    if (updateBtn) {
        updateBtn.addEventListener('click', updateProfileInfo);
    }
    
    // Initialize progress bar
    updateProfileCompletion();
    
    // Set up file input change handler
    const fileInput = document.getElementById('profilePictureInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('profilePicturePreview');
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Set up form validation
    const inputs = document.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });
});
