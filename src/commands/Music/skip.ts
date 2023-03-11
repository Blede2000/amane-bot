import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands";
import { GuildQueue, useQueue } from "discord-player";
import { EmbedBuilder, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	aliases: ['s', 'skip'],
	description: 'What is currently playing',
})
export class SkipCommand extends Command {
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
        
        const didSkip = queue.node.skip();
        interaction.reply({
            content: '',
            embeds: [ this.getEmbed(didSkip, queue) ],
        })
    }

    public async messageRun(message: Message) {
        const queue = useQueue(message.guild!.id);

        if(!queue || !queue.currentTrack){
            return send(message, { 
                content: `I am **not** in a voice channel`, 
            })
        }
        const didSkip = queue.node.skip();

        return send(message, {
            content: "",
            embeds: [this.getEmbed(didSkip, queue)],
        });
    }

    private getEmbed(didSkip:boolean, queue: GuildQueue){
        if(didSkip == false){
            return new EmbedBuilder().setTitle('No songs to skip');
        }

        const track = queue.tracks.at(0);
        
        if(!track){
            return new EmbedBuilder().setTitle('No songs to skip');
        }

        return new EmbedBuilder()
                    .setTitle(track.toString())
                    .setURL(track.raw.url)
                    .setAuthor({ name: "Song skipped" })
                    .setColor(15007566)
                    .setThumbnail(track.thumbnail);
    }
}