const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('perfil').setDescription('Painel de ranking e perfil'),
  async execute(interaction, context) {
    const { COR_ATLAS_VERIFY } = context;

    const embed = new EmbedBuilder()
      .setColor(COR_ATLAS_VERIFY)
      .setDescription(
        '## **<a:j_azulinfinito2:1505603691594649703> Painel Ranking e Perfil**\n\n\u200B\n' +
        '<a:blue:1505604199344242868> **Acesse seu Perfil competitivo**\n\n' +
        '<a:blue:1505604199344242868> **Meu Perfil:**\n' +
        '<a:03_arrow:1505602455726194808> Dados e informações.\n\n' +
        '<:aim:1505614995101323324> **Ranking:**\n' +
        '<a:03_arrow:1505602455726194808> Veja os melhores da Atlas.'
      )
      .setImage('https://media.discordapp.net/attachments/1504843833240977419/1506111249887395940/olicihi000nal_1.png')
      .setFooter({ text: 'Atlas System • Sistema competitivo' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ver_perfil').setLabel('Meu Perfil').setEmoji('🖥️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ver_ranking').setLabel('Ranking').setEmoji('👑').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: '✅ Painel de perfil enviado.', ephemeral: true });
    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
