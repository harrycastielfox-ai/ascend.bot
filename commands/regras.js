const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('regras').setDescription('Enviar painel HUB SECURITY de regras'),
  async execute(interaction, context) {
    const { COR_ATLAS_VERIFY, ATLAS_VERIFY_BANNER } = context;

    const embed = new EmbedBuilder()
      .setColor(COR_ATLAS_VERIFY)
      .setDescription(
        '### **<:emoji_3:1373369357777764452> HUB - REGRAS**\n\n\u200B\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Respeite todos os jogadores e membros.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Proibido racismo, assédio, bullying ou discriminação.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Não será tolerado conteúdo NSFW (+18).\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Evite spam, flood, links excessivos e caps abusivo.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Não compartilhe informações pessoais de terceiros.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Denúncias apenas com provas (prints/vídeos).\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Problemas devem ser resolvidos via ticket.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Múltiplas contas e nick fake são proibidos.\n' +
        '<a:c_roxo_preto_fireroxo:1372691295721488516> Comportamento tóxico pode resultar em punição.\n\n' +
        '**Ao aceitar, você confirma que:**\n\n' +
        '<a:LEGENDAPOSTAS:1373180471537565726> Leu e concorda com as regras.\n' +
        '<a:LEGENDAPOSTAS:1373180471537565726> Vai manter respeito com jogadores.\n' +
        '<a:LEGENDAPOSTAS:1373180471537565726> Entende que punições são severas.\n\n'
      )
      .setImage(ATLAS_VERIFY_BANNER)
      .setFooter({ text: 'HUB SECURITY • Championship Security' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('atlas_verify_accept_rules').setLabel('Aceitar Regras').setEmoji('✅').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('atlas_verify_rules_english').setLabel('English').setEmoji('🇺🇸').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('atlas_verify_rules_spanish').setLabel('Español').setEmoji('🇪🇸').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: '✅ Painel HUB SECURITY enviado.', ephemeral: true });
    return interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
