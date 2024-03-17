const { appLogger } = require("../../config/appLogger");
const { ManagerModel } = require("../../models/Manager/Manager.model");
const { ManagerTokenModel } = require("../../models/ManagerToken/ManagerToken.model");
const uuid = require('uuid');
const { PhoneNumbersModel } = require("../../models/PhoneNumbers/PhoneNumbers.model");
const { twilioInstance } = require("../../utils/Tel/twilioInstance");
const uniqid = require('uniqid');
const { SystemConfigModel } = require("../../models/SystemConfig/SystemConfig.Model");
const { CallModel } = require("../../models/Calls/Calls.model");
const { Op } = require('sequelize');
exports.createManager = async (req, res) => {
    const defaultPass = "123456";
    const { password } = req.headers;
    if (password !== defaultPass) {
        res.status(403).json({ message: "Invalid password" });
        return;
    }
    try {

        const checkManagerEmail = await ManagerModel.findOne({ where: { ManagerEmail: req.body.ManagerEmail } });
        if (checkManagerEmail) {
            res.status(409).json({ message: "Manager with this email already exists" });
            return;
        }

        const authToken = uuid.v4();
        const ManagerId = uniqid();
        const { ManagerName, ManagerEmail, ManagerPassword } = req.body;
        if (!ManagerName || !ManagerEmail || !ManagerPassword) {
            res.status(400).json({ message: "Invalid input" });
            return;
        }
        const manager = await ManagerModel.create({
            ManagerId,
            ManagerName,
            ManagerEmail,
            ManagerPassword
        });
        if (manager) {

            const managerToken = await ManagerTokenModel.create({ ManagerId, Token: authToken });
            if (managerToken) {

                res.status(200).json({ message: "Manager created successfully" });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    } catch (error) {
        appLogger.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}



exports.ManagerLogin = async (req, res) => {
    try {


        const { ManagerEmail, ManagerPassword } = req.body;
        if (!ManagerEmail || !ManagerPassword) {
            res.status(400).json({ message: "Invalid input" });
            return;
        }
        const manager = await ManagerModel.findOne({ where: { ManagerEmail, ManagerPassword } });
        if (manager) {
            const authToken = uuid.v4();

            const destroyedToken = await ManagerTokenModel.destroy({ where: { ManagerId: manager.ManagerId } });


            await ManagerTokenModel.create({ ManagerId: manager.ManagerId, Token: authToken });

            res.status(200).json({ message: "Manager logged in successfully", Token: authToken, ManagerId: manager.ManagerId });
        } else {
            res.status(403).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        appLogger.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.MangerAuthMiddleware = async (req, res, next) => {
    try {
        const { managerid: ManagerId, managertoken: ManagerToken } = req.headers;
        if (!ManagerId || ManagerId == "") {
            res.status(403).json({ message: "ManagerId is required" });
            return;
        }
        if (!ManagerToken || ManagerToken == "") {
            res.status(403).json({ message: "ManagerToken is required" });
            return;
        }
        const checkManagerId = await ManagerModel.findOne({ where: { ManagerId } });
        if (!checkManagerId) {
            res.status(404).json({ message: "Manager Id Not Found" });
            return;
        }
        const checkManagerToken = await
            ManagerTokenModel.findOne({ where: { ManagerId, Token: ManagerToken } });
        if (!checkManagerToken) {
            res.status(403).json({ message: "Invalid Manager Token" });
            return;
        }
        req.ManagerId = ManagerId;
        req.ManagerToken = ManagerToken;
        next();

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.addPhoneNumbersInBulk = async (req, res) => {
    try {
        const { phoneNumbers } = req.body;
        if (typeof phoneNumbers !== 'object' || phoneNumbers === null) {
            res.status(400).json({ message: "phoneNumbers should be an array of objects" });
            return;
        }


        //check if each object in array has PhoneNumber property
        for (let i = 0; i < phoneNumbers.length; i++) {
            if (!phoneNumbers[i].PhoneNumber) {
                res.status(400).json({
                    message: "  phoneNumbers should be an array of objects with PhoneNumber property"
                });

                return;
            }
        }

        const bulkInsert = await PhoneNumbersModel.bulkCreate(phoneNumbers);
        if (bulkInsert) {
            res.status(200).json({ message: "Phone Numbers added successfully" });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    } catch (error) {
        appLogger.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.getAllCallsManager = async (req, res) => {
    try {
        const allCalls = await CallModel.findAll({
            where: {
                //call duration is greater than 0
                callDuration: {
                    [Op.gt]: 0
                }

            }
        });

        if (allCalls.length >= 0) {
            res.status(200).json(allCalls);
        }

    } catch (error) {
        appLogger.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}



exports.getTwilioData = async (req, res) => {
    function convertDateTime(inputDate) {
        const date = new Date(inputDate);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${formatAMPM(date)}`;
        return formattedDate;
    }

    function formatAMPM(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // handle midnight
        minutes = minutes < 10 ? '0' + minutes : minutes; // ensure double digits for minutes
        return `${hours}:${minutes} ${ampm}`;
    }
    const currentBalance = await twilioInstance.balance.fetch();
    let numbersOwned = await twilioInstance.incomingPhoneNumbers.list();
    const totalCallsMade = await CallModel.count();
    const totalCallsAnswered = await CallModel.count({ where: { pickedUp: true } });
    const totalCallsAssisted = await CallModel.count({ where: { transferredToAgent: true } });

    for (let i = 0; i < numbersOwned.length; i++) {
        //delete all the properties just kkkep the phone number
        numbersOwned[i] = {
            PhoneNumber: numbersOwned[i].phoneNumber,
            dateCreated: convertDateTime(numbersOwned[i].dateCreated)
        };
    }
    res.status(200).json({
        currentBalance,
        numbersOwned,
        totalCallsMade,
        totalCallsAnswered,
        totalCallsAssisted
    })

}


exports.verifyManager = async (req, res, next) => {
    try {
        const { managerid: ManagerId, managertoken: ManagerToken } = req.headers;
        if (!ManagerId || ManagerId == "") {
            res.status(403).json({ message: "ManagerId is required" });
            return;
        }
        if (!ManagerToken || ManagerToken == "") {
            res.status(403).json({ message: "ManagerToken is required" });
            return;
        }
        const checkManagerId = await ManagerModel.findOne({ where: { ManagerId } });
        if (!checkManagerId) {
            res.status(404).json({ message: "Manager Id Not Found" });
            return;
        }
        const checkManagerToken = await
            ManagerTokenModel.findOne({ where: { ManagerId, Token: ManagerToken } });
        if (!checkManagerToken) {
            res.status(403).json({ message: "Invalid Manager Token" });
            return;
        }
        req.ManagerId = ManagerId;
        req.ManagerToken = ManagerToken;
        if (checkManagerToken && checkManagerToken) {
            return res.status(200).json({
                message: "Manager Verified Successfully"
            })
        }


    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.updateSystemConfig = async (req, res) => {
    const { managerid: ManagerId, managertoken: ManagerToken } = req.headers;
    if (!ManagerId || ManagerId == "") {
        res.status(403).json({ message: "ManagerId is required" });
        return;
    }
    if (!ManagerToken || ManagerToken == "") {
        res.status(403).json({ message: "ManagerToken is required" });
        return;
    }
    const checkManagerId = await ManagerModel.findOne({ where: { ManagerId } });
    if (!checkManagerId) {
        res.status(404).json({ message: "Manager Id Not Found" });
        return;
    }
    const checkManagerToken = await
        ManagerTokenModel.findOne({ where: { ManagerId, Token: ManagerToken } });
    if (!checkManagerToken) {
        res.status(403).json({ message: "Invalid Manager Token" });
        return;
    }
    const { defaultPhoneNumber, numberOfCalls } = req.body;
    if (!defaultPhoneNumber || !numberOfCalls || typeof numberOfCalls !== 'number') {
        res.status(400).json({ message: "Invalid input" });
        return;
    }

    const getCurrentConfig = await SystemConfigModel.findAll();
    if (getCurrentConfig.length == 0) {
        appLogger.info("Creating new system config");
        const newConfig = await SystemConfigModel.create({ defaultPhoneNumber, numberOfCalls });
        if (newConfig) {
            res.status(200).json({ message: "System Config Updated Successfully" });
            return
        } else {
            res.status(500).json({ message: "Internal server error" });
            return
        }
    }
    if (getCurrentConfig.length > 0) {
        appLogger.info("Updating system config");
        const updateConfig = await SystemConfigModel.update({ defaultPhoneNumber, numberOfCalls }, { where: { index: 1 } });
        if (updateConfig) {
            res.status(200).json({ message: "System Config Updated Successfully" });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
exports.getSystemConfig = async (req, res) => {
    try {
        const getCurrentConfig = await SystemConfigModel.findAll();

        let allPhoneNumbers;
        try {
            allPhoneNumbers = await twilioInstance.incomingPhoneNumbers.list();
            allPhoneNumbers = allPhoneNumbers.map(number => number.phoneNumber);
        } catch (error) {
            console.error("Error fetching phone numbers from Twilio:", error);
            allPhoneNumbers = [];
        }

        if (getCurrentConfig.length === 0) {
            res.status(404).json({ message: "System Config Not Found" });
            return;
        }

        getCurrentConfig[0].dataValues.phoneNumberAvailable = allPhoneNumbers;

        res.status(200).json(getCurrentConfig);
    } catch (error) {
        console.error("Error fetching system config:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
