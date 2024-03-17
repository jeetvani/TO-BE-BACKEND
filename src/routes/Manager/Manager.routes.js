const { getCallRecording } = require('../../controller/Calls/Calls.controller');
const { ManagerLogin,
    addPhoneNumbersInBulk,
    MangerAuthMiddleware,
    createManager,
    verifyManager,
    getTwilioData,
    updateSystemConfig,
    getSystemConfig, 
    getAllCallsManager} = require('../../controller/Manager/Manager.controller');

const router = require('express').Router();

router.post('/ManagerLogin', ManagerLogin)
router.post('/createManager', createManager)
router.post('/addPhoneNumbersInBulk', MangerAuthMiddleware, addPhoneNumbersInBulk)
router.post('/verifyManager', verifyManager)
router.post('/getTwilioData', MangerAuthMiddleware, getTwilioData)
router.post('/updateSystemConfig', MangerAuthMiddleware, updateSystemConfig)
router.post('/getSystemConfig', MangerAuthMiddleware, getSystemConfig)
router.post('/getCallRecording', getCallRecording)
router.post('/getAllCallsManager',getAllCallsManager)


module.exports = {
    ManagerRoutes: router
};



