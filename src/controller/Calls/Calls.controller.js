
const axios = require('axios');
const { appLogger } = require("../../config/appLogger");
const { server_base_url } = require("../../config/serverConfig");
const natural = require('natural');
const tokenizer = new natural.AggressiveTokenizerHi();
const { twilioConfig } = require("../../config/twilio.config");
const { CallModel } = require("../../models/Calls/Calls.model");
const { AgentAvailabilityModel, AgentModel } = require("../../models/Agent/Agent.model");

const { PhoneNumbersModel } = require("../../models/PhoneNumbers/PhoneNumbers.model");
const { SystemConfigModel } = require("../../models/SystemConfig/SystemConfig.model");
const { firebaseAdmin } = require("../../utils/Firebase/firebase");
const { twilioInstance } = require("../../utils/Tel/twilioInstance");
const Sentiment = require('sentiment');

const VoiceResponse = require('twilio').twiml.VoiceResponse;


// & initiateCall will be called when the manager wants to initiate the call
exports.initiateCall = async (req, res) => {
    try {
        const getDefaultConfig = await SystemConfigModel.findOne()
        if (!getDefaultConfig) {
            return res.status(404).json({ message: "No default config found" });
        }
        const defaultConfig = getDefaultConfig.dataValues;
        const { defaultPhoneNumber, numberOfCalls } = defaultConfig;

        const { limit = numberOfCalls } = req.body;

        appLogger.info("Initiating call to " + limit + " numbers");

        const getAllUncalledNumbers = await PhoneNumbersModel.findAll({
            where: {
                called: false
            },
            limit: limit,
        });

        // Check if there are no numbers to call
        if (getAllUncalledNumbers.length === 0) {
            return res.status(404).json({ message: "No numbers to call" });
        }

        // Iterate through each uncalled number
        for (const number of getAllUncalledNumbers) {
            try {
                const toPhoneNumber = number.PhoneNumber; // The recipient's phone number
                appLogger.info("Initiating call to " + toPhoneNumber);

                // Create a new VoiceResponse
                const response = new VoiceResponse();

                // Play initial audio without gathering input
                response.play('https://dl.sndup.net/n2pv/TO%20BE%20INTIAL%20HELLO.mp3');

                // Create a new <Gather> for speech input
                const gather = response.gather({
                    input: 'speech',
                    action: `${server_base_url}/Call/handleFirstResponse`,
                    method: 'POST',
                    timeout: 3,
                    language: 'hi-IN',
                });

                // Play audio within the Gather for speech input
                gather.play('https://dl.sndup.net/z7ty/TO%20BE%20ASK%20IF%20INTRESTED.mp3');

                const finalResponse = response.toString();

                // Initiate the call using Twilio
                const call = await twilioInstance.calls.create({
                    twiml: finalResponse,
                    to: toPhoneNumber,
                    from: defaultPhoneNumber,
                    record: true,
                });

                // Store the call details in the database
                const storeCallInDb = await CallModel.create({
                    callId: call.sid ? call.sid : "ERROR SID",
                    to: toPhoneNumber,
                    from: call.from ? call.from : "ERROR FROM",
                    pickedUp: false,
                });

                // Update the phone number status to 'called'
                const updatePhoneNumber = await PhoneNumbersModel.destroy({
                    where: {
                        index: number.index
                    }
                });
            } catch (error) {
                console.error(`Error making the call: ${error.message} to ${number.PhoneNumber}`);
                await PhoneNumbersModel.destroy({
                    where: {
                        index: number.index
                    }
                });
                // Continue with the next number in case of an error
                continue;
            }
        }

        // Send the response after all calls have been initiated
        res.status(200).json({ message: "Calls initiated successfully" });
    } catch (error) {
        console.error(`Error fetching uncalled numbers: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
}

// ~ initiateCallToSingleNumber will be called when the manager wants to initiate the call to a single number
exports.initiateCallToSingleNumber = async (req, res) => {
    try {
        const getDefaultConfig = await SystemConfigModel.findOne()
        if (!getDefaultConfig) {
            return res.status(404).json({ message: "No default config found" });
        }
        const defaultConfig = getDefaultConfig.dataValues;
        const { defaultPhoneNumber, numberOfCalls } = defaultConfig;
        const { phoneNumber: toPhoneNumber } = req.body;
        appLogger.info("Initiating call to " + toPhoneNumber);
        const response = new VoiceResponse();
        response.play('https://dl.sndup.net/n2pv/TO%20BE%20INTIAL%20HELLO.mp3');
        const gather = response.gather({
            input: 'speech',
            action: `${server_base_url}/Call/handleFirstResponse`,
            method: 'POST',
            timeout: 3,
            language: 'en-US',
        });
        gather.play('https://dl.sndup.net/z7ty/TO%20BE%20ASK%20IF%20INTRESTED.mp3');
        const finalResponse = response.toString();
        const call = await twilioInstance.calls.create({
            twiml: finalResponse,
            to: toPhoneNumber,
            from: defaultPhoneNumber,
            record: true,
        });
        const storeCallInDb = await CallModel.create({
            callId: call.sid ? call.sid : "ERROR SID",
            to: toPhoneNumber,
            from: call.from ? call.from : "ERROR FROM",
            pickedUp: false,
        });
        res.status(200).json({ message: "Call initiated successfully" });

    } catch (error) {
        console.error(`Error making the call: ${error.message} to ${req.body.phoneNumber}`);
        res.status(500).json({ message: "Internal server error" });
    }
}


const interestWords = [
    'जैसे', 'हां', 'वाह', 'ठीक', 'जाओ', 'आगे', 'दिलचस्पी', 'बिना संदेह', 'बिल्कुल',
    'सच', 'बहुत', 'बढ़िया', 'शानदार', 'बेहतरीन', 'अद्भुत', 'अच्छा', 'चमत्कारिक',
    'प्रभावशाली', 'अद्वितीय', 'अव्यापक', 'मोहक'
];

// Set of words indicating negation in Hindi
const negationWords = [
    'नहीं', 'ना', 'मत', 'इंकार', 'इनकार', 'मना', 'अस्वीकार'
];

function checkInterest(sentence) {
    // Tokenize the sentence
    const tokens = tokenizer.tokenize(sentence);

    // Check if any token matches the interest words
    for (let token of tokens) {
        if (interestWords.includes(token)) {
            return true;
        }
    }

    // Check if any token matches the negation words
    for (let token of tokens) {
        if (negationWords.includes(token)) {
            return false;
        }
    }

    return false;
}

//* handleFirstResponse will be called when the user responds to the initial message
exports.handleFirstResponse = async (req, res) => {
    const sentiment = new Sentiment();
    console.log("++++++++++++++First Response++++++++++++++");
    console.log(req.body);
    console.log("++++++++++++++First Response++++++++++++++");

    const speechResult = req.body.SpeechResult;
    appLogger.info("User Result", speechResult);

    const result = checkInterest(speechResult);
    console.log("User Interest Result");
    console.log(result);
    console.log("User Interest Result");

    // const result = sentiment.analyze(speechResult);
    // console.log("Sentiment Result");
    // console.log(result);
    // console.log("Sentiment Result");

    const updateInitialResponse = await CallModel.update({
        initialResponse: speechResult,
        callResult: "Obtained First Response from User",
        pickedUp: true,

    }, {
        where: {
            callId: req.body.CallSid
        }
    });



    if (result) {
        appLogger.info('User is interested in the product');

        const getAvailableAgent = await firebaseAdmin.database().ref('Agent').orderByChild('Availability').equalTo(true).once('value').then((snapshot) => {
            const data = snapshot.val();
            const arr = [];
            for (const key in data) {
                arr.push(data[key]);
            }
            return arr;
        }).catch((err) => {
            appLogger.error(err);
        });
        console.log(getAvailableAgent);

        if (getAvailableAgent.length === 0) {
            appLogger.info('No agent available');

            //! if user is interested but no agent available then play a message and hangup the call
            const response = new VoiceResponse()
            await CallModel.update({
                callResult: "No Agent was Available to take the call"
            }, {
                where: {
                    callId: req.body.CallSid
                }
            });

            const xml = response.play('https://dl.sndup.net/jc4s/mp%20representative%20available.mp3');

            res.send(xml.toString());
            //! if user is interested but no agent available then play a message and hangup the call



        }
        if (getAvailableAgent.length > 0) {
            const arr = [];
            const agentPromises = getAvailableAgent.map(async (agent) => {
                try {
                    const foundAgent = await AgentModel.findOne({
                        where: {
                            AgentId: agent.AgentId
                        }
                    });

                    arr.push(foundAgent.AgentPhone);
                } catch (err) {
                    appLogger.error(err);
                }
            });

            // Wait for all promises to resolve before logging the array
            Promise.all(agentPromises)
                .then(() => {

                    const response = new VoiceResponse();
                    // * finally console log the array of phone numbers
                    console.log(arr);
                    // Add a message before dialing
                    response.play('https://dl.sndup.net/pdfn/ForwardingToAgent.mp3');

                    const dial = response.dial({
                        action: `${server_base_url}/Call/handleSecondResponse`,
                        method: 'POST',

                    });

                    for (const number of arr) {

                        dial.number({
                            statusCallbackEvent: 'answered completed',
                            statusCallback: `${server_base_url}/Call/handleSecondResponse`,
                            statusCallbackMethod: 'POST'


                        }, number);
                    }
                    console.log(response.toString());

                    //  console.log(xmlResponse.toString());
                    res.send(response.toString());
                })
                .catch((err) => {
                    appLogger.error(err);
                });

        }







    }
    if (!result) {
        appLogger.info('User is not intrested in the product');

        //hangup the call
        const response = new VoiceResponse();
        response.hangup();
        res.send(response.toString());
    }




}

//* handleSecondResponse will be called when the call is picked up by the agent
exports.handleSecondResponse = async (req, res) => {
    console.log("+++++++Second Response++++++++");
    console.log(req.body);
    console.log("+++++++Second Response++++++++");


    const callStatus = req.body.CallStatus;
    const direction = req.body.Direction ? req.body.Direction : false;
    const callId = req.body.ParentCallSid;
    if (callStatus == "completed" && direction == "outbound-dial") {
        appLogger.info("Call Completed with call Id: " + callId);
        const update = await CallModel.update({
            callResult: "Call Completed With Agent",
            transferredToAgent: true,
            callDuration: req.body.CallDuration
        }, {
            where: {
                callId
            }
        });
        const findAgent = await AgentModel.findOne({
            where: {
                AgentPhone: req.body.To
            }
        });
        if (update) {
            appLogger.info("Call Status Updated to Completed With Agent");
        }
        if (findAgent) {
            appLogger.info("Agent Found");
            appLogger.info(findAgent.AgentId);
            await AgentAvailabilityModel.update({
                Availability: true,
                onCall: null
            }, {
                where: {
                    AgentId: findAgent.AgentId,

                }
            });
            await firebaseAdmin.database().ref(`Agent/${findAgent.AgentId}`).update({
                Availability: true,
                onCall: null
            }).catch((err) => {
                appLogger.error(err);
            }).then(() => {
                appLogger.info("Agent Availability Updated");
            }
            );


        }

    }

    if (callStatus == "in-progress" && direction == "outbound-dial") {


        const findAgent = await AgentModel.findOne({
            where: {
                AgentPhone: req.body.To
            }
        });
        if (!findAgent) {
            return;
        }
        appLogger.info("Call in Progress with call Id: " + callId);
        const updateCallStatus = await CallModel.update({
            callResult: "Call in Progress With Agent",
            transferredToAgent: true,
            transferredAt: new Date().toISOString(),
            transferredTo: findAgent.AgentId

        }, {
            where: {
                callId
            }
        });
        if (updateCallStatus) {
            appLogger.info("Call Status Updated to In Progress With Agent");
        }
        await AgentAvailabilityModel.update({
            Availability: false,
            onCall: req.body.ForwardedFrom ? req.body.ForwardedFrom : req.body.CalledVia ? req.body.CalledVia : "COULD NOT FIND NUMBER",
        }, {
            where: {
                AgentId: findAgent.AgentId
            }
        });
        await firebaseAdmin.database().ref(`Agent/${findAgent.AgentId}`).update({
            Availability: false,
            onCall: req.body.ForwardedFrom ? req.body.ForwardedFrom : req.body.CalledVia ? req.body.CalledVia : "COULD NOT FIND NUMBER",
        }).catch((err) => {
            appLogger.error(err);
        }).then(() => {
            appLogger.info("Agent Availability Updated");
        }
        );

    }

    //  ^ need to monitor two call status completed and in-progress
    // ^ if call is completed then update the call record in db
    // ^ if call is in-progress then update the call record in db




}






// * controller to fetch call recording

exports.getCallRecording = async (req, res) => {
    const { callId } = req.body;
    if (!callId) {
        return res.status(400).json({ message: "Call Id is required" });
    }


    // Twilio API base URL
    const twilioBaseUrl = 'https://api.twilio.com/2010-04-01';

    // Encode the Twilio API key as a base64 string
    const credentials = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64');
    const authHeader = `Basic ${credentials}`;

    // Twilio account details
    const accountId = twilioConfig.accountSid;


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
                        return res.status(200).json({ message: "Call Recording Fetched Successfully", recording: recording.media_url });
                    });



                })
                .catch((error) => {
                    console.log("Error fetching recordings:", error);
                    return res.status(500).json({ message: "Error fetching recording for this call" });
                });
        })
        .catch((error) => {
            console.log("Error fetching call details:", error);
            return res.status(500).json({ message: "Error Fetching Recording For this call" });
        });



}



// ! In future, we can add a feature to transfer the call to another agent if the first agent is not available


// exports.handleSecondResponse = async (req, res) => {
//     console.log("+++++++Second Response++++++++");
//     console.log(req.body);
//     console.log("+++++++Second Response++++++++");

//     const { CallStatus, Direction, CallSid, To, ForwardedFrom, CalledVia } = req.body;

//     if (CallStatus === "completed" && Direction === "outbound-dial") {
//         await handleCompletedCall(CallSid, To);
//     }

//     if (CallStatus === "in-progress") {
//         await handleInProgressCall(CallSid, To, ForwardedFrom, CalledVia);
//     }
// };

// async function handleCompletedCall(CallSid, To) {
//     const updateCallStatus = await CallModel.update({
//         callResult: "Call Completed With Agent"
//     }, {
//         where: { callId: CallSid }
//     });

//     const findAgent = await AgentModel.findOne({
//         where: { AgentPhone: To }
//     });

//     if (findAgent) {
//         await updateAgentAvailability(findAgent.AgentId, true, null);
//     }
// }

// async function handleInProgressCall(CallSid, To, ForwardedFrom, CalledVia) {
//     const updateCallStatus = await CallModel.update({
//         callResult: "Call in Progress With Agent"
//     }, {
//         where: { callId: CallSid }
//     });

//     const findAgent = await AgentModel.findOne({
//         where: { AgentPhone: To }
//     });

//     if (!findAgent) return;

//     const onCall = ForwardedFrom || CalledVia || "COULD NOT FIND NUMBER";
//     await updateAgentAvailability(findAgent.AgentId, false, onCall);

//     await Promise.all([
//         CallModel.update({
//             pickedUp: true,
//             transferredTo: findAgent.AgentId,
//             transferredToAgent: true,
//             transferredAt: new Date().toISOString()
//         }, {
//             where: { callId: CallSid }
//         }),
//         updateFirebaseAgentAvailability(findAgent.AgentId, false, onCall)
//     ]);
// }

// async function updateAgentAvailability(AgentId, availability, onCall) {
//     await AgentAvailabilityModel.update({
//         Availability: availability,
//         onCall: onCall
//     }, {
//         where: { AgentId: AgentId }
//     });
// }

// async function updateFirebaseAgentAvailability(AgentId, availability, onCall) {
//     try {
//         await firebaseAdmin.database().ref(`Agent/${AgentId}`).update({
//             Availability: availability,
//             onCall: onCall
//         });
//         appLogger.info("Agent Availability Updated");
//     } catch (err) {
//         appLogger.error(err);
//     }
// }
