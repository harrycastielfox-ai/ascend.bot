const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ranking-solo').setDescription('Ver ranking solo competitivo'),
  async execute(interaction, context) {
    const { montarEmbedRankingSolo } = context;
    return interaction.reply({ embeds: [montarEmbedRankingSolo()], ephemeral: true });
  }
};
