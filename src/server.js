const Commands = require("./commands");
const {Model} = require("./model");
const Middleware = require("./middleware");
const {Telegraf} = require('telegraf');
require('dotenv').config();

async function start(model) {
    const mootBot = new Telegraf(process.env.BOT_TOKEN);
    model.bot = mootBot;

    mootBot._name = "mootBot";
    const bots = [mootBot];
    bots.forEach(bot => {
        bot.use(Middleware.WithModel(model), Middleware.ErrorHandler, Middleware.CodeFilter);
        bot.start(Commands.StartHandler);
        bot.help(Commands.HelpHandler);
        bot.command(['register', 'r'], Commands.RegisterHandler);
        bot.command(['match', 'm'], Commands.MatchHandler);
        // bot.use(Middleware.RequireRegister);
        bot.command(['deregister', 'd'], Commands.DeregisterHandler);
        bot.on('sticker', Commands.StickerHandler);
        bot.on('photo', Commands.PhotoHandler);
        bot.on('video', Commands.VideoHandler);
        bot.on('voice', Commands.VoiceHandler);
        bot.on('video_note', Commands.VideoNoteHandler);
        bot.on('message', Commands.MessageHandler);
        //TODO: handle sending files
        bot.launch().then(() => console.log(bot._name + " started")).catch(console.error);
    })
}

module.exports = {start};
