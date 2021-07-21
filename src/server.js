const Commands = require("./commands");
const {Model} = require("./model");
const Middleware = require("./middleware");
const {Telegraf} = require('telegraf');
require('dotenv').config();

async function start(model) {
    const apiMain = process.env.BOT_TOKEN;
    const api1 = process.env.CHATBOT1_TOKEN;
    const api2 = process.env.CHATBOT2_TOKEN;
    const api3 = process.env.CHATBOT3_TOKEN;
    const api4 = process.env.CHATBOT4_TOKEN;
    const api5  = process.env.CHATBOT5_TOKEN;

    const mootBot = new Telegraf(apiMain);
    const chat1Bot = new Telegraf(api1);
    const chat2Bot = new Telegraf(api2);
    const chat3Bot = new Telegraf(api3);
    const chat4Bot = new Telegraf(api4);
    const chat5Bot = new Telegraf(api5);

    mootBot._name = "mootBot";
    chat1Bot._name = "chat1Bot"
    chat2Bot._name = "chat2Bot";
    chat3Bot._name = "chat3Bot";
    chat4Bot._name = "chat4Bot";
    chat5Bot._name = "chat5Bot";

    model.bots = {
      main: mootBot,
      chat1: chat1Bot,
      chat2: chat2Bot,
      chat3: chat3Bot,
      chat4: chat4Bot,
      chat5: chat5Bot,
    };

    model.botIds = [
      { key: apiMain, value: "main" },
      { key: api1, value: "chat1" },
      { key: api2, value: "chat2" },
      { key: api3, value: "chat3" },
      { key: api4, value: "chat4" },
      { key: api5, value: "chat5" }
    ];

    const bots = [mootBot, chat1Bot, chat2Bot, chat3Bot, chat4Bot, chat5Bot];
    bots.forEach(bot => {
        bot.use(Middleware.WithModel(model), Middleware.ErrorHandler, Middleware.CodeFilter);
        bot.start(Commands.StartHandler);
        bot.help(Commands.StartHandler);
        bot.command(['register', 'r'], Commands.RegisterHandler);
        // bot.use(Middleware.RequireRegister);
        bot.command(['deregister', 'd'], Commands.DeregisterHandler);
        if (bot._name != "mootBot"){
          bot.command(['end'], Commands.EndHandler);
          bot.command(['friend'], Commands.EndAndFriendHandler);
          bot.command(['matchinfo'], Commands.MatchInfoHandler);
          bot.command(['quickmatch'], Commands.QuickMatchHandler);
          bot.on('sticker', Commands.StickerHandler);
          bot.on('photo', Commands.PhotoHandler);
          bot.on('video', Commands.VideoHandler);
          bot.on('voice', Commands.VoiceHandler);
          bot.on('video_note', Commands.VideoNoteHandler);
          bot.on('message', Commands.MessageHandler);
          //TODO: handle sending files
        } else {
          bot.command(['chats'], Commands.ChatsHandler);
        }
        bot.launch().then(() => console.log(bot._name + " started")).catch(console.error);
    })
}

module.exports = {start};
