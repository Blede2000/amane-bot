import { lyricsExtractor, LyricsData  } from "@discord-player/extractor";
import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands";
import { useQueue } from "discord-player";
import { EmbedBuilder, Message } from 'discord.js';


@ApplyOptions<Command.Options>({
	aliases: ['l', 'lyrics', 'letra'],
	description: 'The lyrics of the current song',
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

        if(!queue || !queue.currentTrack){
            interaction.reply({ 
                content: `I am **not** in a voice channel or there are no current tracks playing`, 
                ephemeral: true 
            })
            return;
        }

        const lyricsFinder = lyricsExtractor();
        const lyrics = await lyricsFinder.search(queue.currentTrack.toString()).catch(() => null);

        if(!lyrics){
            return interaction.followUp({ content: 'No lyrics found', ephemeral: true });
        }

        return interaction.reply({
            content: '',
            embeds: [ this.getEmbed(lyrics) ],
        })
    }

    public async messageRun(message: Message) {
        const queue = useQueue(message.guild!.id);

        if(!queue || !queue.currentTrack){
            return send(message, { 
                content: `I am **not** in a voice channel`, 
            })
        }

        const lyricsFinder = lyricsExtractor();
        const lyrics = await lyricsFinder.search(queue.currentTrack.toString()).catch(() => null);

        if(!lyrics){
            return send(message, {
                content: "No lyrics found"
            });
        }
        
        return send(message, {
            embeds: [this.getEmbed(lyrics)],
        });
    }

    private getEmbed(lyrics: LyricsData){
        return new EmbedBuilder()
                    .setTitle(lyrics.title)
                    .setURL(lyrics.url)
                    .setThumbnail(lyrics.thumbnail)
                    .setAuthor({
                        name: lyrics.artist.name,
                        iconURL: lyrics.artist.image,
                        url: lyrics.artist.url
                    })
                    .setDescription(lyrics.lyrics.substring(0, 1997))
                    .setColor(15007566);
    }
}