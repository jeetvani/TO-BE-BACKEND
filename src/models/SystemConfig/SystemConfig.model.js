const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");

const { DataTypes } = require("sequelize");
const SystemConfigModel = dbConnection.define('SystemConfig', {
    index: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    defaultPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    numberOfCalls: {
        type: DataTypes.INTEGER,
        allowNull: false,

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
}, {
    tableName: 'SystemConfig'
});

SystemConfigModel.sync({ force: false }).then(() => {
    appLogger.info('SystemConfig table synced successfully');
}
).catch((err) => {
    appLogger.error(err);
}
);

module.exports = { SystemConfigModel };