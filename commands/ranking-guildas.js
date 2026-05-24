const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ranking-guildas').setDescription('Ver ranking geral de guildas'),
  async execute(interaction, context) {
    const { montarEmbedRankingGuildas } = context;
    return interaction.reply({ embeds: [montarEmbedRankingGuildas()], ephemeral: true });
  }
};
