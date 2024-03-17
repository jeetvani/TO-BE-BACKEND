const twilioProdConfig = {
    accountSid: 'ACc95dd4d2c9fde917389558818b899607',
    authToken: '22810fb3799dc25aa2487c1f81768fe7',
    fromPhoneNumber: '+18189460736',
}

const twilioConfig = process.env.NODE_ENV === 'production' ? twilioProdConfig : twilioProdConfig;

module.exports = { twilioConfig };