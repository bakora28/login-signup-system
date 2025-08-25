// MongoDB Profile Service with S3 Integration
const Profile = require('../models/Profile');
const S3Service = require('./S3Service');

class ProfileMongoService {
    /**
     * Create or update profile picture in MongoDB
     * @param {string} userId - User ID
     * @param {Object} pictureData - Profile picture data
     * @returns {Promise<Object>} Updated profile
     */
    static async updateProfilePicture(userId, pictureData) {
        try {
            // Find existing profile or create new one
            let profile = await Profile.findOne({ userId });
            
            if (!profile) {
                profile = new Profile({ userId });
            }

            // Delete old profile picture if exists
            if (profile.profilePicture) {
                await this.deleteOldProfilePicture(profile.profilePicture);
            }

            // Update profile picture data
            profile.profilePicture = pictureData;
            profile.lastProfileUpdate = new Date();
            
            await profile.save();
            
            console.log(`Profile picture updated for user ${userId} in MongoDB`);
            return profile;
            
        } catch (error) {
            console.error('Error updating profile picture in MongoDB:', error);
            throw error;
        }
    }

    /**
     * Delete old profile picture (S3 or local)
     * @param {Object} oldPicture - Old profile picture data
     */
    static async deleteOldProfilePicture(oldPicture) {
        try {
            if (oldPicture.storageType === 's3' && oldPicture.s3Key) {
                // Delete from S3
                await S3Service.deleteFile(oldPicture.s3Key);
                console.log(`Old S3 profile picture deleted: ${oldPicture.s3Key}`);
            } else if (oldPicture.url && oldPicture.url.startsWith('/public/')) {
                // Delete local file
                const fs = require('fs');
                const path = require('path');
                const oldFilePath = path.join(__dirname, '../..', oldPicture.url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Old local profile picture deleted: ${oldFilePath}`);
                }
            }
        } catch (error) {
            console.warn('Error deleting old profile picture:', error);
        }
    }

    /**
     * Get profile with picture data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Profile data
     */
    static async getProfile(userId) {
        try {
            const profile = await Profile.findOne({ userId });
            return profile;
        } catch (error) {
            console.error('Error getting profile from MongoDB:', error);
            throw error;
        }
    }

    /**
     * Get profile picture URL
     * @param {string} userId - User ID
     * @returns {Promise<string|null>} Profile picture URL
     */
    static async getProfilePictureUrl(userId) {
        try {
            const profile = await Profile.findOne({ userId });
            if (profile && profile.profilePicture && profile.profilePicture.url) {
                return profile.profilePicture.url;
            }
            return null;
        } catch (error) {
            console.error('Error getting profile picture URL from MongoDB:', error);
            return null;
        }
    }

    /**
     * Update profile information
     * @param {string} userId - User ID
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} Updated profile
     */
    static async updateProfile(userId, updates) {
        try {
            const profile = await Profile.findOneAndUpdate(
                { userId },
                { 
                    ...updates,
                    lastProfileUpdate: new Date()
                },
                { new: true, upsert: true }
            );
            
            return profile;
        } catch (error) {
            console.error('Error updating profile in MongoDB:', error);
            throw error;
        }
    }

    /**
     * Delete profile and associated files
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteProfile(userId) {
        try {
            const profile = await Profile.findOne({ userId });
            
            if (profile && profile.profilePicture) {
                await this.deleteOldProfilePicture(profile.profilePicture);
            }
            
            await Profile.deleteOne({ userId });
            console.log(`Profile deleted for user ${userId}`);
            
            return true;
        } catch (error) {
            console.error('Error deleting profile from MongoDB:', error);
            return false;
        }
    }

    /**
     * Get all profiles with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Profiles and pagination info
     */
    static async getAllProfiles(options = {}) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            
            const skip = (page - 1) * limit;
            
            const [profiles, total] = await Promise.all([
                Profile.find()
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate('userId', 'name email role status'),
                Profile.countDocuments()
            ]);
            
            return {
                profiles,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting all profiles from MongoDB:', error);
            throw error;
        }
    }
}

module.exports = ProfileMongoService;
