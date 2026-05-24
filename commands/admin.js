const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('admin').setDescription('Painel admin'),
  async execute(interaction, context) {
    const { env, COR } = context;

    if (interaction.user.id !== env.ADMIN_ID) {
      return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
    }

    const embed = new EmbedBuilder().setColor(COR).setTitle('🛠️ Painel ADM').setDescription('Gerencie os jogadores.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('buscar_user').setLabel('Buscar Jogador').setEmoji('🔎').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin_evento_inscritos').setLabel('Inscritos no Evento').setEmoji('🏆').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: '✅ Painel ADM enviado.', ephemeral: true });
    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
