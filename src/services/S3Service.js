// S3 Service for handling file operations - Updated for AWS SDK v3
const { s3Client, s3Config, generateS3Url, deleteFromS3, isS3Configured } = require('../aws-s3-config');
const { PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

class S3Service {
    /**
     * Upload file to S3
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} key - S3 object key
     * @param {string} contentType - MIME type
     * @returns {Promise<Object>} Upload result
     */
    static async uploadFile(fileBuffer, key, contentType) {
        if (!isS3Configured()) {
            throw new Error('S3 is not configured');
        }

        try {
            const command = new PutObjectCommand({
                Bucket: s3Config.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType
            });

            const result = await s3Client.send(command);
            const location = generateS3Url(key);
            
            console.log(`File uploaded successfully to S3: ${location}`);
            
            return {
                success: true,
                location: location,
                key: key,
                bucket: s3Config.bucketName,
                etag: result.ETag
            };
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new Error(`Failed to upload file to S3: ${error.message}`);
        }
    }

    /**
     * Delete file from S3
     * @param {string} key - S3 object key
     * @returns {Promise<boolean>} Success status
     */
    static async deleteFile(key) {
        if (!isS3Configured()) {
            console.warn('S3 not configured, skipping deletion');
            return false;
        }

        return await deleteFromS3(key);
    }

    /**
     * Generate S3 URL for a given key
     * @param {string} key - S3 object key
     * @returns {string} S3 URL
     */
    static getFileUrl(key) {
        if (!isS3Configured()) {
            return null;
        }
        return generateS3Url(key);
    }

    /**
     * Check if a file exists in S3
     * @param {string} key - S3 object key
     * @returns {Promise<boolean>} Exists status
     */
    static async fileExists(key) {
        if (!isS3Configured()) {
            return false;
        }

        try {
            const command = new HeadObjectCommand({
                Bucket: s3Config.bucketName,
                Key: key
            });

            await s3Client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get file metadata from S3
     * @param {string} key - S3 object key
     * @returns {Promise<Object>} File metadata
     */
    static async getFileMetadata(key) {
        if (!isS3Configured()) {
            return null;
        }

        try {
            const command = new HeadObjectCommand({
                Bucket: s3Config.bucketName,
                Key: key
            });

            const result = await s3Client.send(command);
            return {
                contentType: result.ContentType,
                contentLength: result.ContentLength,
                lastModified: result.LastModified,
                etag: result.ETag
            };
        } catch (error) {
            console.error('Error getting file metadata from S3:', error);
            return null;
        }
    }

    /**
     * Generate a unique S3 key for profile pictures
     * @param {string} userId - User ID
     * @param {string} originalName - Original filename
     * @returns {string} S3 key
     */
    static generateProfilePictureKey(userId, originalName) {
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const fileExtension = originalName.split('.').pop();
        return `profile-pictures/${userId}-${timestamp}-${randomSuffix}.${fileExtension}`;
    }

    /**
     * Check if S3 is available and configured
     * @returns {boolean} Configuration status
     */
    static isAvailable() {
        return isS3Configured();
    }
}

module.exports = S3Service;
