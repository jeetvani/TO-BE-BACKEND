const { initiateCall, handleFirstResponse, handleSecondResponse, initiateCallToSingleNumber } = require('../../controller/Calls/Calls.controller');

const router = require('express').Router();


router.post('/initiateCall', initiateCall)
router.post('/initiateCallToSingleNumber', initiateCallToSingleNumber)
router.post('/handleFirstResponse', handleFirstResponse)
router.post('/handleSecondResponse', handleSecondResponse)
module.exports = {
    CallsRoutes: router
};