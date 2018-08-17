const CollegeClient = require('./lib/structures/CollegeClient');
require('dotenv').config();
const { token } = process.env;


new CollegeClient({
    fetchAllMembers: false,
    prefix: '.',
    commandEditing: true,
    typing: true,
    readyMessage: (client) => `Successfully initialized. Ready to serve ${client.guilds.size} guilds.`
}).login(token);
