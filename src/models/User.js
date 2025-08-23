// MongoDB User Model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 3
    },
    phonenumber: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Static method to get user statistics
userSchema.statics.getStats = async function() {
    try {
        const totalUsers = await this.countDocuments();
        const activeUsers = await this.countDocuments({ status: 'active' });
        const inactiveUsers = await this.countDocuments({ status: 'inactive' });
        const adminUsers = await this.countDocuments({ role: 'admin' });
        const regularUsers = await this.countDocuments({ role: 'user' });

        return {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            admins: adminUsers,
            regular: regularUsers
        };
    } catch (error) {
        throw error;
    }
};

// Static method to create initial admin user
userSchema.statics.createInitialAdmin = async function() {
    try {
        const adminExists = await this.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const admin = new this({
                name: 'Administrator',
                email: 'admin@system.com',
                password: 'admin123',
                phonenumber: '+1234567890',
                role: 'admin',
                status: 'active'
            });
            
            await admin.save();
            console.log('✅ Created initial admin user');
            return admin;
        }
        
        return adminExists;
    } catch (error) {
        console.error('Error creating initial admin:', error);
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);
