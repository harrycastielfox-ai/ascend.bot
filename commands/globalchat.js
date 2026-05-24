const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('globalchat')
    .setDescription('Configura o sistema de chat global do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('configurar')
        .setDescription('Define o canal de chat global para este servidor')
        .addChannelOption(option =>
          option
            .setName('canal')
            .setDescription('Canal de texto para o chat global')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('desativar')
        .setDescription('Desativa o chat global deste servidor')
    ),

  async execute(interaction, context) {
    const { db } = context;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas administradores podem usar este comando.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'configurar') {
      const canal = interaction.options.getChannel('canal', true);

      if (!canal?.isTextBased() || canal.isDMBased?.()) {
        return interaction.reply({ content: '❌ Selecione um canal de texto do servidor.', ephemeral: true });
      }

      db.prepare(`
        INSERT INTO global_chat_channels (guild_id, channel_id, enabled, created_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(guild_id) DO UPDATE SET
          channel_id = excluded.channel_id,
          enabled = 1
      `).run(interaction.guildId, canal.id);

      return interaction.reply({
        content: `✅ Chat global configurado para ${canal}.`,
        ephemeral: true
      });
    }

    db.prepare('DELETE FROM global_chat_channels WHERE guild_id = ?').run(interaction.guildId);

    return interaction.reply({
      content: '✅ Chat global desativado neste servidor.',
      ephemeral: true
    });
  }
};
