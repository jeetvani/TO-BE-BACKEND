const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");
const ManagerTokenModel = dbConnection.define('ManagerTokens', {

    ManagerId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    Token: {
        type: DataTypes.STRING,
        allowNull: false
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

ManagerTokenModel.sync({ force: false }).then(() => {
    appLogger.info('ManagerToken table synced successfully');
}
).catch((err) => {
    appLogger.error(err);
}
);
module.exports = { ManagerTokenModel };