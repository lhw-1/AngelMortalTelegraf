<p align="center">
  <img src="https://lh3.googleusercontent.com/keep-bbsk/AGk0z-MsssfEwTPHJ-o1m-EWVFqpM-QGrWSZh2cMyVvtG-XIG7TYjoIxr1AIU1GmSYZBDoOfdhjsDpz2SPbvG5n1qsJSsC4x1xqPYumStjs=s445" />
</p>

# Moot Telegram

Moot telegram is a cog in the moot architecture that allows for rich interaction between users with a bot intermediary. Moot users have 5 bots each and a main bot for general administration and notification. Moot telegram syncs data with the moot firebase realtime database, and routes messages between user chats as defined in user data. 

## Set up

1. Install a stable version of NodeJS. The active LTS or current version should work fine.
2. Clone this repository and navigate to it using "cd" in your command line or shell tool.
3. Run `yarn install` to install dependencies.
4. Run `node index.js` to start the server. You can test that it is working by sending the bot a message

## Environment Set-up

```
PREFIX=moot
BOT_TOKEN=
CHATBOT1_TOKEN=
CHATBOT2_TOKEN=
CHATBOT3_TOKEN=
CHATBOT4_TOKEN=
CHATBOT5_TOKEN=
REACT_APP_API_KEY=
REACT_APP_AUTH_DOMAIN=
REACT_APP_DATABASE_URL=
REACT_APP_PROJECT_ID=
REACT_APP_STORAGE_BUCKET=
REACT_APP_MESSAGING_SENDER_ID=
REACT_APP_APP_ID=
REACT_APP_MEASUREMENT_ID=
```
- Bot tokens can be created using the BotFather telegram bot
- Variables starting with REACT_APP are firebase related 
(REACT_APP should be removed at some point)

## Testing

Testing can be done as follows:
- Set up a moot match
- In chat, run the /test command
- Follow bot instructions and check that tests pass
