// Admin Management Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserStorage = require('./storage');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.redirect('/admin/login');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).render('error', { 
                message: 'Access denied. Admin privileges required.',
                backUrl: '/'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.redirect('/admin/login');
    }
};

// Admin login page
router.get('/admin/login', (req, res) => {
    res.render('admin-login', { 
        title: 'Admin Login',
        error: null
    });
});

// Admin login POST
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const admin = await UserStorage.findOne({ email });

        if (!admin || admin.role !== 'admin') {
            return res.render('admin-login', {
                title: 'Admin Login',
                error: 'Invalid admin credentials'
            });
        }

        // Check password (in production, use bcrypt)
        if (admin.password !== password) {
            return res.render('admin-login', {
                title: 'Admin Login',
                error: 'Invalid admin credentials'
            });
        }

        // Check if admin account is active
        if (admin.status !== 'active') {
            return res.render('admin-login', {
                title: 'Admin Login',
                error: 'Admin account is deactivated'
            });
        }

        // Update last login
        await UserStorage.updateLastLogin(admin.id);

        // Create JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                email: admin.email, 
                role: admin.role,
                name: admin.name
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            sameSite: 'lax'
        });

        console.log(`✅ Admin logged in successfully: ${admin.email}`);
        console.log(`🔑 JWT token created and cookie set`);
        console.log(`🚀 Redirecting to admin dashboard...`);
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('Admin login error:', error);
        res.render('admin-login', {
            title: 'Admin Login',
            error: 'Login failed. Please try again.'
        });
    }
});

// Admin dashboard
router.get('/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const allUsers = UserStorage.getAllUsers();
        const users = UserStorage.getRegularUsers();
        const stats = UserStorage.getStats();

        console.log('🔍 Admin Dashboard Debug:');
        console.log(`📊 Total users in system: ${allUsers.length}`);
        console.log(`👥 Regular users for admin: ${users.length}`);
        console.log(`📈 Stats:`, stats);
        console.log(`👤 Admin user:`, req.user);
        
        // Log each user for debugging
        users.forEach((user, index) => {
            console.log(`User ${index + 1}: ${user.name} (${user.email}) - ${user.status}`);
        });

        res.render('admin-dashboard', {
            title: 'Admin Dashboard',
            admin: req.user,
            users: users,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Admin dashboard error:', error);
        res.status(500).render('error', { 
            message: 'Failed to load dashboard',
            backUrl: '/admin/dashboard'
        });
    }
});

// API: Get all users
router.get('/admin/api/users', authenticateAdmin, (req, res) => {
    try {
        const users = UserStorage.getRegularUsers();
        res.json({
            success: true,
            users: users,
            total: users.length
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve users'
        });
    }
});

// API: Create new user
router.post('/admin/api/users', authenticateAdmin, async (req, res) => {
    try {
        const { name, email, password, phonenumber, role, status } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await UserStorage.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Create user
        const newUser = {
            name,
            email,
            password, // In production, hash this password
            phonenumber: phonenumber || '',
            role: role || 'user',
            status: status || 'active'
        };

        const [createdUser] = await UserStorage.insertMany([newUser]);

        console.log(`Admin ${req.user.email} created user: ${createdUser.email}`);

        res.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                status: createdUser.status,
                createdAt: createdUser.createdAt
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

// API: Update user status (activate/deactivate)
router.put('/admin/api/users/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status must be "active" or "inactive"'
            });
        }

        const updatedUser = await UserStorage.updateUserStatus(id, status);

        console.log(`Admin ${req.user.email} updated user ${id} status to: ${status}`);

        res.json({
            success: true,
            message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                status: updatedUser.status
            }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update user status'
        });
    }
});



// API: Delete user
router.delete('/admin/api/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        const deletedUser = await UserStorage.deleteUser(id);

        console.log(`Admin ${req.user.email} deleted user: ${deletedUser.email}`);

        res.json({
            success: true,
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUser.id,
                name: deletedUser.name,
                email: deletedUser.email
            }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete user'
        });
    }
});

// API: Get user statistics
router.get('/admin/api/stats', authenticateAdmin, (req, res) => {
    try {
        const stats = UserStorage.getStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics'
        });
    }
});

// Admin logout
router.post('/admin/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
});

module.exports = router;
