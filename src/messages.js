require('dotenv').config();
const prefix = process.env.PREFIX || "anm";

const botChatText = (chats) => {
  var reply = "Bot Chats:\n";
  const activeText = active => active ? "Active" : "Free";
  const chatObjs = chats ? Object.values(chats) : {};

  for (let i = 0; i < 5; i++) {
    reply += `[Chat${i+1}](https://t.me/moot_chat${i+1}_bot)`;
    if (chats) {
      reply += ` \\=\\> Status: ${activeText(chatObjs[i].active)}`;         
    } 
    reply += "\n";
  }
  return reply;
}

module.exports = {
    RegisterReminder: 'You have yet to register your moot account. To register, please enter `/r <code>` where code is your 9 digit code',
    NoGroupChats: "Please don't add me to groups! Byeeee 👋",
    BotWelcome: (name, chatTarget) => `Welcome to moot${name}! You should start the other moot chats in preparation for a match:`,
    ReferToBot: (chatAs) => `Please go to the ${chatAs}-bot at @${prefix}_${chatAs.toLowerCase()}_bot to start chatting with your ${chatAs} as well. You do not need to register again.`,
    // RegisterWelcome: "Paste the 9 digit code sent to you here to register",
    UnregisteredTarget: (chatTarget) => `It seems that your match hasn't registered with the bot on Telegram, we can't deliver your message to them. Don't worry, we'll let you know as soon as they have registered!`,
    DeregisterSuccess: "Successfully deregistered",
    RegisterSuccess: (name, chatTarget) => `Yay! You have successfully registered as ${name}! Have fun chatting with your match`,
    StatusHint: "Type /mortal to see who your mortal is!",
    StatusMessage: (name, mortalName) => `Hi ${name}! Have fun chatting with yout match!`,
    AlreadyRegisteredError: (name) => `Already registered as ${name}`,
    RegisterFailedGeneralError: (code) => `Failed to register with code ${code}`,
    HelpMessage: "This bot allows you to communicate with your match anonymously.\nRegister with the code given to you by typing\n`/r <code>`\n. When you have a new chat, you'll be notified here \nYou should ",
    RegisteredNotifier: `Your match has registered with the bot on Telegram. Happy chatting!`,
    NotRegistered: "Not registered",
    MainBotNewChat: (i) => `You have a new match on @moot_chat${i}_bot. Go say hi!`,
    MainBotChats: (chats) => botChatText(chats),
    ChatBotNewChat: "Moot: You\'ve been matched with a new user! Use the /end command to end the conversation immediately or /friend to add them as a friend. If you both add friend, we\'ll add them as your friend on moot!",
};
