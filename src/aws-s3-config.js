// AWS S3 Configuration - Updated for AWS SDK v3
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
require('dotenv').config();

// AWS S3 Configuration
const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME
};

// Initialize S3 client with v3
const s3Client = new S3Client({
    region: s3Config.region,
    credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey
    }
});

// S3 upload configuration for multer-s3
const s3UploadConfig = {
    bucket: s3Config.bucketName,
    contentType: (req, file, cb) => {
        cb(null, file.mimetype);
    },
    key: (req, file, cb) => {
        const userId = req.user?.id || 'guest';
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const fileExtension = file.originalname.split('.').pop();
        const key = `profile-pictures/${userId}-${timestamp}-${randomSuffix}.${fileExtension}`;
        cb(null, key);
    }
};

// Generate S3 URL for a given key
const generateS3Url = (key) => {
    return `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
};

// Delete file from S3
const deleteFromS3 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: s3Config.bucketName,
            Key: key
        });
        
        await s3Client.send(command);
        console.log(`Successfully deleted ${key} from S3`);
        return true;
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return false;
    }
};

// Check if S3 is properly configured
const isS3Configured = () => {
    return !!(s3Config.accessKeyId && s3Config.secretAccessKey && s3Config.bucketName);
};

// Export s3Client for compatibility with existing code
const s3 = s3Client;

module.exports = {
    s3,
    s3Client,
    s3Config,
    s3UploadConfig,
    generateS3Url,
    deleteFromS3,
    isS3Configured
};
