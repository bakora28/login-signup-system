// CloudFront Configuration for Enhanced CDN
require('dotenv').config();

const cloudfrontConfig = {
    domain: process.env.CLOUDFRONT_DOMAIN,
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    enabled: false
};

// Check if CloudFront is configured
function isCloudFrontConfigured() {
    return !!(cloudfrontConfig.domain && cloudfrontConfig.distributionId);
}

// Generate CloudFront URL for a given key
function generateCloudFrontUrl(key) {
    if (!isCloudFrontConfigured()) {
        return null;
    }
    
    // Remove leading slash if present
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `https://${cloudfrontConfig.domain}/${cleanKey}`;
}

// Generate S3 fallback URL
function generateS3FallbackUrl(bucketName, key, region) {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cleanKey}`;
}

// Get optimal URL (CloudFront if available, S3 as fallback)
function getOptimalUrl(key, bucketName, region) {
    if (isCloudFrontConfigured()) {
        return generateCloudFrontUrl(key);
    }
    return generateS3FallbackUrl(bucketName, key, region);
}

// Cache invalidation helper (for development/testing)
async function invalidateCache(paths = ['/*']) {
    if (!isCloudFrontConfigured()) {
        console.log('⚠️  CloudFront not configured, skipping cache invalidation');
        return false;
    }
    
    try {
        const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
        
        const cloudfrontClient = new CloudFrontClient({
            region: cloudfrontConfig.region
        });
        
        const command = new CreateInvalidationCommand({
            DistributionId: cloudfrontConfig.distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: paths.length,
                    Items: paths
                },
                CallerReference: `invalidation-${Date.now()}`
            }
        });
        
        const result = await cloudfrontClient.send(command);
        console.log(`✅ CloudFront cache invalidation started: ${result.Invalidation.Id}`);
        return true;
        
    } catch (error) {
        console.error('❌ CloudFront cache invalidation failed:', error.message);
        return false;
    }
}

// Get CloudFront status and configuration
function getCloudFrontStatus() {
    return {
        configured: isCloudFrontConfigured(),
        domain: cloudfrontConfig.domain,
        distributionId: cloudfrontConfig.distributionId,
        region: cloudfrontConfig.region,
        benefits: isCloudFrontConfigured() ? [
            'Global CDN with 400+ edge locations',
            'Automatic HTTPS and compression',
            'Better performance worldwide',
            'Reduced S3 costs',
            'Professional-grade delivery'
        ] : [
            'Using S3 direct access',
            'Limited to S3 region performance',
            'No global edge caching'
        ]
    };
}

// Test CloudFront connectivity
async function testCloudFrontConnectivity() {
    if (!isCloudFrontConfigured()) {
        return {
            status: 'not_configured',
            message: 'CloudFront not configured in environment variables'
        };
    }
    
    try {
        const https = require('https');
        
        const testUrl = `https://${cloudfrontConfig.domain}/`;
        
        const response = await new Promise((resolve, reject) => {
            const req = https.get(testUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                }));
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        if (response.statusCode === 200 || response.statusCode === 403) {
            return {
                status: 'success',
                message: 'CloudFront distribution is accessible',
                domain: cloudfrontConfig.domain,
                statusCode: response.statusCode,
                cacheHeaders: {
                    'x-cache': response.headers['x-cache'],
                    'x-amz-cf-pop': response.headers['x-amz-cf-pop'],
                    'x-amz-cf-id': response.headers['x-amz-cf-id']
                }
            };
        } else {
            return {
                status: 'error',
                message: `Unexpected status code: ${response.statusCode}`,
                statusCode: response.statusCode
            };
        }
        
    } catch (error) {
        return {
            status: 'error',
            message: error.message,
            error: error
        };
    }
}

module.exports = {
    cloudfrontConfig,
    isCloudFrontConfigured,
    generateCloudFrontUrl,
    generateS3FallbackUrl,
    getOptimalUrl,
    invalidateCache,
    getCloudFrontStatus,
    testCloudFrontConnectivity
};
