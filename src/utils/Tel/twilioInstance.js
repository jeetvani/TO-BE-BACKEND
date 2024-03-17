const { twilioConfig } = require('../../config/twilio.config');

const accountSid = twilioConfig.accountSid;
const authToken = twilioConfig.authToken;
const client = require('twilio')(accountSid, authToken);

module.exports = {
    twilioInstance: client,
};