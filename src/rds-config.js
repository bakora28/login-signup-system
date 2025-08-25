// AWS RDS Configuration
require('dotenv').config();

const rdsConfig = {
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT || 5432,
    database: process.env.RDS_DATABASE,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    dialect: process.env.RDS_DIALECT || 'postgres',
    
    // Connection pool settings
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    
    // SSL configuration
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' ? console.log : false
};

// Check if RDS is configured
const isRDSConfigured = () => {
    return !!(rdsConfig.host && rdsConfig.username && rdsConfig.password);
};

// Get connection string
const getConnectionString = () => {
    if (rdsConfig.dialect === 'postgres') {
        return `postgresql://${rdsConfig.username}:${rdsConfig.password}@${rdsConfig.host}:${rdsConfig.port}/${rdsConfig.database}`;
    } else if (rdsConfig.dialect === 'mysql') {
        return `mysql://${rdsConfig.username}:${rdsConfig.password}@${rdsConfig.host}:${rdsConfig.port}/${rdsConfig.database}`;
    }
    return null;
};

module.exports = {
    rdsConfig,
    isRDSConfigured,
    getConnectionString
};
