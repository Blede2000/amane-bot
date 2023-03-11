import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands";
import { GuildQueue, useQueue } from "discord-player";
import { EmbedBuilder, Message } from 'discord.js';


@ApplyOptions<Command.Options>({
	aliases: ['v', 'volume'],
	description: 'Get or set the volume',
})
export class PauseCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
        registry.registerChatInputCommand((builder) =>
        builder //
          .setName(this.name)
          .setDescription(this.description)
          .addNumberOption((option) => {
            return option.setName('volume').setDescription('Set the volume to').setRequired(false);
          })
      );
	}

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guild!.id);

        if(!queue){
            interaction.reply({ 
                content: `I am **not** in a voice channel`, 
                ephemeral: true 
            })
            return;
        }
        const volume = interaction.options.getNumber('volume');


        if(volume == null){
            interaction.reply({
                content: '',
                embeds: [ this.getEmbed(false, queue) ],
            })
            return;
        }

        queue.node.setVolume(volume);
        interaction.reply({
            content: '',
            embeds: [ this.getEmbed(true, queue) ],
        })
    }

    public async messageRun(message: Message, args: Args) {
        const queue = useQueue(message.guild!.id);

        if(!queue || !queue.currentTrack){
            return send(message, { 
                content: `I am **not** in a voice channel`, 
            })
        }

        const volume = await args.pick("number").catch(( )=> '')
        if(volume == ''){
            return send(message, {
                embeds: [this.getEmbed(false, queue)],
            });
        }

        queue.node.setVolume(volume as number);
        return send(message, {
            embeds: [this.getEmbed(true, queue)],
        });
    }

    private getEmbed(isSet: boolean, queue: GuildQueue){
        
        return new EmbedBuilder()
                    .setTitle(`${isSet ? 'The volume is ' : 'The volume was set to'} ${queue.node.volume}`)
                    .setColor(15007566);
    }
}