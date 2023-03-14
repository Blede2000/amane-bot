import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
import { Command } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands";
import { GuildQueue, useQueue, Track } from "discord-player";
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	aliases: ['q', 'queue'],
	description: 'What is the current queue',
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

        if(!queue || !queue.currentTrack || queue.tracks.toArray().length == 0){
            interaction.reply({ 
                content: `I am **not** in a voice channel or there are no current tracks playing or there's nothing on the queue`, 
                ephemeral: true 
            })
            return;
        }

        return this.getEmbed(interaction, queue)
    }

    public async messageRun(message: Message) {
        const queue = useQueue(message.guild!.id);

        if(!queue || !queue.currentTrack || queue.tracks.toArray().length == 0){
            return send(message, { 
                content: `I am **not** in a voice channel or there are no current tracks playing or there's nothing on the queue`, 
            })
        }
        
        return this.getEmbed(message, queue)
    }

    private getEmbed(interactionOrMessage: Command.ChatInputCommandInteraction | Message, queue: GuildQueue){
        const paginatedMessage = new PaginatedMessage();

        const trackPages = this.chunkPlaylist(queue.tracks.toArray());

        trackPages.forEach(tracks => {
            const songs = tracks.map((track) => {
                return `${queue.tracks.toArray().indexOf(track) + 1}) [${track.toString()}](${
                    track.url
                }) \n`;
            });
            paginatedMessage.addPageEmbed((embed) => {
                return embed
                    .setTitle("Queue")
                    .setAuthor({ name: `${queue.size} songs` })
                    .setColor(15007566)
                    .setDescription(songs.join(""))
            })
        })

        return paginatedMessage.run(interactionOrMessage);
    }

    private chunkPlaylist(tracks: Track[]) {
        const chunkCount = 10;
        
        return Array.from(new Array(Math.ceil(tracks.length / chunkCount)), (_, i) => tracks.slice(i * chunkCount, i * chunkCount + chunkCount));
    }
}