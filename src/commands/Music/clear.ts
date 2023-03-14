import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { useQueue } from 'discord-player';
import { EmbedBuilder, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	aliases: ['clear', 'clr'],
	description: 'Clear the queue'
})
export class PauseCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const queue = useQueue(interaction.guild!.id);

		if (!queue || !queue.currentTrack) {
			interaction.reply({
				content: `I am **not** in a voice channel or there are no current tracks playing`,
				ephemeral: true
			});
			return;
		}

		queue.clear();
		interaction.reply({
			content: '',
			embeds: [this.getEmbed()]
		});
	}

	public async messageRun(message: Message) {
		const queue = useQueue(message.guild!.id);

		if (!queue || !queue.currentTrack) {
			return send(message, {
				content: `I am **not** in a voice channel`
			});
		}

		queue.clear();
		return send(message, {
			embeds: [this.getEmbed()]
		});
	}

	private getEmbed() {
		return new EmbedBuilder().setTitle(`Queue has been cleared`).setColor(15007566);
	}
}
