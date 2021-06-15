const {Firebase} = require("./firebase");

class Model {
    constructor(store) {
        this.fb = new Firebase();
    }

    getPersonByName(name) {
        const _name = name.toLowerCase()
        const filtered = this.people.filter(person => person.name.toLowerCase() === _name)
        return filtered.length > 0 ? filtered[0] : null
    }

    getPeople() {
        return this.people
    }

    static fromJson(obj) {

    }

    toJson() {
        return this.people.map(person => person.toJson())
    }

    dumpUuids() {
        return this.people.map(person => `${person.name},${person.uuid}`).join("\n")
    }

    hasPersonWithName(name) {
        for (const person of this.people) {
            if (name === person.name) {
                return true;
            }
        }
        return false;
    }

    setupListener(fn) {
        this.fb.users().on('value', (snapshot) => {
            const data = snapshot.val();
            console.log("Database update triggered:");
            console.log(data);
            fn(data);
            // updateStarCount(postElement, data);
        });
        return this;
    }

    register(person, teleId) {
        this.fb.userTeleId(teleId).set({
            id: person.id,
            uid: person.uid,
        });
        this.fb.userUUID(person.uid).update({
            teleId
        })
    }

    async match(teleId, matchCode) {
        const uuid_one = (await this.getUUIDByTeleId(teleId)).uid;
        const uuid_two = (await this.getUUIDById(matchCode)).uid;
        console.log(uuid_one);
        console.log(uuid_two)
        this.fb.userUUID(uuid_one).update({
            matchUUID: uuid_two,
        });
        this.fb.userUUID(uuid_two).update({
            matchUUID: uuid_one,
        })
    }

    async getUUIDByTeleId(teleId) {
        return this.fb.userTeleId(teleId).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    async getPersonByUUID(uuid) {
        return this.fb.userUUID(uuid).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
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

    static createModel() {
        const model = new Model();
        model.setupListener(a => a);
        return model;
    }

    // copyPeopleFrom(other) {
    //     for (const newPerson of other.people) {
    //         if (this.hasPersonWithName(newPerson.name)) {
    //             console.warn("Error: there is already a person " + name + " in the database.");
    //             continue;
    //         }
    //         newPerson.uuid = this.generateNewUuid();
    //         this.addPerson(newPerson);
    //     }
    // }
}

class Person {
    constructor() {
        this.uuid = ""
        this.name = ""
        this.username = ""
        this.telegramId = ""
        this.match = null;
        return this;
    }

    withName(name) {
        this.name = name;
        return this;
    }

    register(telegramId) {
        this.telegramId = telegramId;
    }

    deregister() {
        this.telegramId = ""
    }

    isRegistered() {
        return this.telegramId !== ""
    }

    toJson() {
        return {
            uuid: this.uuid,
            name: this.name,
            username: this.username,
            telegramId: this.telegramId,
            match: this.match || null,
        }
    }

    static fromJson(obj) {
        const person = new Person()
        person.uuid = obj.uuid
        person.name = obj.name
        person.username = obj.username
        person.telegramId = obj.telegramId
        person.match = obj.match

        return person
    }
}

module.exports = {Model, Person}
