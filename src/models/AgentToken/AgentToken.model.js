const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");
const AgentTokenModel = dbConnection.define('AgentTokens', {

    AgentId: {
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

AgentTokenModel.sync({ force: false }).then(() => {
    appLogger.info('AgentToken table synced successfully');
}
).catch((err) => {
    appLogger.error(err);
}
);

module.exports = { AgentTokenModel };