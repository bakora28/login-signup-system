// MongoDB File Model - Store file metadata and manage uploads
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    // File identification
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    
    // File properties
    size: {
        type: Number,
        required: true
    },
    encoding: String,
    
    // Storage information
    storageType: {
        type: String,
        enum: ['local', 's3', 'cloudinary', 'gridfs'],
        default: 'local'
    },
    storagePath: {
        type: String,
        required: true
    },
    publicUrl: String,
    
    // File categorization
    category: {
        type: String,
        enum: ['profile-picture', 'cover-photo', 'document', 'image', 'video', 'audio', 'other'],
        default: 'other'
    },
    tags: [String],
    
    // Ownership and access
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    accessPermissions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'download', 'edit', 'delete'],
            default: 'view'
        }
    }],
    
    // Image-specific metadata (for image files)
    imageMetadata: {
        width: Number,
        height: Number,
        format: String,
        hasAlpha: Boolean,
        colorSpace: String
    },
    
    // File processing status
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'completed'
    },
    
    // Download and usage tracking
    downloadCount: {
        type: Number,
        default: 0
    },
    lastAccessed: Date,
    
    // File versions (for updates)
    version: {
        type: Number,
        default: 1
    },
    previousVersions: [{
        filename: String,
        storagePath: String,
        createdAt: Date
    }],
    
    // Expiration (for temporary files)
    expiresAt: Date
}, {
    timestamps: true
});

// Index for efficient queries
fileSchema.index({ uploadedBy: 1, category: 1 });
fileSchema.index({ filename: 1 });
fileSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup of expired files
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to get user files
fileSchema.statics.getUserFiles = async function(userId, category = null) {
    try {
        const query = { uploadedBy: userId };
        if (category) {
            query.category = category;
        }
        
        return await this.find(query).sort({ createdAt: -1 });
    } catch (error) {
        throw error;
    }
};

// Static method to get file statistics
fileSchema.statics.getFileStats = async function(userId) {
    try {
        const stats = await this.aggregate([
            { $match: { uploadedBy: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ]);
        
        const totalFiles = await this.countDocuments({ uploadedBy: userId });
        const totalSize = await this.aggregate([
            { $match: { uploadedBy: mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: '$size' } } }
        ]);
        
        return {
            totalFiles,
            totalSize: totalSize[0]?.total || 0,
            byCategory: stats
        };
    } catch (error) {
        throw error;
    }
};

// Instance method to increment download count
fileSchema.methods.recordDownload = async function() {
    this.downloadCount += 1;
    this.lastAccessed = new Date();
    return await this.save();
};

// Instance method to create new version
fileSchema.methods.createNewVersion = async function(newFileData) {
    // Archive current version
    this.previousVersions.push({
        filename: this.filename,
        storagePath: this.storagePath,
        createdAt: this.updatedAt
    });
    
    // Update with new version
    this.filename = newFileData.filename;
    this.storagePath = newFileData.storagePath;
    this.size = newFileData.size;
    this.version += 1;
    
    return await this.save();
};

module.exports = mongoose.model('File', fileSchema);
