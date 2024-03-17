const axios = require('axios');
const { twilioConfig } = require('./src/config/twilio.config');

// Twilio API base URL
const twilioBaseUrl = 'https://api.twilio.com/2010-04-01';

// Encode the Twilio API key as a base64 string
const credentials = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64');
const authHeader = `Basic ${credentials}`;

// Twilio account details
const accountId = 'ACc95dd4d2c9fde917389558818b899607';
const callId = 'CAdbb9c1da81c82c0e6d29389987d7cd9f';

// Twilio API URLs
const callUrl = `${twilioBaseUrl}/Accounts/${accountId}/Calls/${callId}.json`;
axios.request({
    method: 'get',
    maxBodyLength: Infinity,
    url: callUrl,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
    }
})
    .then((response) => {
        const recordingsUrl = `https://api.twilio.com/${response.data.subresource_uris.recordings}`;
        const balanceUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountId}/Balance.json`;


        let callCounts = {}; // Object to store call counts for each owned number

        // Fetch recordings
        axios.get(recordingsUrl, {
            headers: {
                'Authorization': authHeader,
            }
        })
            .then((response) => {
                const data = response.data;
                const recordings = data.recordings;

                recordings.forEach(recording => {
                    const phoneNumber = recording.to;
                    callCounts[phoneNumber] = (callCounts[phoneNumber] || 0) + 1;
                    console.log(recording.media_url);
                });

                

            })
            .catch((error) => {
                console.log("Error fetching recordings:", error);
            });
    })
    .catch((error) => {
        console.log("Error fetching call details:", error);
    });





// ! this is for future reference
// ! twilioApiModule.js

// const axios = require('axios');
// const { twilioConfig } = require('./src/config/twilio.config');

// const twilioBaseUrl = 'https://api.twilio.com/2010-04-01';

// const getMediaUrl = async (callId) => {
//     const credentials = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64');
//     const authHeader = `Basic ${credentials}`;

//     const callUrl = `${twilioBaseUrl}/Accounts/${twilioConfig.accountSid}/Calls/${callId}.json`;

//     try {
//         const response = await axios.get(callUrl, {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': authHeader,
//             }
//         });

//         const recordingsUrl = `${twilioBaseUrl}${response.data.subresource_uris.recordings}`;
//         const recordingsResponse = await axios.get(recordingsUrl, {
//             headers: {
//                 'Authorization': authHeader,
//             }
//         });

//         const mediaUrl = recordingsResponse.data.recordings[0].media_url;
//         return mediaUrl;
//     } catch (error) {
//         throw error;
//     }
// };

// module.exports = { getMediaUrl };
