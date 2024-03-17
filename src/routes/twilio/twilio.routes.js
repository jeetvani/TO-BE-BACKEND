const router = require('express').Router();


//these are all twilio webHooks 
router.post('/handleHangUp', (req, res) => {

});

module.exports = {
    TwilioRoutes: router
}