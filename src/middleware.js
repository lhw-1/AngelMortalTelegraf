const util = require("./util");
const messages = require("./messages");
const {TryRegister, RegisterSuccessHandler, RegisterFailedHandler} = require("./commands");
const {Person} = require('./model');
const {Telegraf} = require('telegraf');


CodeFilter = Telegraf.hears(/^\d{9}$/m, async (ctx) => {
    if (ctx.isRegistered) {
        return await ctx.reply(messages.RegisterSuccess(ctx.person.name, ctx.chatTarget))
    }
    const success = await TryRegister(ctx, ctx.message.text)
    if (!success) {
        await RegisterFailedHandler(ctx, ctx.message.text);
    }
})

UpdateTeleUser = async (ctx, next) => {
  const senderUid = (ctx.model.getUUIDByTeleId(ctx.from.id) || {}).uid;
  const senderTeleUser = ctx.from.username;
  await ctx.model.updateTeleUser(senderUid, senderTeleUser);
  await next();
}

WithModel = (model) => async (ctx, next) => {
    ctx.model = model
    await next()
}

UserId = async (ctx, next) => {
    const telegramId = ctx.from.id;
    const model = ctx.model;
    const person = model.getPersonByHandle(telegramId)
    console.log("userId")
    console.log(person)
    if (person !== null) {
        ctx.person = person
        ctx.isRegistered = true
    }
    await next();
}

RequireRegister = async (ctx, next) => {
    const telegramId = ctx.from.id;
    const model = ctx.model;
    const person = model.getPersonById(telegramId)
    if (person !== null) {
        ctx.person = person
        ctx.angel = model.getPersonByUuid(person.match)
        ctx.name = person.username
        await next();
    } else {
        let success = false;
        let isCommand = false;
        if (util.isText(ctx)) {
            success = await TryRegister(ctx, ctx.message.text)
            isCommand = ctx.message.text.startsWith("/")
        }
        if (!success && !isCommand)
            return ctx.reply(messages.RegisterReminder);
        await next()
    }
}

OnlyPrivate = async (ctx, next) => {
    let chat = ctx.chat;
    if (chat.type !== 'private') {
        try {
            await ctx.reply(messages.NoGroupChats)
            await ctx.leaveChat(chat.id)
        } catch (e) {
        }
        return
    }
    await next()
}

ErrorHandler = async (ctx, next) => {
    try {
        await next()
    } catch (e) {
        Telegraf.log(console.error)(ctx, ()=>console.error(e))
    }
}

Settings = (bots) => async(ctx, next) => {
    ctx.bot = bots.bot
    ctx.bot1 = bots.bot1
    ctx.bot2 = bots.bot2
    ctx.bot3 = bots.bot3
    ctx.bot4 = bots.bot4
    ctx.bot5 = bots.bot5
    await next()
}

module.exports = {UserId, OnlyPrivate, ErrorHandler, WithModel, Settings, CodeFilter, UpdateTeleUser}
