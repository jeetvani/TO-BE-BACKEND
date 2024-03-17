const { appLogger } = require("../../config/appLogger");
const { AgentModel, AgentAvailabilityModel } = require("../../models/Agent/Agent.model");
const { AgentTokenModel } = require("../../models/AgentToken/AgentToken.model");
const uniqid = require('uniqid');
const uuid = require('uuid');
const { firebaseAdmin } = require("../../utils/Firebase/firebase");
const { CallModel } = require("../../models/Calls/Calls.model");

exports.createAgent = async (req, res) => {
    const { AgentName, AgentEmail, AgentPassword, AgentPhone } = req.body;

    if (!AgentName || AgentName.trim().length < 3 ||
        !AgentEmail || AgentEmail.trim().length < 3 || !AgentEmail.includes("@") ||
        !AgentPassword || AgentPassword.trim().length < 3 ||
        !AgentPhone || AgentPhone.trim().length < 5) {
        return res.status(400).json({
            message: "Invalid input. Please check the provided data."
        });
    }

    const AgentId = uniqid("TO-BE-AGENT-");
    const checkPhone = await AgentModel.findOne({ where: { AgentPhone } });
    if (checkPhone) {
        return res.status(409).json({
            message: "Agent with the provided phone number already exists"
        });
    }

    const checkEmail = await AgentModel.findOne({ where: { AgentEmail } });
    if (checkEmail) {
        return res.status(409).json({
            message: "Agent with the provided email already exists"
        });
    }

    try {
        const agent = await AgentModel.create({ AgentId, AgentName, AgentEmail, AgentPassword, AgentPhone });
        const authToken = uuid.v4();
        const agentToken = await AgentTokenModel.create({ AgentId, Token: authToken });

        if (agent && agentToken) {
            await AgentAvailabilityModel.create({ AgentId, Availability: false });
            await firebaseAdmin.database().ref(`Agent/${AgentId}`).set({
                AgentId,
                AgentName,
                AgentEmail,
                AgentPhone,
                Availability: false,
                onCall: false,
                AgentToken: authToken
            });
            return res.status(200).json({
                message: "Agent created successfully",
                AgentId: agent.AgentId,
            });
        } else {
            return res.status(500).json({
                message: "Failed to create Agent"
            });
        }
    } catch (error) {
        appLogger.error("Error creating agent:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

exports.getAllAgents = async (req, res) => {
    const agents = await AgentModel.findAll();
    if (agents) {
        return res.status(200).json(agents);
    } else {
        return res.status(500).json({
            message: "Failed to retrieve Agents"
        });
    }
};

exports.getAgentDetails = async (req, res) => {
    const { AgentId } = req.body
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    const checkAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!checkAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    if (checkAgent) {
        const agentDetails = checkAgent.dataValues;
        const getAllCallsForAgent = await CallModel.findAll({
            where: {
                transferredTo: AgentId,
            }
        });
        agentDetails.calls = getAllCallsForAgent;
        return res.status(200).json(
            agentDetails
        )
    }
}


exports.getAgentProfile = async (req, res) => {

    const { agentid: AgentId, token: Token } = req.headers
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    if (!Token) {
        return res.status(400).json({
            message: "Agent Token is required for authentication"
        })
    }
    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkToken = await AgentTokenModel.findOne({ where: { AgentId, Token } });
    if (!checkToken) {
        return res.status(403).json({
            message: "Invalid Token"
        })
    }

    const totalCalls = await CallModel.findAll({
        where: {
            transferredTo: AgentId
        }
    })

    findAgent.dataValues.totalCalls = totalCalls.length;
    findAgent.dataValues.registeredAt = findAgent.dataValues.createdAt;

    if (findAgent && checkToken) {
        return res.status(200).json(
            findAgent
        )
    }
}
exports.editAgent = async (req, res) => {
    const { AgentId, AgentName, AgentEmail, AgentPhone, AgentPassword } = req.body;
    if (!AgentId || !AgentName || AgentName.trim().length < 3 || AgentPassword.trim().length < 4 ||
        !AgentEmail || AgentEmail.trim().length < 3 || !AgentEmail.includes("@") ||
        !AgentPhone || AgentPhone.trim().length < 5) {
        return res.status(400).json({
            message: "Invalid input. Please check the provided data."
        });
    }
    const checkAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!checkAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkPhone = await AgentModel.findOne({ where: { AgentPhone } });
    if (checkPhone && checkPhone.AgentId !== AgentId) {
        return res.status(409).json({
            message: "Agent with the provided phone number already exists"
        });
    }
    const checkEmail = await AgentModel.findOne({ where: { AgentEmail } });
    if (checkEmail && checkEmail.AgentId !== AgentId) {
        return res.status(409).json({
            message: "Agent with the provided email already exists"
        });
    }
    try {
        const updatedAgent = await AgentModel.update({ AgentName, AgentEmail, AgentPhone, AgentPassword }, { where: { AgentId } });
        if (updatedAgent) {
            await firebaseAdmin.database().ref(`Agent/${AgentId}`).update({
                AgentName,
                AgentEmail,
                AgentPhone
            });

            return res.status(200).json({
                message: "Agent updated successfully",
                updatedAgent
            });
        } else {
            return res.status(500).json({
                message: "Failed to update Agent"
            });
        }
    } catch (error) {
        appLogger.error("Error updating agent:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


exports.loginAgent = async (req, res) => {
    const { AgentEmail, AgentPassword } = req.body;
    const missingFields = [];
    if (!AgentEmail || AgentEmail.trim().length < 3) {
        missingFields.push("AgentEmail");
    }
    if (!AgentPassword || AgentPassword.trim().length < 3) {
        missingFields.push("AgentPassword");
    }
    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Invalid fields: ${missingFields.join(", ")}`
        });
    }
    const checkAgentEmail = await AgentModel.findOne({ where: { AgentEmail } });
    if (!checkAgentEmail) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkAgentPassword = await AgentModel.findOne({ where: { AgentEmail, AgentPassword } });
    if (!checkAgentPassword) {
        return res.status(403).json({
            message: "Invalid Agent Password"
        });
    }

    const newAuthToken = uuid.v4();
    const destroyedToken = await AgentTokenModel.destroy({ where: { AgentId: checkAgentEmail.AgentId } });
    const agentToken = await AgentTokenModel.create({ AgentId: checkAgentEmail.AgentId, Token: newAuthToken });
    if (agentToken) {
        return res.status(200).json({
            message: "Agent logged in successfully",
            AgentId: checkAgentEmail.AgentId,
            authToken: newAuthToken,
            Token: newAuthToken
        });
    } else {
        return res.status(500).json({
            message: "Failed to login Agent"
        });
    }

};


exports.verifyAgent = async (req, res) => {

    const { agentid: AgentId, token: Token } = req.headers
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    if (!Token) {
        return res.status(400).json({
            message: "Agent Token is required for authentication"
        })
    }
    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkToken = await AgentTokenModel.findOne({ where: { AgentId, Token } });
    if (!checkToken) {
        return res.status(403).json({
            message: "Invalid Token"
        })
    }
    if (findAgent && checkToken) {
        return res.status(200).json({
            message: "Agent Verified Successfully"
        })
    }
}


exports.getAgentStatus = async (req, res) => {
    const { agentid: AgentId } = req.headers
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const agentStatus = await AgentAvailabilityModel.findOne({ where: { AgentId } });
    if (agentStatus) {
        return res.status(200).json({
            message: "Agent Status Retrieved Successfully",
            Availability: agentStatus.Availability,
            onCall: agentStatus.onCall
        })
    } else {
        return res.status(500).json({
            message: "Failed to retrieve Agent Status"
        })
    }
}

exports.setAgentStatus = async (req, res) => {
    const { agentid: AgentId, token: Token } = req.headers
    const { Availability } = req.body;
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    if (!Token) {
        return res.status(400).json({
            message: "Agent Token is required for authentication"
        })
    }
    if (Availability === undefined || Availability === null) {
        return res.status(400).json({
            message: "Agent Availability is required"
        })
    }
    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkToken = await AgentTokenModel.findOne({ where: { AgentId, Token } });
    if (!checkToken) {
        return res.status(403).json({
            message: "Invalid Token"
        })
    }
    if (findAgent && checkToken) {
        const agentStatus = await AgentAvailabilityModel.findOne({ where: { AgentId } });
        if (agentStatus) {
            if (agentStatus.onCall) {
                return res.status(400).json({
                    message: "You cannot change your availability while on a call. Please end the call and try again."
                })
            }

            const updatedAgentStatus = await AgentAvailabilityModel.update({ Availability }, { where: { AgentId } });
            await firebaseAdmin.database().ref(`Agent/${AgentId}`).update({
                Availability,
                onCall: null
            });
            if (updatedAgentStatus) {
                return res.status(200).json({
                    message: "Agent Status Updated Successfully",
                    Availability
                })
            } else {
                return res.status(500).json({
                    message: "Failed to update Agent Status"
                })
            }
        } else {
            return res.status(500).json({
                message: "Failed to retrieve Agent Status"
            })
        }
    }
}


exports.getStats = async (req, res) => {
    const { agentid: AgentId } = req.headers
    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        })
    }
    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }
    const checkToken = await AgentTokenModel.findOne({ where: { AgentId, Token } });
    if (!checkToken) {
        return res.status(403).json({
            message: "Invalid Token"
        })

    }
    if (findAgent && checkToken) {
        const getAllCallsForAgent = await CallModel.findAll({
            where: {
                transferredTo: AgentId,
            }
        });
        const totalCalls = getAllCallsForAgent.length;
        res.status(200).json({
            message: "Agent Stats Retrieved Successfully",
            totalCalls
        })

    }
}
exports.getAllCalls = async (req, res) => {
    const { agentid: AgentId, token: Token } = req.headers;
    const { pageNumber } = req.body;

    if (!AgentId) {
        return res.status(400).json({
            message: "Agent Id is required"
        });
    }

    if (!pageNumber || pageNumber < 1) {
        return res.status(400).json({
            message: "Invalid page number please provide a valid page number"
        });
    }

    const findAgent = await AgentModel.findOne({ where: { AgentId } });
    if (!findAgent) {
        return res.status(404).json({
            message: "Agent not found"
        });
    }

    const checkToken = await AgentTokenModel.findOne({ where: { AgentId, Token } });
    if (!checkToken) {
        return res.status(403).json({
            message: "Invalid Token"
        });
    }

    if (findAgent && checkToken) {
        const pageSize = 20;
        const offset = (pageNumber - 1) * pageSize;

        const getAllCallsForAgent = await CallModel.findAll({
            where: {
                transferredTo: AgentId,
            },
            limit: pageSize,
            offset: offset
        });






        res.status(200).json(

            getAllCallsForAgent
        );
    }
};

