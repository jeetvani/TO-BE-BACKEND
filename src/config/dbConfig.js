const { Sequelize } = require("sequelize");

require("dotenv").config();


const testEnvironment = {
    DB_HOST: 'localhost',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_PORT: 3306,
    DB_NAME: 'TOBE'
}

const productionEnvironment = {
    DB_HOST: '127.0.0.1',
    DB_USER: 'jeet',
    DB_PASSWORD: 'testpass',
    DB_PORT: 3306,
    DB_NAME: 'TOBE'
}

const environment = testEnvironment



const sequelizeConfig = new Sequelize(
    environment.DB_NAME,
    environment.DB_USER,
    environment.DB_PASSWORD,

    {
        host: environment.DB_HOST,
        dialect: "mysql",
        logging: false,
        port: environment.DB_PORT,
    }
);

module.exports = { sequelizeConfig, environment };