// Complete User Data Service - MongoDB integration for all user data
const User = require('../models/User');
const Profile = require('../models/Profile');
const File = require('../models/File');
const UserSettings = require('../models/UserSettings');
const path = require('path');
const fs = require('fs').promises;

class UserDataService {
    
    // ============ USER MANAGEMENT ============
    
    static async createUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            
            // Create associated profile and settings
            await this.createUserProfile(user._id);
            await this.createUserSettings(user._id);
            
            console.log('✅ Complete user account created:', user.email);
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    
    static async getUserById(userId) {
        try {
            return await User.findById(userId);
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }
    
    static async getUserByEmail(email) {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }
    
    static async authenticateUser(email, password) {
        try {
            const user = await User.findOne({ email });
            if (!user) return null;
            
            const isMatch = await user.comparePassword(password);
            if (!isMatch) return null;
            
            // Update last login
            await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
            
            return user;
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw error;
        }
    }
    
    // ============ PROFILE MANAGEMENT ============
    
    static async createUserProfile(userId, profileData = {}) {
        try {
            const profile = new Profile({
                userId,
                ...profileData
            });
            
            await profile.save();
            console.log('✅ User profile created');
            return profile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }
    
    static async getUserProfile(userId) {
        try {
            let profile = await Profile.getFullProfile(userId);
            
            if (!profile) {
                // Create profile if it doesn't exist
                profile = await this.createUserProfile(userId);
                profile = await Profile.getFullProfile(userId);
            }
            
            return profile;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }
    
    static async updateUserProfile(userId, updateData) {
        try {
            const profile = await Profile.findOneAndUpdate(
                { userId },
                updateData,
                { new: true, upsert: true, runValidators: true }
            );
            
            console.log('✅ Profile updated for user:', userId);
            return profile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
    
    static async incrementProfileViews(userId) {
        try {
            const profile = await Profile.findOne({ userId });
            if (profile) {
                await profile.incrementViews();
            }
        } catch (error) {
            console.error('Error incrementing profile views:', error);
        }
    }
    
    // ============ FILE MANAGEMENT ============
    
    static async saveFileMetadata(fileData) {
        try {
            const file = new File(fileData);
            await file.save();
            
            console.log('✅ File metadata saved:', file.filename);
            return file;
        } catch (error) {
            console.error('Error saving file metadata:', error);
            throw error;
        }
    }
    
    static async updateProfilePicture(userId, fileData) {
        try {
            // Save file metadata
            const fileRecord = await this.saveFileMetadata({
                ...fileData,
                uploadedBy: userId,
                category: 'profile-picture'
            });
            
            // Update profile with file reference
            const profile = await Profile.findOneAndUpdate(
                { userId },
                {
                    'profilePicture.fileId': fileRecord._id,
                    'profilePicture.url': fileData.publicUrl,
                    'profilePicture.uploadDate': new Date()
                },
                { new: true, upsert: true }
            );
            
            console.log('✅ Profile picture updated');
            return { file: fileRecord, profile };
        } catch (error) {
            console.error('Error updating profile picture:', error);
            throw error;
        }
    }
    
    static async getUserFiles(userId, category = null) {
        try {
            return await File.getUserFiles(userId, category);
        } catch (error) {
            console.error('Error getting user files:', error);
            throw error;
        }
    }
    
    static async getFileStats(userId) {
        try {
            return await File.getFileStats(userId);
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    }
    
    // ============ SETTINGS MANAGEMENT ============
    
    static async createUserSettings(userId) {
        try {
            const settings = await UserSettings.createDefaultSettings(userId);
            console.log('✅ User settings created');
            return settings;
        } catch (error) {
            console.error('Error creating settings:', error);
            throw error;
        }
    }
    
    static async getUserSettings(userId) {
        try {
            return await UserSettings.getUserSettings(userId);
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }
    
    static async updateUserSetting(userId, settingPath, value, metadata = {}) {
        try {
            const settings = await UserSettings.findOne({ userId });
            if (!settings) {
                throw new Error('Settings not found');
            }
            
            await settings.updateSetting(settingPath, value, metadata);
            console.log(`✅ Setting updated: ${settingPath}`);
            return settings;
        } catch (error) {
            console.error('Error updating setting:', error);
            throw error;
        }
    }
    
    // ============ COMPLETE USER DATA ============
    
    static async getCompleteUserData(userId) {
        try {
            const [user, profile, settings, files] = await Promise.all([
                this.getUserById(userId),
                this.getUserProfile(userId),
                this.getUserSettings(userId),
                this.getUserFiles(userId)
            ]);
            
            const fileStats = await this.getFileStats(userId);
            
            return {
                user,
                profile,
                settings,
                files,
                fileStats,
                dataCompleteness: this.calculateDataCompleteness(user, profile, settings)
            };
        } catch (error) {
            console.error('Error getting complete user data:', error);
            throw error;
        }
    }
    
    static calculateDataCompleteness(user, profile, settings) {
        let completed = 0;
        let total = 0;
        
        // User data completeness
        const userFields = ['name', 'email', 'phonenumber'];
        userFields.forEach(field => {
            total++;
            if (user[field] && user[field] !== '') completed++;
        });
        
        // Profile data completeness
        const profileFields = ['bio', 'dateOfBirth', 'location.city', 'profilePicture.url'];
        profileFields.forEach(field => {
            total++;
            const value = field.includes('.') ? 
                field.split('.').reduce((obj, key) => obj?.[key], profile) : 
                profile[field];
            if (value && value !== '') completed++;
        });
        
        // Settings completeness
        if (settings.general.timezone !== 'UTC') completed++;
        total++;
        
        return Math.round((completed / total) * 100);
    }
    
    // ============ DATA EXPORT ============
    
    static async exportUserData(userId, format = 'json') {
        try {
            const completeData = await this.getCompleteUserData(userId);
            
            // Remove sensitive data
            delete completeData.user.password;
            
            const exportData = {
                exportDate: new Date(),
                userId: userId,
                format: format,
                data: completeData
            };
            
            switch (format) {
                case 'json':
                    return JSON.stringify(exportData, null, 2);
                case 'csv':
                    return this.convertToCSV(exportData);
                default:
                    return exportData;
            }
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw error;
        }
    }
    
    static convertToCSV(data) {
        // Simple CSV conversion for basic data
        const csv = [];
        csv.push('Field,Value');
        
        // Flatten the data structure for CSV
        const flatten = (obj, prefix = '') => {
            for (let key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    flatten(obj[key], prefix + key + '.');
                } else {
                    csv.push(`${prefix + key},"${obj[key]}"`);
                }
            }
        };
        
        flatten(data.data);
        return csv.join('\n');
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    static async getAllUsers() {
        try {
            return await User.find({}).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
    
    static async getUserStats() {
        try {
            const stats = await User.getStats();
            const totalProfiles = await Profile.countDocuments();
            const totalFiles = await File.countDocuments();
            
            return {
                ...stats,
                totalProfiles,
                totalFiles
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
    
    static async deleteUser(userId) {
        try {
            // Delete all related data
            await Promise.all([
                User.findByIdAndDelete(userId),
                Profile.findOneAndDelete({ userId }),
                UserSettings.findOneAndDelete({ userId }),
                File.deleteMany({ uploadedBy: userId })
            ]);
            
            console.log('✅ User and all data deleted');
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

module.exports = UserDataService;
