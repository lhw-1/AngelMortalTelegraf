const {Firebase} = require("./firebase");
const { MainBotNewChat, ChatBotNewChat } = require("./messages");

class Model {
  constructor(store) {
    this.fb = new Firebase();
    this.people = {};
    this.teleIds = {};
    this.bots = {};
    this.botIds = [];
  }

  getPersonByName(name) {
    const _name = name.toLowerCase();
    const filtered = this.people.filter(person => person.name.toLowerCase() === _name);
    return filtered.length > 0 ? filtered[0] : null;
  }

  getPeople() {
    return this.people;
  }

  toJson() {
    return this.people.map(person => person.toJson());
  }

  dumpUuids() {
    return this.people.map(person => `${person.name},${person.uuid}`).join("\n");
  }

  hasPersonWithName(name) {
    for (const person of this.people) {
      if (name === person.name) {
        return true;
      }
    }
    return false;
  }


  // types = 'value', 'child_changed'
  setupListener(handle, ref, type) {
    ref.on(type, (snapshot) => {
      const data = snapshot.val();
      console.log(`Database update triggered (${type}):`);
      console.log(data);
      handle(data);
    });
    return this;
  }

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

  getBotName(apiKey) {
    return this.botIds[this.botIds.findIndex(elem => elem.key === apiKey)].value;
  }

  async match(teleId, matchCode) {
    const uuid_one = (await this.getUUIDByTeleId(teleId)).uid;
    const uuid_two = (await this.getUUIDById(matchCode)).uid;
    this.fb.userUUID(uuid_one).update({
        matchUUID: uuid_two,
    });
    this.fb.userUUID(uuid_two).update({
        matchUUID: uuid_one,
    });
  }

  // chat: chat1, chat2, etc
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

  getUUIDByTeleId(teleId) {
    return this.teleIds[teleId];
  }

  getPersonByUUID(uuid) {
    return this.people[uuid];
  }

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

  loadAndListen(ref, handleLoad, handleListen) {
    ref.once('value').then((snapshot) => {
      handleLoad(snapshot.val());
    }).catch((error) => {
      console.error(error);
    });
    this.setupListener(handleListen, ref, "child_changed");
    this.setupListener(handleListen, ref, "child_added");
  }

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

  transaction(ref, fn) {
    this.fb.db.ref(ref).transaction(fn);
  }
}

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
