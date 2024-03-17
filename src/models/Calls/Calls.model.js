const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");
const CallModel = dbConnection.define("Calls", {
    callId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    to: {
        type: DataTypes.STRING,
        allowNull: false
    },
    from: {
        type: DataTypes.STRING,
        allowNull: false
    },
    callDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    pickedUp: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    initialResponse: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "No response"
    },
    hungUpWhenCalled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    recordingUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "No recording"
    },
    transferredToAgent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    transferredTo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "No transfer"
    },
    transferredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    callResult: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "No result"
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date()
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date()
    }

});
CallModel.sync({ force: false }).then(() => {
    appLogger.info("Calls table synced successfully");
}
);

module.exports = {
    CallModel
};