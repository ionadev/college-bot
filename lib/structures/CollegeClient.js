const { Client } = require("klasa");
const RawEventStore = require("./RawEventStore");
//const defaultGuildSchema = require(`./schemas/defaultGuildSchema`);
const defaultClientSchema = require(`./schemas/defaultClientSchema`);
//const defaultUserSchema = require(`./schemas/defaultUserSchema`);

class CollegeClient extends Client {

    constructor(options) {
        super({ ...options, defaultClientSchema });

        //Ran commands
        this.health = Object.seal({
            commands: {
                temp: {
                    count: 0,
                    ran: {}
                },
                cmdCount: new Array(60).fill({
                    count: 0,
                    ran: {}
                })
            }
        });
            //Register Raw Events
        this.rawEvents = new RawEventStore(this);
        this.registerStore(this.rawEvents);
    }

}

module.exports = CollegeClient;