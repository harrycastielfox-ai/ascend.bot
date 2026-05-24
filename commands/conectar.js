const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('conectar').setDescription('Conectar conta'),
  async execute(interaction, context) {
    const { COR_ATLAS_VERIFY, ATLAS_CONNECT_BANNER } = context;

    const embed = new EmbedBuilder()
      .setColor(COR_ATLAS_VERIFY)
      .setDescription(
        "### **<:ASCENDINFINITY:1506090797987004506> Sistema de Conexão - ATLAS**\n\n\u200B\n" +
        "<:azul:1506089341406150777> **1°:** Clique em **Conectar**\n" +
        "Informe: **ID**, **NICK** e **PIX**\n\n" +
        "<:azul:1506089341406150777> **2°:** Confirme seus dados:\n" +
        "Não nos responsabilizamos por erros.\n\n" +
        "<:azul:1506089341406150777> **3°:** Onde encontro meu **ID:**\n" +
        "Acesse seu → Perfil do jogo e copie."
      )
      .setImage(ATLAS_CONNECT_BANNER)
      .setFooter({ text: 'Atlas Connect • Sistema Oficial' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('connect').setLabel('Conectar').setEmoji('🔗').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: '✅ Painel de conexão enviado.', ephemeral: true });

    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
