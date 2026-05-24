const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('pontuacao').setDescription('Painel de pontuação competitivo Atlas'),
  async execute(interaction, context) {
    const { usuarioEhAdmin, montarEmbedPainelPontuacao, montarBotoesPontuacao } = context;

    if (!usuarioEhAdmin(interaction)) {
      return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
    }

    await interaction.reply({ content: '✅ Painel de pontuação enviado.', ephemeral: true });

    return interaction.channel.send({
      embeds: [montarEmbedPainelPontuacao()],
      components: montarBotoesPontuacao()
    });
  }
};
