const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('evento').setDescription('Inscrição em evento'),
  async execute(interaction, context) {
    const { COR_DOURADO } = context;

    const embed = new EmbedBuilder()
      .setColor(COR_DOURADO)
      .setDescription(
        '<a:ASCENDINFINITY:1493015893893189673> **Evento ASCEND Infinity**\n' +
        '<a:sineta:1494032742344691903> **Evento Competitivo — Prime Rush**\n\n' +
        '<:trainingcenter:1499625274952908910> **Premiação Total:** `R$150`\n\n' +
        '<:trainingcenter:1499622266718261418> **Top 3 jogadores:**\n' +
        'Os 3 jogadores que mais fizerem kills somando as **2 partidas** recebem **R$50 cada**.\n\n' +
        '<a:ASCENDINFINITY:1493035717087989761> **Desafio de Clipe:**\n' +
        'O primeiro clipe que bater **500 views** usando as tags abaixo ganha **R$50:**\n' +
        '**#AscendInfinity #AS #PrimeRush #AscendEvento**\n\n' +
        '<a:gift:1493015834950635693> **Sorteio durante as partidas:**\n' +
        'Durante as partidas, **5 jogadores** serão sorteados.\n' +
        'Cada sorteado recebe **<a:DIMA:1493014050479800320> 600 Gemas.**\n\n' +
        '<a:ASCENDINFINITY:1493075576817189047> Só por jogar você já participa dos sorteios.'
      )
      .setFooter({ text: 'ASCEND Infinity • Evento Oficial' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('evento')
        .setLabel('Participar do Evento')
        .setEmoji({ name: 'ASCENDINFINITY', id: '1493016022398140437', animated: true })
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ content: '✅ Painel de evento enviado.', ephemeral: true });
    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
