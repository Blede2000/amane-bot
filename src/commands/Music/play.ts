import { ApplyOptions } from '@sapphire/decorators';
import { isStageChannel, isTextChannel, PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Args, Command } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import {  useMasterPlayer, Track, Playlist } from 'discord-player';
import { EmbedBuilder, GuildMember, Message } from 'discord.js';
import { s } from '@sapphire/shapeshift';

@ApplyOptions<Command.Options>({
	aliases: ['p'],
	description: 'Play a song, any song',
})
export class PlayCommand extends Command {

    public override registerApplicationCommands(registry: Command.Registry) {
		// Register slash command
        registry.registerChatInputCommand((builder) =>
        builder //
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) => {
            return option.setName('query').setDescription('A query of your choice').setRequired(true).setAutocomplete(true);
          })
      );
	}

    public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
		const player = useMasterPlayer();
		const query = interaction.options.getString('query');
		const results = await player!.search(query!);
		const url = s.string.url();

		try {
			url.parse(query);
			return interaction;
		} catch (error) {
			return interaction.respond(
				results.tracks.slice(0, 5).map((t) => ({
					name: t.title,
					value: t.url
				}))
			);
		}
	}

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const player = useMasterPlayer();
		const member = interaction.member as GuildMember;
		const query = interaction.options.getString('query');
		const results = await player!.search(query!);

		if (!results.hasTracks())
			return interaction.reply({
				content: `**No** tracks were found for your query`,
				ephemeral: true
			});

		await interaction.deferReply();

		try {
			const {track, searchResult} = await player!.play(member.voice.channel!.id, results, {
                nodeOptions: {
                    leaveOnEnd: false,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000
                }
            });

            if(searchResult.hasTracks() && searchResult.hasPlaylist()){
                return this.getPlaylistEmbed(interaction, searchResult.playlist!);
            }

            if(searchResult.hasTracks()){
                await interaction.editReply({
                    content: '',
                    embeds: [this.getSongEmbed(member, track)],
                })
                return;
            }
		} catch (error: any) {
			await interaction.editReply({ content: `An **error** has occurred` });
			return console.log(error);
		}
	}

    	// Message command
	public async messageRun(message: Message, args: Args) {
        await send(message, 'Searching song...');

        if (!isTextChannel(message.channel) || isStageChannel(message.channel)) {
			return;
		  }
        const player = useMasterPlayer();


        const text = await args.rest('string').catch(() => '');
        const member = message.member as GuildMember;

        if(text == ''){
            return send(message, {
                content: 'No arguments',
            });
        }

        const { track, searchResult } = await player!.play(member.voice.channel!, text, {
            nodeOptions: {
                leaveOnEnd: false,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000
            }
        });

        try {
            if(searchResult.hasTracks() && searchResult.hasPlaylist()){
                return this.getPlaylistEmbed(message, searchResult.playlist!);
            }

            if(searchResult.hasTracks()){
                return send(message, {
                    content: '',
                    embeds: [ this.getSongEmbed(member, track)
                    ]
                });
            }
        } catch (error: any) {
            await send(message, { content: `An **error** has occurred` });
            return console.log(error);
        }
	}

    private getSongEmbed(member: GuildMember, track: Track) {
        return new EmbedBuilder()
                .setTitle(track.title)
                .setURL(track.url)
                .setAuthor({ name: track.author })
                .setColor(15007566)
                .setDescription(`**Duration** ${track.duration}`)
                .setFooter({
                    text: `Requested by ${member?.user.username}`,
                    iconURL: member?.user.avatarURL()!,
                })
                .setThumbnail(track.thumbnail)
    }
    
    private getPlaylistEmbed(interactionOrMessage: Command.ChatInputCommandInteraction | Message, playlist: Playlist) {
        const member = interactionOrMessage.member as GuildMember;
        const paginatedMessage = new PaginatedMessage();
        const trackPages = this.chunkPlaylist(playlist);

        trackPages.forEach(tracks => {
            const songs = tracks.map((track) => {
                return `${playlist.tracks.indexOf(track) + 1}) [${track.title}](${
                    track.url
                }) \n`;
            });
            paginatedMessage.addPageEmbed((embed) => {
                return embed
                    .setTitle(playlist.title)
                    .setURL(playlist.url)
                    .setAuthor({ name: playlist.author.name })
                    .setColor(15007566)

                    .setDescription(songs.join(""))
                    .setFooter({
                        text: `Requested by ${member.user.username}`,
                        iconURL: member.user.avatarURL()!,
                    })
            })
        })

        return paginatedMessage.run(interactionOrMessage);
    }
    
    private chunkPlaylist(playlist: Playlist) {
        const chunkCount = 10;
        
        return Array.from(new Array(Math.ceil(playlist.tracks.length / chunkCount)), (_, i) => playlist.tracks.slice(i * chunkCount, i * chunkCount + chunkCount));
    }
}