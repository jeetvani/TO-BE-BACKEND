const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");
const PhoneNumbersModel = dbConnection.define('PhoneNumbers', {
    index: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    PhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    called: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    }
});

PhoneNumbersModel.sync({ force: false })
    .then(() => {
        appLogger.info('PhoneNumbersModel is in sync');
    })
    .catch((err) => {
        console.error(err);
    });

module.exports = {
    PhoneNumbersModel
}