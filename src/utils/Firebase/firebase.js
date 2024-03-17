var admin = require("firebase-admin");

var serviceAccount = require("./firebaseAdminKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://to-be-a547f-default-rtdb.europe-west1.firebasedatabase.app"
  });

//make a object in realtime database


console.log("Firebase Admin Initialized");



module.exports = {
    firebaseAdmin: admin
}; // Export the admin module