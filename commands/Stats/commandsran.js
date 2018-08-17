const { Command, Duration } = require('klasa');
const { MessageAttachment } = require('discord.js');

const { HighChartsConstructor } = require('chart-constructor');

const now = new Date();
const plotOptions = {
	series: {
		pointStart: now.setHours(now.getHours() - 1),
		pointInterval: 60 * 1000
	}
};

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			guarded: true,
			description: (msg) => msg.language.get('COMMAND_STATS_DESCRIPTION'),
			extendedHelp: [
				'Flags:',
				'',
				'--commands: Shows command statistics.',
				'--memory: Shows memory statisitcs.'
			].join('\n')
		});
	}

	async run(msg) {

 
			const chart = await new HighChartsConstructor()
				.plotOptionsOptions(plotOptions)
				.seriesDataSetter([
					{
						type: 'line',
						color: '#3498DB',
						data: this.client.settings.counter.total,
						name: 'Commands Ran (Used)'
					}
				])
				.titleOptions({ text: 'Chart' })
				.toBuffer();
			let embed = new MessageEmbed()
				.attachFiles([new MessageAttachment(chart, 'chart.png')])
				.setImage('attachment://chart.png');
		

		return msg.sendEmbed(embed);
	}

};
