# compendium-client


# Compendium class
test/comp.ts demonstrates this higher level functionality

### Events
Events may help wire the bot data into a store

event: `connected`
payload: `Identity`
User succesfully connected/reconnected

event: `connectfailed`
payload: error string
Re-establishing a previous connection failed.

event: `disconnected`
User has logged out or otherwise disconnected

event: `sync`
payload: `TechLevels`
fires when user data is updated or synced with the bot
