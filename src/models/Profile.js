// MongoDB Profile Model - Complete user profile data
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Basic profile information
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },
    location: {
        city: String,
        state: String,
        country: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    
    // Contact information
    socialMedia: {
        facebook: String,
        twitter: String,
        linkedin: String,
        instagram: String,
        website: String
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    
    // Profile media
    profilePicture: {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        },
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    coverPhoto: {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        },
        url: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    
    // Privacy settings
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'private', 'friends-only'],
            default: 'public'
        },
        showEmail: {
            type: Boolean,
            default: false
        },
        showPhone: {
            type: Boolean,
            default: false
        },
        showLocation: {
            type: Boolean,
            default: false
        }
    },
    
    // Notification preferences
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        push: {
            type: Boolean,
            default: true
        },
        marketing: {
            type: Boolean,
            default: false
        }
    },
    
    // Activity tracking
    lastProfileUpdate: {
        type: Date,
        default: Date.now
    },
    profileViews: {
        type: Number,
        default: 0
    },
    profileCompleteness: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // Custom fields for extensibility
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Calculate profile completeness automatically
profileSchema.pre('save', function(next) {
    const requiredFields = [
        'bio', 'dateOfBirth', 'location.city', 'location.country', 
        'profilePicture.url', 'socialMedia.linkedin'
    ];
    
    let completedFields = 0;
    
    requiredFields.forEach(field => {
        const value = this.get(field);
        if (value && value !== '') {
            completedFields++;
        }
    });
    
    this.profileCompleteness = Math.round((completedFields / requiredFields.length) * 100);
    this.lastProfileUpdate = new Date();
    
    next();
});

// Static method to get profile with user data
profileSchema.statics.getFullProfile = async function(userId) {
    try {
        return await this.findOne({ userId }).populate('userId', 'name email phonenumber role status lastLogin createdAt');
    } catch (error) {
        throw error;
    }
};

// Instance method to increment profile views
profileSchema.methods.incrementViews = async function() {
    this.profileViews += 1;
    return await this.save();
};

module.exports = mongoose.model('Profile', profileSchema);
