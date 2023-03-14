import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildQueue, useQueue } from 'discord-player';
import { EmbedBuilder, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	aliases: ['nowplaying', 'np'],
	description: 'What is currently playing'
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

		interaction.reply({
			content: '',
			embeds: [this.getEmbed(queue)]
		});
	}

	public async messageRun(message: Message) {
		const queue = useQueue(message.guild!.id);

		if (!queue || !queue.currentTrack) {
			return send(message, {
				content: `I am **not** in a voice channel or there are no current tracks playing`
			});
		}

		return send(message, {
			embeds: [this.getEmbed(queue)]
		});
	}

	private getEmbed(queue: GuildQueue) {
		const track = queue.currentTrack!;

		return new EmbedBuilder()
			.setTitle(track.title)
			.setURL(track.url)
			.setAuthor({ name: track.author })
			.setColor(15007566)
			.setDescription(queue.node.createProgressBar())
			.setThumbnail(track.thumbnail);
	}
}
