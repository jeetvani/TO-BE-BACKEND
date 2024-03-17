const { appLogger } = require("../../config/appLogger");
const { dbConnection } = require("../../database/conection");
const { DataTypes } = require("sequelize");

const AgentModel = dbConnection.define('Agents', {
    AgentId: {
        type: DataTypes.STRING,
        primaryKey: true,

    },
    AgentName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    AgentEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    AgentPassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    AgentPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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


const AgentAvailabilityModel = dbConnection.define('AgentAvailability', {

    AgentId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    Availability: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    onCall: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    lastActive: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    }
}, {
    timestamps: false,

});

AgentModel.hasMany(AgentAvailabilityModel, {
    foreignKey: {
        name: 'AgentId',
        allowNull: false

    }
});
AgentAvailabilityModel.belongsTo(AgentModel, {
    foreignKey: {
        name: 'AgentId',
        allowNull: false

    }
});


AgentModel.sync({ force: false }).then(() => {
    appLogger.info('Agent table synced successfully');
}).catch((err) => {
    appLogger.error("Error syncing Agent table", err);
});
AgentAvailabilityModel.sync({ force: false }).then(() => {
    appLogger.info('AgentAvailability table synced successfully');
}
).catch((err) => {
    appLogger.error("Error syncing AgentAvailability table", err);
}
);


module.exports = { AgentModel, AgentAvailabilityModel };