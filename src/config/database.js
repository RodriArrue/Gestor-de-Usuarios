const { env } = require('./env');

module.exports = {
    development: {
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        logging: console.log,
    },
    test: {
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: `${env.DB_NAME}_test`,
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    },
    production: {
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },
    },
};
