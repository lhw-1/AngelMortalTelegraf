const {Firebase} = require("./firebase");
const { MainBotNewChat, ChatBotNewChat } = require("./messages");

/**
 * Cache of relevant firebase data
 * 
 * Handles synchronisation with firebase, and provides
 * API for commands
 */
class Model {
  constructor(store) {
    this.fb = new Firebase();
    this.people = {};
    this.teleIds = {};
    this.bots = {};
    this.botIds = [];
  }

  /**
   * getter for model people
   * 
   * @returns cached user data
   */
  getPeople() {
    return this.people;
  }

  /**
   * converts people array to array of json string
   * 
   * @returns array of strings
   */
  toJson() {
    return this.people.map(person => person.toJson());
  }


  /**
   * set up a firebase listener
   * 
   * @param {Function} handle handler for listened data
   * @param {string} ref firebase data ref
   * @param {string} type can be 'value' or 'child_changed'
   * @returns model itself
   */
  setupListener(handle, ref, type) {
    ref.on(type, (snapshot) => {
      const data = snapshot.val();
      console.log(`Database update triggered (${type}):`);
      console.log(data);
      handle(data);
    });
    return this;
  }

  /**
   * register a user
   * 
   * @param {Person} person 
   * @param {string} teleId 
   * @param {string} teleUser 
   */
  register(person, teleId, teleUser) {
    this.fb.userTeleId(teleId).set({
      id: person.id,
      uid: person.uid,
      teleId
    });
    this.fb.userProfile(person.uid).update({
      teleId,
      teleUser: teleUser || "",
    })
  }

  /**
   * update user's tele handle
   * 
   * @param {string} userUid 
   * @param {string} teleUser 
   */
  async updateTeleUser(userUid, teleUser) {
    if (userUid && teleUser) {
      const person = this.getPersonByUUID(userUid);
      if (person.teleUser !== teleUser) {
        console.log(`TeleUser changed from ${person.teleUser} to ${teleUser}`);
        await this.fb.userProfile(userUid).update({
          teleUser: teleUser || "",
        });
      }
    }
  }

  /**
   * get name of the bot from telegram API key 
   * 
   * @param {string} apiKey 
   * @returns bot name string
   */
  getBotName(apiKey) {
    return this.botIds[this.botIds.findIndex(elem => elem.key === apiKey)].value;
  }

  /**
   * get the match user and bot corresponding to a
   * given user and chat name
   * 
   * @param {string} fromId sender user id
   * @param {string} chat chat name of sender user
   * @returns promise of target user and match bot
   */
  getTargetAndBot(fromId, chat) {
    return new Promise((resolve, reject) => {
      const senderTele = this.teleIds[fromId];
      //(await this.getUUIDByTeleId(fromId)).uid;
      console.log(fromId);
      console.log(this.teleIds);
      if (!senderTele) reject("Tele user not found");
      const sender = this.people[senderTele.uid];
      //(await this.getPersonByUUID(senderUUID)).matchUUID;
      if (!sender) reject("Moot user not found. Something is very wrong");
      const match = sender.chats[chat];
      //await this.getPersonByUUID(targetUUID);
      if (match.active) {
        const matchUser = this.people[match.activematchUUID];
        if (!matchUser) reject("Matched moot user doesn't exist. Something is very wrong");
        if (!this.bots) reject("Bots are not initialised");
        resolve({ target: matchUser, bot: this.bots[`chat${match.matchBOT}`] });
      } else {
        reject("No active match at chat");
      }
    });
  }

  /**
   * Get user uid corresponding to teleId
   * 
   * @param {string} teleId 
   * @returns user uid
   */
  getUUIDByTeleId(teleId) {
    return this.teleIds[teleId];
  }

  /**
   * get person corresponding to user uid
   * 
   * @param {string} uuid 
   * @returns person
   */
  getPersonByUUID(uuid) {
    return this.people[uuid];
  }

  /**
   * get user uid from moot generated id
   * 
   * @param {string} id 
   * @returns uuid
   */
  async getUUIDById(id) {
    return this.fb.userID(id).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * get person corresponding to tele handle
   * 
   * @param {string} handle telegram handle
   * @returns person
   */
  getPersonByHandle(handle) {
    return this.fb.userHandle(handle).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    }); 
  }

  /**
   * load up firebase data, and listen to 
   * ref data for updates
   * 
   * @param {string} ref data ref
   * @param {Function} handleLoad handle initial load
   * @param {Function} handleListen handle updates
   */
  loadAndListen(ref, handleLoad, handleListen) {
    ref.once('value').then((snapshot) => {
      handleLoad(snapshot.val());
    }).catch((error) => {
      console.error(error);
    });
    this.setupListener(handleListen, ref, "child_changed");
    this.setupListener(handleListen, ref, "child_added");
  }

  /**
   * initialise and return model
   * 
   * @returns model
   */
  static createModel() {  
    const model = new Model();
    // users  
    model.loadAndListen(model.fb.users(),
    (users) => {
      Object.values(users).forEach(user => {
        if (user.profile) {
          model.people[user.profile.uid] = Person.fromJson(user);
        }
      });
    },
    (user) => {
      const person = Person.fromJson(user);
      const userProfile = user.profile;
      if (model.people[userProfile.uid]) {
        var queueUpdatePending = false;
        var prevAllActive = true
        for (let i=1; i<=5; i++) {
          const oldChat = model.people[userProfile.uid].chats[`chat${i}`];
          const newC = user.chats[`chat${i}`];
          if (!oldChat.active) {
            prevAllActive = false;
            if (newC.active) {
              model.bots['main'].telegram.sendMessage(userProfile.teleId, MainBotNewChat(i));
              model.bots[`chat${i}`].telegram.sendMessage(userProfile.teleId, ChatBotNewChat);
            }
          }
        }
        if (prevAllActive) {
          for (let i=1; i<=5; i++) {
            const newChat = user.chats[`chat${i}`];
            if (!newChat.active) {
              queueUpdatePending = true;
            }
          }
        }
        if (queueUpdatePending) {
          console.log("Performing matchQueue update");
          model.fb.matchQueue().transaction((queue) => {
            if (queue) {
              for (const key of Object.keys(queue)) {
                if (key !== 0) {
                  const match = queue[key];
                  if (match.likerUid === user.profile.uid) {
                    queue[key].likerAvail = true;
                  } else if (match.posterUid === user.profile.uid) {
                    queue[key].posterAvail = true;
                  }
                }
              }
            }
            console.log("returning queue");
            return queue;
          });
        }
      }
      model.people[user.profile.uid] = Person.fromJson(user);
    });
    // teleIds
    model.loadAndListen(model.fb.teleIds(),
    (teles) => {
      if (teles) {
        Object.values(teles).forEach(tele => {
          model.teleIds[tele.teleId] = tele;
        });
      }
    },
    (tele) => {
      model.teleIds[tele.teleId] = tele;
    });

    return model;
  }

  /**
   * abstraction of firebase transaction
   * 
   * @param {string} ref ref for data
   * @param {string} fn function that takes in 
   * the value before operation and returns the value after
   */
  transaction(ref, fn) {
    this.fb.db.ref(ref).transaction(fn);
  }
}

/**
 * Person as abstraction over firebase user
 */
class Person {
  constructor() {
    this.uid = "";
    this.id = -1;
    this.username = "";
    this.description = "";
    this.teleId = "";
    this.teleUser = "";
    this.email = "";
    this.chats = {};
    return this;
  }


  /**
   * create person from firebase user object
   *  
   * @param {json} obj firebase user
   * @returns person
   */
  static fromJson(obj) {
    const person = new Person();
    const profile = obj.profile || {};

    person.uid = profile.uid;
    person.id = profile.id;
    person.description = profile.description;
    person.username = profile.username;
    person.teleId = profile.teleId;
    person.teleUser = profile.teleUser;
    person.email = profile.email;
    person.tags = obj.tags || {};
    person.chats = obj.chats;
    return person
  }
}

module.exports = {Model, Person}
