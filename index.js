const server = require("./src/server");
const {Model} = require("./src/model");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

function setupCLI() {

}

async function main() {
    const model = Model.createModel();
    // model.getUUIDById(uuid => {
    //     console.log(uuid);
    //     model.getPersonByUUID(person => {
    //         console.log(person);
    //     }, uuid.uid);
    // }, 758913360);
    server.start(model);

    // readline.on('line', InputHandler(model));

    // console.log(model.dumpUuids())
}

main()
