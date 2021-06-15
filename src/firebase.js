var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/database");
require('dotenv').config();


const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

class Firebase {
  constructor() {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }else {
      firebase.app(); // if already initialized, use that one
    }
    this.db = firebase.database();
  }

  // *** User API ***
  users = () => this.db.ref('users');
  userID = id => this.db.ref(`ids/${id}`);
  userUUID = uid => this.db.ref(`users/${uid}`);
  teleIds = () => this.db.ref('teleIds');
  userTeleId = teleId => this.db.ref(`teleIds/${teleId}`);
}


module.exports = {Firebase}
