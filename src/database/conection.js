const { appLogger } = require("../config/appLogger");
const { sequelizeConfig, environment } = require("../config/dbConfig");

const dbConnection = sequelizeConfig;



dbConnection
  .authenticate()
  .then(() => {
    appLogger.info("Database  Connection has been established successfully.");
    //mention the connection configs
    appLogger.info(`DB_HOST: ${environment.DB_HOST}`);
    appLogger.info(`DB_USER: ${environment.DB_USER}`);
    appLogger.info(`DB_NAME : ${environment.DB_NAME}`);
  })
  .catch((err) => {


    //if database does not exist then create the database
    if (err.parent.errno === 1049) {
      appLogger.info("Database does not exist, creating the database");
      const mysql = require('mysql');
      const connection = mysql.createConnection({
        host: environment.DB_HOST,
        user: environment.DB_USER,
        password: environment.DB_PASSWORD,
        port: environment.DB_PORT
      });
      connection.connect();
      connection.query(`CREATE DATABASE ${environment.DB_NAME}`, (err, result) => {
        if (err) {
          appLogger.error("Error while creating the database:", err);
        }
        else {
          appLogger.info("Database created successfully");
        }
      });
    }

    appLogger.error("Unable to connect to the database:", err);
  });


module.exports = { dbConnection };