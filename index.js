const express = require('express');
const { createServer } = require('http');  // Import http module
const { Server } = require('socket.io');   // Import socket.io module
const { appLogger } = require('./src/config/appLogger');
const { dbConnection } = require('./src/database/conection');
const expressListEndpoints = require('express-list-endpoints');
const { ManagerModel } = require('./src/models/Manager/Manager.model');
const { ManagerTokenModel } = require('./src/models/ManagerToken/ManagerToken.model');
const cors = require('cors');
const app = express();

const Sentiment = require('sentiment');
const bodyParser = require('body-parser');
const { CallModel } = require('./src/models/Calls/Calls.model');
const { CallsRoutes } = require('./src/routes/Calls/Calls.routes');
const { ManagerRoutes } = require('./src/routes/Manager/Manager.routes');
const { AgentModel, AgentAvailabilityModel } = require('./src/models/Agent/Agent.Model');
const { AgentTokenModel } = require('./src/models/AgentToken/AgentToken.model');
const { AgentRoutes } = require('./src/routes/Agent/Agent.routes');
const { where } = require('sequelize');
const { PhoneNumbersModel } = require('./src/models/PhoneNumbers/PhoneNumbers.model');
const { setupSocket } = require('./src/utils/Socket/socketServer');

const { firebaseAdmin } = require('./src/utils/Firebase/firebase');
const { SystemConfigModel } = require('./src/models/SystemConfig/SystemConfig.Model');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: '*',
}));

const httpServer = createServer(app);
const io = setupSocket(httpServer);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/Call', CallsRoutes);
app.use('/Manager', ManagerRoutes);
app.use('/Agent', AgentRoutes);

app.get('/socket', (req, res) => {

    res.send('Hello from server');
})
app.get('/', (req, res) => {
    res.send(`<h1>TO-BE BACKEND</h1>`);
});

// Socket.IO connection handling


httpServer.listen(3000, () => {
    appLogger.info('Server is running on port 3000');
    appLogger.debug(process.env.NODE_ENV);
    expressListEndpoints(app).forEach((route) => {
        appLogger.info(`Route Enabled: ${route.methods} ${route.path}`);

    });
});

module.exports = { io };