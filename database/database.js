import Sequelize from 'sequelize';
const parseDbUrl = require("parse-database-url");

let Database;

if (process.env.NODE_ENV === 'production') {
    const dbConfig = parseDbUrl(process.env.DATABASE_URL);
    Database = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        operatorsAliases: false,
        logging: false,


        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
    });
}

else if (process.env.NODE_ENV === 'development') {
    const credentials = parseDbUrl(process.env.npm_config_db);
    
    Database = new Sequelize(credentials.database, credentials.user, credentials.password, {
        host: credentials.host,
        port: credentials.port,
        dialect: 'postgres',
        protocol: 'postgres',
        operatorsAliases: false,
        logging: false,


        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

    });
}

else { // else always returns staging settings
    const dbConfig = parseDbUrl(process.env.DATABASE_URL);
    Database = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: 'postgres',
            protocol: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            operatorsAliases: false,
            logging: false,


            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },

    });
}

export default Database;