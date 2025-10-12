import dotenv from 'dotenv';
dotenv.config();

// Single database configuration for all environments
const dbConfig = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'grad_app_db',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres'
};

const config = {
  development: {
    ...dbConfig,
    logging: console.log
  },
  test: {
    ...dbConfig,
    logging: false
  },
  production: {
    ...dbConfig,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

export default config;