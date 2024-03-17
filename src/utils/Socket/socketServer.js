const { Server } = require('socket.io');
const { appLogger } = require('../../config/appLogger');
const { AgentModel } = require('../../models/Agent/Agent.model');
const { AgentTokenModel } = require('../../models/AgentToken/AgentToken.model');


let io; // Declare a module-level variable

const setupSocket = (httpServer) => {
    io = new Server(httpServer);


    io.on('connection', (socket) => {
        appLogger.info('A user connected');
        io.emit("server", "Hello from server , server is working fine")
        socket.on('login', async (data) => {

            const finalData = JSON.parse(data);
            console.log(typeof (finalData));
            console.log(finalData);
            const agentId = finalData.agentId;

            const agentToken = finalData.agentToken;
            const findAgent = await AgentModel.findOne({ where: { AgentId: agentId } });
            console.log(findAgent);
            if (!agentToken || !agentId) {
                return socket.emit('agentStatus', { error: "Invalid input Please Provide agent Id and token" });
            }

            if (!findAgent) {
                return socket.emit('agentStatus', { error: "Agent not found" });
            }
            const checkToken = await AgentTokenModel.findOne({ where: { AgentId: agentId, Token: agentToken } });
            if (!checkToken) {
                return socket.emit('agentStatus', { error: "Invalid Token" });
            }
            if (checkToken) {
                return socket.emit('agentStatus', { success: "Login Successfull" });
            }

        });
        socket.on('disconnect', () => {
            appLogger.info('A user disconnected');
        });

    }
    );

    // Additional setup or event handling can be added here if needed
    return io;
};



module.exports = { setupSocket, io };
