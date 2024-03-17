const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");
const ManagerModel = dbConnection.define('Managers', {
    ManagerId: {
        type: DataTypes.STRING,
        primaryKey: true,

    },
    ManagerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ManagerEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ManagerPassword: {
        type: DataTypes.STRING,
        allowNull: false
    }
    ,
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

ManagerModel.sync({ force: false }).then(() => {
    appLogger.info('Manager table synced successfully');
}
).catch((err) => {
    appLogger.error(err);
}
);





module.exports = { ManagerModel };