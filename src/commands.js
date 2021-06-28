const messages = require("./messages");

RegisterFailedHandler = async (ctx, uuid) => {
  ctx.reply(messages.RegisterFailedGeneralError(uuid))
}

MatchHandler = async (ctx) => {
    const re = /\/m(?:atch)? (\w+)/g
    const parsed = re.exec(ctx.message.text)
    if(!parsed) {
      return ctx.reply("pls enter valid code")
    }
    const match_id = parsed[1]
    await ctx.model.match(ctx.from.id, match_id)
    await ctx.reply("matched")
}

RegisterHandler = async (ctx) => {
    //If this telegram user has already registerd to a UUID
    if (ctx.person) {
      return ctx.reply(messages.AlreadyRegisteredError(ctx.person.name))
    }
    //TODO: add check for if UUID has been registered by another telegram user
    const re = /\/r(?:egister)? (\w+)/g
    const parsed = re.exec(ctx.message.text)
    if (!parsed) {
      return ctx.reply(messages.RegisterReminder)
    }
    const id = parsed[1]
    const success = await TryRegister(ctx, id)
    console.log("success");
    console.log(success);
    if (!success) {
      await RegisterFailedHandler(ctx, id);
    }
}

RegisterSuccessHandler = async (ctx) => {
    // const person = ctx.person
    //const match = ctx.model.getPersonByUuid(person.match)

    // await ctx.reply(messages.RegisterSuccess(person.name, ctx.chatTarget))
    await ctx.reply("success");

    //await ctx.reply(messages.ReferToBot(ctx.chatAs))
    //if (!ctx.isAngel) {
    //    await ctx.reply(messages.StatusHint)
    //}

    // if (match.isRegistered()) {
    //     await ctx.model.angelBot.telegram.sendMessage(mortal.telegramId, messages.RegisteredNotifier('angel'))
    // }
}

TryRegister = async (ctx, id) => {
  const model = ctx.model;
  const uuid = await model.getUUIDById(id);
  console.log(uuid)
  const person = await model.getPersonByUUID(uuid.uid)
  console.log(person)
  if (!person) {
    return false;
  }
  model.register(person, ctx.from.id, ctx.from.username)
  ctx.person = person

  await RegisterSuccessHandler(ctx)
  return true;
}

DeregisterHandler = async (ctx) => {
  if (!ctx.isRegistered) {
    return ctx.reply(messages.NotRegistered)
  }
  const model = ctx.model
  const telegramId = ctx.person.telegramId
  ctx.person.deregister()
  model.saveToStorage()
  await ctx.reply(messages.DeregisterSuccess)
  await ctx.otherBot.telegram.sendMessage(telegramId, messages.DeregisterSuccess)
}

MessageHandler = async (ctx) => {
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    await res.bot.telegram.sendMessage(res.target.teleId, ctx.message.text)
  } else {
    await ctx.reply(messages.UnregisteredTarget(ctx.chatTarget))
  }
}

StickerHandler = async (ctx) => {
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    await res.bot.telegram.sendSticker(res.target.teleId, ctx.message.sticker.file_id)
  } else {
    await ctx.reply(messages.UnregisteredTarget(ctx.chatTarget))
  }
}

PhotoHandler = async (ctx) => {
  const photos = ctx.message.photo
  const caption = ctx.message.caption || ""
  
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    const fileLink = await ctx.telegram.getFileLink(photos[0].file_id)
    await res.bot.telegram.sendPhoto(res.target.teleId, {url: fileLink}, {caption})
  } else {
    await ctx.reply("match hasn't registered")
        //messages.UnregisteredTarget(ctx.chatTarget))
  }
}

VideoHandler = async (ctx) => {
  const video = ctx.message.video
  const caption = ctx.message.caption || ""

  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    const fileLink = await ctx.telegram.getFileLink(video.file_id)
    await res.bot.telegram.sendVideo(res.target.teleId, {url: fileLink}, {caption})
  } else {
    await ctx.reply("match hasn't registered")
        //messages.UnregisteredTarget(ctx.chatTarget))
  }
}

VoiceHandler = async (ctx) => {
  const voice = ctx.message.voice
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    const fileLink = await ctx.telegram.getFileLink(voice.file_id)
    await res.bot.telegram.sendVoice(res.target.teleId, {url: fileLink})
  } else {
    await ctx.reply("match hasn't registered")
        //messages.UnregisteredTarget(ctx.chatTarget))
  }
}

VideoNoteHandler = async (ctx) => {
  const video = ctx.message.video_note
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const res = await ctx.model.getTargetAndBot(ctx.from.id, senderChat).catch(error => console.log(error));
  if (!res) return;
  if ("teleId" in res.target) {
    const fileLink = await ctx.telegram.getFileLink(video.file_id)
    await res.bot.telegram.sendVideoNote(res.target.teleId, {url: fileLink})
  } else {
    await ctx.reply("match hasn't registered")
        //messages.UnregisteredTarget(ctx.chatTarget))
  }
}

StatusHandler = async (ctx) => {
  if (!ctx.isRegistered) {
    return ctx.reply(messages.RegisterReminder)
  }
  const person = ctx.person
  const model = ctx.model
  const mortal = model.getPersonByUuid(person.mortal)
  let mortalName = mortal.name
  ctx.reply(messages.StatusMessage(person.name, mortalName))
}

HelpHandler = async (ctx) => {
  await ctx.replyWithMarkdown(messages.HelpMessage)
}

StartHandler = async (ctx) => {
  const name = ctx.isRegistered ? " " + ctx.person.name : ""
  const message = messages.BotWelcome(name, ctx.chatTarget)
  await ctx.reply(message)
  if (!ctx.isRegistered) {
    await ctx.reply(messages.RegisterReminder)
  }
}

EndHandler = async (ctx) => {
  // sender
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const senderUid = ctx.model.getUUIDByTeleId(ctx.from.id).uid;
  const senderPerson = ctx.model.getPersonByUUID(senderUid);
  // other
  const otherChat = 'chat' + senderPerson.chats[senderChat].matchBOT;
  const otherUid = senderPerson.chats[senderChat].activematchUUID;
  const otherPerson = ctx.model.getPersonByUUID(otherUid);

  ctx.model.fb.userChat(senderUid, senderChat).update({
    active: false,
    activematchUUID: '',
    matchBOT: 0,
    status: 'vacant',
  });
  ctx.model.fb.userChat(otherUid, otherChat).update({
    active: false,
    activematchUUID: '',
    matchBOT: 0,
    status: 'vacant',
  });
  ctx.model.bots[senderChat].telegram.sendMessage(senderPerson.teleId, 'Moot: Your conversation has ended');
  ctx.model.bots[otherChat].telegram.sendMessage(otherPerson.teleId, 'Moot: Your conversation has ended');
}

EndAndFriendHandler = async (ctx) => {
  // sender
  const senderChat = ctx.model.getBotName(ctx.tg.token);
  const senderUid = ctx.model.getUUIDByTeleId(ctx.from.id).uid;
  const senderPerson = ctx.model.getPersonByUUID(senderUid);
  // other
  const otherChat = 'chat' + senderPerson.chats[senderChat].matchBOT;
  const otherUid = senderPerson.chats[senderChat].activematchUUID;
  const otherPerson = ctx.model.getPersonByUUID(otherUid);
  const otherStatus = otherPerson.chats[otherChat].status;

  var replyMessage = 'Moot: Your conversation has ended.';

  if (otherStatus === 'end' || otherStatus === 'friend') {
    ctx.model.fb.userChat(senderUid, senderChat).update({
      active: false,
      activematchUUID: '',
      matchBOT: 0,
      status: 'vacant',
    });
    ctx.model.fb.userChat(otherUid, otherChat).update({
      active: false,
      activematchUUID: '',
      matchBOT: 0,
      status: 'vacant',
    });
    if (otherStatus === 'friend') {
      ctx.model.fb.userFriends(senderUid).push({ friendUid: otherUid, teleUser: otherPerson.teleUser , username: otherPerson.username });
      ctx.model.fb.userFriends(otherUid).push({ friendUid: senderUid, teleUser: senderPerson.teleUser , username: senderPerson.username });
      replyMessage += ' You\'ve made a new friend on moot - check out your new friend on the moot website!';
    }
    ctx.model.bots[senderChat].telegram.sendMessage(senderPerson.teleId, replyMessage);
    ctx.model.bots[otherChat].telegram.sendMessage(otherPerson.teleId, replyMessage);
  } else {
    ctx.model.fb.userChat(senderUid, senderChat).update({
      status: 'friend',
    });
  }
}

module.exports = {
  RegisterHandler,
  DeregisterHandler,
  TryRegister,
  MatchHandler,
  EndHandler,
  EndAndFriendHandler,
  RegisterSuccessHandler,
  RegisterFailedHandler,
  StatusHandler,
  MessageHandler,
  HelpHandler,
  StickerHandler,
  StartHandler,
  PhotoHandler,
  VideoHandler,
  VideoNoteHandler,
  VoiceHandler
}
