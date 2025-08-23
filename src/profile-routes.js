// Profile Management Routes - Enhanced with MongoDB
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload } = require('./upload-config');
const ProfileService = require('./profile-service');
const Database = require('./database');

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

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
}

// Profile Dashboard Page - Enhanced with MongoDB integration
router.get('/dashboard', authenticateWeb, async (req, res) => {
    try {
        let profileData;
        let statsData;
        
        if (Database.isConnected()) {
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
        } else {
            // Fallback to local profile service
            const profile = await ProfileService.getProfile(req.user.id);
            
            if (!profile) {
                const defaultProfile = {
                    name: req.user.name,
                    email: req.user.email,
                    phoneNumber: req.user.phoneNumber || '',
                    bio: ''
                };
                
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
        
        res.render('profile-dashboard', {
            profile: profileData,
            stats: statsData
        });
        
    } catch (error) {
        console.error('Error loading profile dashboard:', error);
        res.status(500).send('Error loading profile dashboard');
    }
});

// API Routes

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

// Upload Profile Picture
router.post('/api/profile/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // For local storage, create URL path
        const fileName = req.file.filename;
        const localPath = `/public/uploads/profile-pictures/${fileName}`;
        
        const profilePictureUrl = await ProfileService.updateProfilePicture(req.user.id, localPath);
        
        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePictureUrl: profilePictureUrl
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
        
        // Filter to only allowed fields
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        
        // Security: Block any attempts to modify restricted fields
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
        
        // Security: Prevent users from changing account status via preferences
        if (setting === 'status' || setting === 'role' || setting === 'active') {
            return res.status(403).json({ 
                error: 'Account status and role changes are restricted to administrators only' 
            });
        }
        
        const profile = await ProfileService.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        // Update preferences
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

// Security Route: Block any user attempts to change account status
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

module.exports = router;
