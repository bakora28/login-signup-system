// Profile Management Routes - Enhanced with MongoDB and S3
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload, isS3Configured } = require('./upload-config');
const ProfileService = require('./profile-service');
const ProfileMongoService = require('./services/ProfileMongoService');
const Database = require('./database');
const S3Service = require('./services/S3Service');
const fs = require('fs').promises;
const path = require('path');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Middleware for web routes (redirects instead of JSON)
function authenticateWeb(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.redirect('/login');
    }

    // Debug: Log the token
    console.log('JWT Token received:', token.substring(0, 50) + '...');
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            res.clearCookie('token');
            return res.redirect('/login');
        }
        
        // Debug: Log the decoded user object
        console.log('JWT decoded user:', JSON.stringify(user, null, 2));
        
        req.user = user;
        next();
    });
}

// Profile Dashboard Page - Enhanced with MongoDB integration
router.get('/dashboard', authenticateWeb, async (req, res) => {
    try {
        // Log user information for debugging
        console.log('Dashboard access - User ID:', req.user.id);
        console.log('Dashboard access - User Email:', req.user.email);
        
        let profileData;
        let statsData;
        
        if (Database.isConnected()) {
            try {
                // Use MongoDB for complete profile data
                const UserStorage = require('./mongodb-storage');
                const completeData = await UserStorage.getCompleteUserData(req.user.id);
                
                profileData = {
                    name: completeData.user.name,
                    email: completeData.user.email,
                    phoneNumber: completeData.user.phonenumber,
                    bio: completeData.profile.bio || '',
                    profilePictureUrl: completeData.profile.profilePicture?.url,
                    ...completeData.profile
                };
                
                statsData = {
                    profileCompletion: completeData.dataCompleteness,
                    memberSince: completeData.user.createdAt.toLocaleDateString(),
                    daysSinceJoin: Math.floor((Date.now() - completeData.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
                    lastLoginDate: completeData.user.lastLogin ? completeData.user.lastLogin.toLocaleDateString() : 'Never',
                    daysSinceLastLogin: completeData.user.lastLogin ? 
                        Math.floor((Date.now() - completeData.user.lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 0,
                    isRecentlyActive: completeData.user.lastLogin ? 
                        (Date.now() - completeData.user.lastLogin.getTime()) < (7 * 24 * 60 * 60 * 1000) : false,
                    totalFiles: completeData.fileStats.totalFiles,
                    totalStorage: completeData.fileStats.totalSize
                };
            } catch (error) {
                console.error('MongoDB profile data error, falling back to local:', error);
                // Fall through to local profile service
            }
        }
        
        if (!profileData) {
            // Fallback to local profile service if MongoDB is not available or data cannot be fetched
            const profile = await ProfileService.getProfile(req.user.id);
            
            if (!profile) {
                // Create new profile for the current user
                const defaultProfile = {
                    name: req.user.name,
                    email: req.user.email,
                    phoneNumber: req.user.phoneNumber || '',
                    bio: ''
                };
                
                console.log('Creating new profile for user:', req.user.id);
                const newProfile = await ProfileService.createProfile(req.user.id, defaultProfile);
                const stats = await ProfileService.getProfileStats(req.user.id);
                
                return res.render('profile-dashboard', {
                    profile: newProfile,
                    stats: stats
                });
            }

            const stats = await ProfileService.getProfileStats(req.user.id);
            profileData = profile;
            statsData = stats;
        }
        
        // Verify the profile data belongs to the current user
        if (profileData.email !== req.user.email) {
            console.error('Profile data mismatch!');
            console.error('Requested user email:', req.user.email);
            console.error('Profile data email:', profileData.email);
            
            // Clear the profile data and create a new one
            profileData = {
                name: req.user.name,
                email: req.user.email,
                phoneNumber: req.user.phoneNumber || '',
                bio: ''
            };
            
            const newProfile = await ProfileService.createProfile(req.user.id, profileData);
            const stats = await ProfileService.getProfileStats(req.user.id);
            
            return res.render('profile-dashboard', {
                profile: newProfile,
                stats: stats
            });
        }
        
        res.render('profile-dashboard', {
            profile: profileData,
            stats: statsData
        });
        
    } catch (error) {
        console.error('Error loading profile dashboard:', error);
        res.status(500).send('Error loading profile dashboard');
    }
});

// ===================== API Routes ===================== //

// Get Profile Data
router.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await ProfileService.getProfile(req.user.id);
        const stats = await ProfileService.getProfileStats(req.user.id);
        
        res.json({
            success: true,
            profile: profile,
            stats: stats
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Upload Profile Picture with Simplified S3 support
router.post('/api/profile/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let profilePictureData = {};
        const localPath = `/public/uploads/profile-pictures/${req.file.filename}`;
        
        // Always start with local storage
        profilePictureData = {
            url: localPath,
            storageType: 'local',
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };
        
        console.log('Profile picture uploaded locally:', localPath);

        // Try to upload to S3 if configured
        if (isS3Configured()) {
            try {
                const s3Key = S3Service.generateProfilePictureKey(req.user.id, req.file.originalname);
                const fileBuffer = await fs.readFile(req.file.path);
                
                const s3Result = await S3Service.uploadFile(fileBuffer, s3Key, req.file.mimetype);
                
                if (s3Result.success) {
                    // Update with S3 data
                    profilePictureData = {
                        url: s3Result.location,
                        s3Key: s3Key,
                        storageType: 's3',
                        fileSize: req.file.size,
                        mimeType: req.file.mimetype
                    };
                    
                    console.log('Profile picture uploaded to S3:', s3Result.location);
                    
                    // Delete local file after successful S3 upload
                    try {
                        await fs.unlink(req.file.path);
                        console.log('Local file deleted after S3 upload');
                    } catch (error) {
                        console.warn('Error deleting local file:', error);
                    }
                }
            } catch (error) {
                console.error('S3 upload failed, keeping local file:', error);
                // Keep local file if S3 upload fails
            }
        }

        // Update profile in MongoDB if available
        if (Database.isConnected()) {
            try {
                await ProfileMongoService.updateProfilePicture(req.user.id, profilePictureData);
                console.log('Profile picture updated in MongoDB');
            } catch (error) {
                console.error('Error updating profile in MongoDB:', error);
                // Continue with local profile service as fallback
            }
        }

        // Update local profile service as well
        const profilePictureUrl = await ProfileService.updateProfilePicture(req.user.id, profilePictureData);
        
        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePictureUrl: profilePictureData.url,
            storageType: profilePictureData.storageType
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
});

// Update Profile Information
router.post('/api/profile/update', authenticateToken, async (req, res) => {
    try {
        const { name, email, phoneNumber, bio } = req.body;
        
        // Security: Only allow specific fields to be updated by users
        const allowedFields = ['name', 'email', 'phoneNumber', 'bio'];
        const updates = {};
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        // Security: Block restricted fields
        const restrictedFields = ['status', 'role', 'isActive', 'permissions'];
        const hasRestrictedFields = restrictedFields.some(field => req.body[field] !== undefined);
        
        if (hasRestrictedFields) {
            return res.status(403).json({ 
                error: 'Account status and role modifications are restricted to administrators only' 
            });
        }
        
        const profile = await ProfileService.getProfile(req.user.id);
        if (!profile) {
            await ProfileService.createProfile(req.user.id, updates);
        } else {
            Object.assign(profile, updates);
            await ProfileService.saveProfileToLocal(profile);
        }
        
        const stats = await ProfileService.getProfileStats(req.user.id);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: profile,
            stats: stats
        });
        
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update Profile Preferences
router.post('/api/profile/update-preferences', authenticateToken, async (req, res) => {
    try {
        const { setting, value } = req.body;
        
        if (['status', 'role', 'active'].includes(setting)) {
            return res.status(403).json({ 
                error: 'Account status and role changes are restricted to administrators only' 
            });
        }
        
        const profile = await ProfileService.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        if (!profile.preferences) {
            profile.preferences = {};
        }
        
        profile.preferences[setting] = value;
        profile.updatedAt = new Date().toISOString();
        
        await ProfileService.saveProfileToLocal(profile);
        
        res.json({
            success: true,
            message: 'Preferences updated successfully',
            profile: profile
        });
        
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Security Routes
router.put('/api/profile/status', authenticateToken, (req, res) => {
    res.status(403).json({ 
        success: false,
        error: 'Account activation/deactivation is restricted to administrators only. Please contact support if you need assistance.' 
    });
});

router.post('/api/profile/deactivate', authenticateToken, (req, res) => {
    res.status(403).json({ 
        success: false,
        error: 'Account deactivation is restricted to administrators only. Please contact support if you need assistance.' 
    });
});

// Debug route to check profile data (remove in production)
router.get('/debug/profiles', authenticateWeb, async (req, res) => {
    try {
        const profiles = await ProfileService.getAllProfileFiles();
        const cleanedCount = await ProfileService.cleanupCorruptedProfiles();
        
        res.json({
            currentUser: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name
            },
            allProfiles: profiles,
            cleanedCount: cleanedCount
        });
    } catch (error) {
        console.error('Error in debug route:', error);
        res.status(500).json({ error: 'Debug route failed' });
    }
});

module.exports = router;
