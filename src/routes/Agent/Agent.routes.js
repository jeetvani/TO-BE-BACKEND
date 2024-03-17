const { createAgent, loginAgent, verifyAgent, getAgentStatus, editAgent, getAllCalls, getAllAgents, getAgentProfile, setAgentStatus, getAgentDetails } = require('../../controller/Agent/Agent.controller');
const { MangerAuthMiddleware } = require('../../controller/Manager/Manager.controller');


const router = require('express').Router();

router.post('/createAgent', MangerAuthMiddleware, createAgent)
router.post('/getAllAgents', MangerAuthMiddleware, getAllAgents)
router.post('/getAgentDetails', MangerAuthMiddleware, getAgentDetails)
router.post('/loginAgent', loginAgent)
router.post('/getAgentProfile', getAgentProfile)
router.post('/verifyAgent', verifyAgent)
router.post('/getAgentStatus', getAgentStatus)
router.post('/setAgentStatus', setAgentStatus)
router.post('/editAgent', editAgent)
router.post('/getAllCalls', getAllCalls)
module.exports = {
    AgentRoutes: router
};