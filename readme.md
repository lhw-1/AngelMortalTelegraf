This bot allows users to message the bot as if they were messaging the other person. The bot is able to forward stickers and media.  
The bot uses local storage (node-persist), hence it will not work on an ephemeral file system such as heroku.  

# for admins
Each participant is given a `name` (need not be related to real name nor telegram id), and automatically generated `uuid`. Details such as telegram ID will be automatically captured. angel/mortal pairings are captured when registering. Each person can have up to one angel and up to one mortal.
## Set up
Create two telegram bots through botfather
Put the prefix and bot tokens into a `.env` file in the root directory with the format
```
PREFIX=mmvp
ANGEL_BOT_TOKEN=
MORTAL_BOT_TOKEN=
```

Create a txt file in the root directory, containing pairs in the format `<person1>, <person2>`  
Names will automatically be captured. A unique ID will be generated for each name.  
For example, if the following file is loaded
```
a, b
b, c
c, a
```
Three new persons representing a/b/c will be created. IDs will be shown for each, for example
```
a - 123456789
b - 234678590
c - 098234752
```

# for users
## to start
Start both bots. Then, message either one bot (not both) with `/r <ID>` to register. You should now be able to message both your angel and mortal.
