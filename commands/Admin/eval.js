const { Command, Stopwatch, Type, util } = require("klasa");
const { inspect } = require("util");
const { post } = require("snekfetch");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: ["ev"],
            description: language => language.get("COMMAND_EVAL_DESCRIPTION"),
            extendedHelp: language => language.get("COMMAND_EVAL_EXTENDED"),
            guarded: true,
            permissionLevel: 10,
            usage: "<expression:str>"
        });
    }

    async run(msg, [code]) {
        const flagTime = "wait" in msg.flags ? Number(msg.flags.wait) : 30000;
        const { success, result, time, type } = await this.timedEval(msg, code, flagTime);

        if (msg.flags.silent) {
            if (!success && result && result.stack) this.client.emit("error", result.stack);
            return null;
        }

        const footer = util.codeBlock("ts", type);
        const sendAs = msg.flags.output || msg.flags["output-to"] || (msg.flags.log ? "log" : null);
        return this.handleMessage(msg, { sendAs, hastebinUnavailable: false, url: null }, { success, result, time, footer });
    }

    async handleMessage(msg, options, { success, result, time, footer }) {
        switch (options.sendAs) {
            case "file": {
                if (msg.channel.attachable) return msg.send(`**Type:**${footer}\n\n${time}`, { files: [{ attachment: Buffer.from(result), name: "output.txt" }] });
                await this.getTypeOutput(msg, options);
                return this.handleMessage(msg, options, { success, result, time, footer });
            }
            case "haste":
            case "hastebin": {
                if (!options.url) options.url = await this.getHaste(result).catch(() => null);
                if (options.url) return msg.sendMessage(`**Output:**\n${options.url}\n\n**Type:**${footer}\n${time}`);
                options.hastebinUnavailable = true;
                await this.getTypeOutput(msg, options);
                return this.handleMessage(msg, options, { success, result, time, footer });
            }
            case "console":
            case "log": {
                this.client.emit("log", result);
                return msg.sendMessage(`${footer}\n${time}`);
            }
            case "none":
                return null;
            default: {
                if (result.length > 2000) {
                    await this.getTypeOutput(msg, options);
                    return this.handleMessage(msg, options, { success, result, time, footer });
                }
                return msg.sendMessage(msg.language.get(success ? "COMMAND_EVAL_OUTPUT" : "COMMAND_EVAL_ERROR",
                    time, util.codeBlock("js", result), footer));
            }
        }
    }

    async getTypeOutput(msg, options) {
        const _options = ["log"];
        if (msg.channel.attachable) _options.push("file");
        if (!options.hastebinUnavailable) _options.push("hastebin");
        let _choice;
        do {
            _choice = await msg.prompt(`Choose one of the following options: ${_options.join(", ")}`).catch(() => ({ content: "none" }));
        } while (!["file", "haste", "hastebin", "console", "log", "default", "none", null].includes(_choice.content));
        options.sendAs = _choice.content;
    }

    timedEval(msg, code, flagTime) {
        return Promise.race([
            util.sleep(flagTime).then(() => ({
                success: false,
                result: msg.language.get("COMMAND_EVAL_TIMEOUT", flagTime / 1000),
                time: "⏱ ...",
                type: "EvalTimeoutError"
            })),
            this.eval(msg, code)
        ]);
    }

    // Eval the input
    async eval(msg, code) {
        const stopwatch = new Stopwatch();
        let success, syncTime, asyncTime, result;
        let thenable = false;
        let type;
        try {
            if (msg.flags.async) code = `(async () => {\n${code}\n})();`;
            result = eval(code);
            syncTime = stopwatch.toString();
            type = new Type(result);
            if (util.isThenable(result)) {
                thenable = true;
                stopwatch.restart();
                result = await result;
                asyncTime = stopwatch.toString();
            }
            success = true;
        } catch (error) {
            if (!syncTime) syncTime = stopwatch.toString();
            if (thenable && !asyncTime) asyncTime = stopwatch.toString();
            if (!type) type = new Type(error);
            result = error;
            success = false;
        }

        stopwatch.stop();
        if (typeof result !== "string") {
            result = result instanceof Error ? result.stack : inspect(result, {
                depth: msg.flags.depth ? parseInt(msg.flags.depth) || 0 : 0,
                showHidden: Boolean(msg.flags.showHidden)
            });
        }
        return { success, type, time: this.formatTime(syncTime, asyncTime), result: util.clean(result) };
    }

    formatTime(syncTime, asyncTime) {
        return asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`;
    }

    async getHaste(result) {
        const { body } = await post("https://hastebin.com/documents").send(result).catch(e => {
            Error.captureStackTrace(e);
            return e;
        });
        return `https://hastebin.com/${body.key}.js`;
    }

};