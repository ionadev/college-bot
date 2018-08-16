const { Client } = require('klasa');
const { token } = process.env;
new Client({
    fetchAllMembers: false,
    prefix: 't.',
    commandEditing: true,
    typing: true,
    readyMessage: (client) => `Successfully initialized. Ready to serve ${client.guilds.size} guilds.`
}).login(token);
