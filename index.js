const env = require("./config/env");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  REST,
  Routes,
  AttachmentBuilder
} = require("discord.js");

const { createCanvas, loadImage } = require("canvas");
const { slashCommandsMap, slashCommandsData } = require("./commands");

const Database = require("better-sqlite3");
const db = new Database("database.db");

const COR = 0x6A0DAD;
const COR_DOURADO = 0xF1C40F;
const COR_ATLAS_VERIFY = 0x2563EB;

const ATLAS_MEMBER_ROLE_ID = "1507940677294751874";
const ATLAS_VERIFY_BANNER = "https://media.discordapp.net/attachments/1372564454025330750/1507780534116417597/Canva.Derrota_13_19_29_1.png?ex=6a13258c&is=6a11d40c&hm=fb3d7319ae5a9e789b31cb63dd273ee194c3bd82b9b2f5ac6c2ca3217227a3c6&=&format=webp&quality=lossless&width=1860&height=580";
const ATLAS_CONNECT_BANNER = "https://media.discordapp.net/attachments/1504843833240977419/1506084868100980857/3533333_1.png?ex=6a0cfa56&is=6a0ba8d6&hm=c7bc2ca67bee8aeab58b829a59a00c311696711ad2d20d4d695b1adf1193b071&=&format=webp&quality=lossless&width=1866&height=586";

const conexoesPendentes = new Map();
const pontuacaoPendentes = new Map();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= DATABASE =================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  game_id TEXT,
  nick TEXT,
  pix TEXT,
  wins INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS event_registrations (
  discord_id TEXT PRIMARY KEY,
  game_id TEXT,
  nick TEXT,
  pix TEXT,
  registered_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS quedas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  status TEXT DEFAULT 'ABERTA',
  criada_por TEXT,
  criada_em TEXT DEFAULT CURRENT_TIMESTAMP,
  fechada_em TEXT
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS queda_guildas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queda_id INTEGER NOT NULL,
  guilda_nome TEXT NOT NULL,
  kills INTEGER DEFAULT 0,
  colocacao INTEGER DEFAULT 0,
  pontos INTEGER DEFAULT 0,
  criada_em TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS queda_jogadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queda_id INTEGER NOT NULL,
  discord_id TEXT NOT NULL,
  nick TEXT,
  guilda_nome TEXT,
  kills INTEGER DEFAULT 0,
  pontos INTEGER DEFAULT 0,
  criada_em TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS queda_lineups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queda_id INTEGER NOT NULL,
  guilda_nome TEXT NOT NULL,
  jogador1_ref TEXT,
  jogador2_ref TEXT,
  jogador3_ref TEXT,
  jogador4_ref TEXT,
  status TEXT DEFAULT 'PENDENTE',
  criada_em TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS ranking_guildas (
  guilda_nome TEXT PRIMARY KEY,
  pontos INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  partidas INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS ranking_solo (
  discord_id TEXT PRIMARY KEY,
  nick TEXT,
  pontos INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  partidas INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`).run();

// ================= FUNÇÕES AUXILIARES =================
function cortarTexto(ctx, texto, maxWidth) {
  if (!texto) return "Não informado";

  let textoFinal = String(texto);

  while (ctx.measureText(textoFinal).width > maxWidth && textoFinal.length > 3) {
    textoFinal = textoFinal.slice(0, -1);
  }

  if (textoFinal !== String(texto)) {
    textoFinal = textoFinal.slice(0, -3) + "...";
  }

  return textoFinal;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCardInfo(ctx, x, y, w, h, titulo, valor) {
  ctx.save();

  const gradiente = ctx.createLinearGradient(x, y, x + w, y + h);
  gradiente.addColorStop(0, "rgba(0, 229, 255, 0.24)");
  gradiente.addColorStop(0.55, "rgba(0, 140, 255, 0.14)");
  gradiente.addColorStop(1, "rgba(0, 25, 70, 0.22)");

  ctx.fillStyle = gradiente;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 229, 255, 0.58)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();

  ctx.fillStyle = "#00E5FF";
  ctx.font = "bold 18px Arial";
  ctx.fillText(titulo, x + 18, y + 30);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 30px Arial";
  ctx.fillText(cortarTexto(ctx, valor, w - 36), x + 18, y + 66);

  ctx.restore();
}

async function carregarImagemPorUrl(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return loadImage(Buffer.from(arrayBuffer));
}

function obterListaIdsEnv(valor) {
  if (!valor) return [];

  return String(valor)
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);
}

function obterNomeGuildaDoMembro(member) {
  if (!member) return "SEM GUILDA";

  const guildRoleIds = obterListaIdsEnv(env.GUILD_ROLE_IDS);

  if (!guildRoleIds.length) {
    return "SEM GUILDA";
  }

  const cargoGuilda = guildRoleIds
    .map(roleId => member.roles.cache.get(roleId))
    .find(Boolean);

  return cargoGuilda?.name || "SEM GUILDA";
}

function obterEloPorVitorias(wins = 0) {
  const totalWins = Number(wins) || 0;

  if (totalWins >= 20) {
    return {
      nome: "General",
      roleId: env.PLAYER_ELO_GENERAL_ROLE_ID,
      imagem: env.PLAYER_ELO_GENERAL_IMAGE || env.RANK_GENERAL_IMAGE
    };
  }

  if (totalWins >= 15) {
    return {
      nome: "Esmeralda",
      roleId: env.PLAYER_ELO_ESMERALDA_ROLE_ID,
      imagem: env.PLAYER_ELO_ESMERALDA_IMAGE || env.RANK_ESMERALDA_IMAGE
    };
  }

  if (totalWins >= 10) {
    return {
      nome: "Ouro",
      roleId: env.PLAYER_ELO_OURO_ROLE_ID,
      imagem: env.PLAYER_ELO_OURO_IMAGE || env.RANK_OURO_IMAGE
    };
  }

  if (totalWins >= 5) {
    return {
      nome: "Bronze",
      roleId: env.PLAYER_ELO_BRONZE_ROLE_ID,
      imagem: env.PLAYER_ELO_BRONZE_IMAGE || env.RANK_BRONZE_IMAGE
    };
  }

  return {
    nome: "Ferro",
    roleId: env.PLAYER_ELO_FERRO_ROLE_ID,
    imagem: env.PLAYER_ELO_FERRO_IMAGE || env.RANK_FERRO_IMAGE
  };
}

function obterEloPlayerDoMembro(member, wins = 0) {
  const elos = [
    {
      nome: "General",
      roleId: env.PLAYER_ELO_GENERAL_ROLE_ID,
      imagem: env.PLAYER_ELO_GENERAL_IMAGE || env.RANK_GENERAL_IMAGE
    },
    {
      nome: "Esmeralda",
      roleId: env.PLAYER_ELO_ESMERALDA_ROLE_ID,
      imagem: env.PLAYER_ELO_ESMERALDA_IMAGE || env.RANK_ESMERALDA_IMAGE
    },
    {
      nome: "Ouro",
      roleId: env.PLAYER_ELO_OURO_ROLE_ID,
      imagem: env.PLAYER_ELO_OURO_IMAGE || env.RANK_OURO_IMAGE
    },
    {
      nome: "Bronze",
      roleId: env.PLAYER_ELO_BRONZE_ROLE_ID,
      imagem: env.PLAYER_ELO_BRONZE_IMAGE || env.RANK_BRONZE_IMAGE
    },
    {
      nome: "Ferro",
      roleId: env.PLAYER_ELO_FERRO_ROLE_ID,
      imagem: env.PLAYER_ELO_FERRO_IMAGE || env.RANK_FERRO_IMAGE
    }
  ];

  if (member) {
    const eloPorCargo = elos.find(elo => elo.roleId && member.roles.cache.has(elo.roleId));

    if (eloPorCargo) {
      const cargo = member.roles.cache.get(eloPorCargo.roleId);

      return {
        ...eloPorCargo,
        nome: cargo?.name || eloPorCargo.nome
      };
    }
  }

  return obterEloPorVitorias(wins);
}

function isUrlValida(url) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

async function carregarImagemOpcional(url) {
  if (!isUrlValida(url)) return null;

  try {
    return await carregarImagemPorUrl(url);
  } catch (error) {
    console.error("Erro ao carregar imagem opcional:", error);
    return null;
  }
}

function drawCardElo(ctx, x, y, w, h, titulo, valor, imagemElo) {
  ctx.save();

  const gradiente = ctx.createLinearGradient(x, y, x + w, y + h);
  gradiente.addColorStop(0, "rgba(0, 229, 255, 0.34)");
  gradiente.addColorStop(1, "rgba(0, 60, 255, 0.16)");

  ctx.fillStyle = gradiente;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 229, 255, 0.82)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();

  ctx.fillStyle = "#00E5FF";
  ctx.font = "bold 18px Arial";
  ctx.fillText(titulo, x + 18, y + 30);

  if (imagemElo) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 229, 255, 0.85)";
    ctx.shadowBlur = 18;
    ctx.drawImage(imagemElo, x + w - 78, y + 16, 54, 54);
    ctx.restore();
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px Arial";
  ctx.fillText(cortarTexto(ctx, valor, imagemElo ? w - 112 : w - 36), x + 18, y + 66);

  ctx.restore();
}


function usuarioEhAdmin(interaction) {
  return interaction.user.id === env.ADMIN_ID;
}

function calcularPontosColocacao(colocacao) {
  const posicao = Number(colocacao) || 0;

  if (posicao === 1) return 25;
  if (posicao === 2) return 20;
  if (posicao === 3) return 15;
  if (posicao === 4) return 12;
  if (posicao === 5) return 10;
  if (posicao >= 6 && posicao <= 10) return 5;

  return 0;
}

function calcularPontosGuilda(kills, colocacao) {
  return (Number(kills) || 0) + calcularPontosColocacao(colocacao);
}

function calcularPontosJogador(kills) {
  return Number(kills) || 0;
}

function obterQuedaAberta() {
  return db.prepare(`
    SELECT *
    FROM quedas
    WHERE status = 'ABERTA'
    ORDER BY id DESC
    LIMIT 1
  `).get();
}


function obterProximoNomeQueda() {
  const ultimaQueda = db.prepare(`
    SELECT id
    FROM quedas
    ORDER BY id DESC
    LIMIT 1
  `).get();

  const numero = ultimaQueda ? Number(ultimaQueda.id) + 1 : 1;
  return `${numero}° Queda`;
}

function normalizarTextoBusca(valor) {
  return String(valor || "").trim();
}

function buscarUsuarioPorReferencia(referencia) {
  const ref = normalizarTextoBusca(referencia);

  if (!ref) return null;

  const porGameId = db.prepare(`
    SELECT *
    FROM users
    WHERE game_id = ?
  `).get(ref);

  if (porGameId) return porGameId;

  const porNickExato = db.prepare(`
    SELECT *
    FROM users
    WHERE LOWER(nick) = LOWER(?)
  `).get(ref);

  if (porNickExato) return porNickExato;

  const porDiscordId = db.prepare(`
    SELECT *
    FROM users
    WHERE discord_id = ?
  `).get(ref.replace(/[<@!>]/g, ""));

  if (porDiscordId) return porDiscordId;

  return null;
}

function obterCargoGuildaPorId(interaction, referencia) {
  const ref = normalizarTextoBusca(referencia);
  const roleId = ref.replace(/[<@&>]/g, "");

  if (!roleId) return null;

  const role = interaction.guild?.roles?.cache?.get(roleId);

  if (!role) return null;

  return role;
}

function obterLineupPendente(quedaId) {
  return db.prepare(`
    SELECT *
    FROM queda_lineups
    WHERE queda_id = ?
    AND status = 'PENDENTE'
    ORDER BY id DESC
    LIMIT 1
  `).get(quedaId);
}

function montarResumoJogadoresLineup(lineup) {
  const refs = [
    lineup.jogador1_ref,
    lineup.jogador2_ref,
    lineup.jogador3_ref,
    lineup.jogador4_ref
  ];

  return refs.map((ref, index) => {
    const user = buscarUsuarioPorReferencia(ref);

    if (user) {
      return `**J${index + 1}:** ${user.nick || "Sem nick"} • ID: \`${user.game_id || "Não informado"}\``;
    }

    return `**J${index + 1}:** \`${ref || "Não informado"}\` ⚠️ não encontrado no /conectar`;
  }).join("\n");
}

function montarEmbedPainelPontuacao() {
  const quedaAberta = obterQuedaAberta();

  return new EmbedBuilder()
    .setColor(COR_ATLAS_VERIFY)
    .setDescription(
      "## **🏆 Painel Pontuação — ATLAS**\n\n" +
      "Gerencie quedas, guildas, jogadores e rankings competitivos.\n\n" +
      (
        quedaAberta
          ? "🟢 **Queda aberta:** `" + quedaAberta.nome + "`\n" +
            "📌 **ID:** `" + quedaAberta.id + "`\n" +
            "📅 **Criada em:** `" + quedaAberta.criada_em + "`\n\n" +
            "Use os botões abaixo para adicionar guildas, jogadores, visualizar ou fechar a queda atual."
          : "🔴 **Nenhuma queda aberta.**\n\n" +
            "Clique em **Iniciar Queda** para começar uma nova queda competitiva."
      )
    )
    .setFooter({ text: "Atlas System • Painel de Pontuação" })
    .setTimestamp();
}

function montarBotoesPontuacao() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pontuacao_iniciar_queda")
      .setLabel("Iniciar Queda")
      .setEmoji("🏁")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("pontuacao_adicionar_guilda")
      .setLabel("Adicionar Guilda")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("pontuacao_registrar_resultado")
      .setLabel("Registrar Resultado")
      .setEmoji("🎯")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pontuacao_ver_queda")
      .setLabel("Ver Queda Atual")
      .setEmoji("👁️")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("pontuacao_historico")
      .setLabel("Histórico")
      .setEmoji("📜")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("pontuacao_fechar_queda")
      .setLabel("Fechar Queda")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

function montarEmbedQuedaAtual() {
  const queda = obterQuedaAberta();

  if (!queda) {
    return new EmbedBuilder()
      .setColor(COR_DOURADO)
      .setTitle("🔴 Nenhuma queda aberta")
      .setDescription("Inicie uma queda antes de visualizar os dados.");
  }

  const guildas = db.prepare(`
    SELECT *
    FROM queda_guildas
    WHERE queda_id = ?
    ORDER BY pontos DESC, kills DESC, colocacao ASC
  `).all(queda.id);

  const jogadores = db.prepare(`
    SELECT *
    FROM queda_jogadores
    WHERE queda_id = ?
    ORDER BY pontos DESC, kills DESC
    LIMIT 10
  `).all(queda.id);

  const lineupPendente = obterLineupPendente(queda.id);
  const totalKillsGuildas = guildas.reduce((acc, item) => acc + (Number(item.kills) || 0), 0);
  const totalPontosGuildas = guildas.reduce((acc, item) => acc + (Number(item.pontos) || 0), 0);

  let textoGuildas = "Nenhuma guilda com resultado fechado ainda.";

  if (guildas.length) {
    textoGuildas = guildas.slice(0, 10).map((guilda, index) => {
      return (
        `**${index + 1}. ${guilda.guilda_nome}**\n` +
        `⚔️ Kills: \`${guilda.kills}\` • 🏅 Colocação: \`${guilda.colocacao}º\` • ⭐ Pontos: \`${guilda.pontos}\``
      );
    }).join("\n\n");
  }

  let textoJogadores = "Nenhum jogador com resultado registrado ainda.";

  if (jogadores.length) {
    textoJogadores = jogadores.map((jogador, index) => {
      return (
        `**${index + 1}. ${jogador.nick || "Sem nick"}** <@${jogador.discord_id}>\n` +
        `🏴 Guilda: \`${jogador.guilda_nome || "SEM GUILDA"}\` • ⚔️ Kills: \`${jogador.kills}\` • ⭐ Pontos: \`${jogador.pontos}\``
      );
    }).join("\n\n");
  }

  const textoLineup = lineupPendente
    ? (
      "### **🕓 Lineup aguardando resultado**\n" +
      `🏴 **Guilda:** \`${lineupPendente.guilda_nome}\`\n` +
      `${montarResumoJogadoresLineup(lineupPendente)}\n\n` +
      "Clique em **Registrar Resultado** para informar as kills e a colocação."
    )
    : "### **🕓 Lineup aguardando resultado**\nNenhuma lineup pendente.";

  return new EmbedBuilder()
    .setColor(COR_ATLAS_VERIFY)
    .setDescription(
      "## **👁️ Queda Atual — ATLAS**\n\n" +
      `🏆 **Nome:** \`${queda.nome}\`\n` +
      `📌 **ID:** \`${queda.id}\`\n` +
      `🟢 **Status:** \`${queda.status}\`\n` +
      `📅 **Criada em:** \`${queda.criada_em}\`\n\n` +
      "### **📊 Resumo**\n" +
      `👥 Guildas finalizadas: \`${guildas.length}\`\n` +
      `⚔️ Kills Guildas: \`${totalKillsGuildas}\`\n` +
      `⭐ Pontos Guildas: \`${totalPontosGuildas}\`\n\n` +
      `${textoLineup}\n\n` +
      "### **🏴 Ranking da Queda — Guildas**\n" +
      `${textoGuildas}\n\n` +
      "### **🎯 Top Jogadores da Queda**\n" +
      `${textoJogadores}`
    )
    .setFooter({ text: "Atlas System • Queda em andamento" })
    .setTimestamp();
}

function atualizarRankingGuilda(guildaNome, kills, colocacao, pontos) {
  const wins = Number(colocacao) === 1 ? 1 : 0;

  db.prepare(`
    INSERT INTO ranking_guildas (guilda_nome, pontos, kills, wins, partidas, updated_at)
    VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(guilda_nome) DO UPDATE SET
      pontos = pontos + excluded.pontos,
      kills = kills + excluded.kills,
      wins = wins + excluded.wins,
      partidas = partidas + 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(guildaNome, pontos, kills, wins);
}

function atualizarRankingSolo(discordId, nick, kills, pontos) {
  db.prepare(`
    INSERT INTO ranking_solo (discord_id, nick, pontos, kills, wins, partidas, updated_at)
    VALUES (?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(discord_id) DO UPDATE SET
      nick = excluded.nick,
      pontos = pontos + excluded.pontos,
      kills = kills + excluded.kills,
      partidas = partidas + 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(discordId, nick, pontos, kills);
}

function montarEmbedHistoricoQuedas() {
  const quedas = db.prepare(`
    SELECT *
    FROM quedas
    ORDER BY id DESC
    LIMIT 10
  `).all();

  if (!quedas.length) {
    return new EmbedBuilder()
      .setColor(COR_DOURADO)
      .setTitle("📜 Histórico de Quedas")
      .setDescription("Nenhuma queda registrada ainda.");
  }

  const texto = quedas.map(queda => {
    const guildas = db.prepare("SELECT COUNT(*) AS total FROM queda_guildas WHERE queda_id = ?").get(queda.id)?.total || 0;
    const jogadores = db.prepare("SELECT COUNT(*) AS total FROM queda_jogadores WHERE queda_id = ?").get(queda.id)?.total || 0;

    return (
      `**#${queda.id} — ${queda.nome}**\n` +
      `Status: \`${queda.status}\` • Guildas: \`${guildas}\` • Jogadores: \`${jogadores}\`\n` +
      `Criada em: \`${queda.criada_em}\``
    );
  }).join("\n\n");

  return new EmbedBuilder()
    .setColor(COR_ATLAS_VERIFY)
    .setTitle("📜 Histórico de Quedas")
    .setDescription(texto)
    .setFooter({ text: "Atlas System • Últimas 10 quedas" })
    .setTimestamp();
}

function montarEmbedRankingGuildas() {
  const guildas = db.prepare(`
    SELECT *
    FROM ranking_guildas
    ORDER BY pontos DESC, kills DESC, wins DESC
    LIMIT 10
  `).all();

  if (!guildas.length) {
    return new EmbedBuilder()
      .setColor(COR_DOURADO)
      .setTitle("🏴 Ranking de Guildas")
      .setDescription("Nenhuma guilda pontuou ainda.");
  }

  const texto = guildas.map((guilda, index) => {
    return (
      `**${index + 1}º — ${guilda.guilda_nome}**\n` +
      `⭐ Pontos: \`${guilda.pontos}\` • ⚔️ Kills: \`${guilda.kills}\` • 🏆 Wins: \`${guilda.wins}\` • 🎮 Quedas: \`${guilda.partidas}\``
    );
  }).join("\n\n");

  return new EmbedBuilder()
    .setColor(COR_ATLAS_VERIFY)
    .setTitle("🏴 Ranking Geral de Guildas")
    .setDescription(texto)
    .setFooter({ text: "Atlas System • Ranking Guildas" })
    .setTimestamp();
}

function montarEmbedRankingSolo() {
  const jogadores = db.prepare(`
    SELECT *
    FROM ranking_solo
    ORDER BY pontos DESC, kills DESC, wins DESC
    LIMIT 10
  `).all();

  if (!jogadores.length) {
    return new EmbedBuilder()
      .setColor(COR_DOURADO)
      .setTitle("🎯 Ranking Solo")
      .setDescription("Nenhum jogador pontuou ainda.");
  }

  const texto = jogadores.map((jogador, index) => {
    return (
      `**${index + 1}º — ${jogador.nick || "Sem nick"}** <@${jogador.discord_id}>\n` +
      `⭐ Pontos: \`${jogador.pontos}\` • ⚔️ Kills: \`${jogador.kills}\` • 🎮 Quedas: \`${jogador.partidas}\``
    );
  }).join("\n\n");

  return new EmbedBuilder()
    .setColor(COR_ATLAS_VERIFY)
    .setTitle("🎯 Ranking Solo Geral")
    .setDescription(texto)
    .setFooter({ text: "Atlas System • Ranking Solo" })
    .setTimestamp();
}


// ================= CARD GAMER PERFIL =================
async function gerarCardPerfil(interaction, user, ranking) {
  const canvas = createCanvas(1100, 520);
  const ctx = canvas.getContext("2d");

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  const nomeGuilda = obterNomeGuildaDoMembro(member);
  const eloPlayer = obterEloPlayerDoMembro(member, user?.wins || 0);
  const imagemElo = await carregarImagemOpcional(eloPlayer.imagem);

  // Fundo principal
  const fundo = ctx.createLinearGradient(0, 0, 1100, 520);
  fundo.addColorStop(0, "#020617");
  fundo.addColorStop(0.42, "#031B3D");
  fundo.addColorStop(0.72, "#020B1F");
  fundo.addColorStop(1, "#000814");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, 1100, 520);

  // Efeitos de luz azul elétrica
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#00E5FF";
  ctx.beginPath();
  ctx.arc(925, 85, 275, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#003CFF";
  ctx.beginPath();
  ctx.arc(95, 470, 230, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00E5FF";
  ctx.beginPath();
  ctx.arc(505, -20, 175, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Grid e linhas decorativas
  ctx.strokeStyle = "rgba(0, 198, 255, 0.20)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(650 + i * 34, 0);
    ctx.lineTo(790 + i * 34, 520);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(45, 95 + i * 46);
    ctx.lineTo(1055, 70 + i * 46);
    ctx.stroke();
  }

  // Container
  ctx.fillStyle = "rgba(1, 8, 22, 0.92)";
  roundRect(ctx, 45, 45, 1010, 430, 32);
  ctx.fill();

  const borda = ctx.createLinearGradient(45, 45, 1055, 475);
  borda.addColorStop(0, "#00E5FF");
  borda.addColorStop(0.5, "#008CFF");
  borda.addColorStop(1, "#003CFF");

  ctx.strokeStyle = borda;
  ctx.lineWidth = 4;
  roundRect(ctx, 45, 45, 1010, 430, 32);
  ctx.stroke();

  // Barra lateral
  const barra = ctx.createLinearGradient(60, 65, 60, 455);
  barra.addColorStop(0, "#00E5FF");
  barra.addColorStop(0.55, "#008CFF");
  barra.addColorStop(1, "#003CFF");
  ctx.fillStyle = barra;
  roundRect(ctx, 65, 75, 12, 370, 8);
  ctx.fill();

  // Avatar
  const avatarURL = interaction.user.displayAvatarURL({
    extension: "png",
    size: 256
  });

  const avatar = await carregarImagemPorUrl(avatarURL);

  ctx.save();
  ctx.beginPath();
  ctx.arc(205, 205, 105, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 100, 100, 210, 210);
  ctx.restore();

  ctx.shadowColor = "rgba(0, 229, 255, 0.95)";
  ctx.shadowBlur = 22;
  ctx.strokeStyle = "#00E5FF";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(205, 205, 109, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(205, 205, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Marca @ próxima ao avatar
  ctx.fillStyle = "rgba(0, 229, 255, 0.14)";
  roundRect(ctx, 107, 328, 196, 42, 16);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 107, 328, 196, 42, 16);
  ctx.stroke();

  ctx.fillStyle = "#DFF7FF";
  ctx.font = "bold 19px Arial";
  ctx.fillText(cortarTexto(ctx, `@${interaction.user.username}`, 160), 125, 355);

  // Títulos
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 46px Arial";
  ctx.fillText("PERFIL COMPETITIVO", 370, 118);

  ctx.fillStyle = "#00E5FF";
  ctx.font = "bold 25px Arial";
  ctx.fillText(cortarTexto(ctx, nomeGuilda, 560), 374, 153);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Arial";
  ctx.fillText(cortarTexto(ctx, interaction.user.username, 520), 374, 210);

  ctx.fillStyle = "#BFEFFF";
  ctx.font = "22px Arial";
  ctx.fillText("Jogador conectado ao sistema competitivo Atlas", 374, 242);

  // Cards
  drawCardInfo(ctx, 370, 275, 205, 85, "NICK", user.nick || "Não informado");
  drawCardInfo(ctx, 600, 275, 170, 85, "ID", user.game_id || "Não informado");
  drawCardInfo(ctx, 795, 275, 170, 85, "RANK", `#${ranking || "N/A"}`);

  drawCardInfo(ctx, 370, 375, 170, 85, "VITÓRIAS", String(user.wins || 0));
  drawCardInfo(ctx, 565, 375, 170, 85, "KILLS", String(user.kills || 0));
  drawCardElo(ctx, 760, 375, 205, 85, "ELO", eloPlayer.nome || "Ferro", imagemElo);

  // Rodapé
  ctx.fillStyle = "#80DFFF";
  ctx.font = "19px Arial";
  ctx.fillText("Atlas System • Perfil competitivo do jogador", 95, 455);

  return canvas.toBuffer("image/png");
}

// ================= BOT ONLINE =================
client.once("clientReady", () => {
  console.log(`🔥 Bot online como ${client.user.tag}`);
});

// ================= INTERAÇÕES =================
client.on("interactionCreate", async (interaction) => {
  try {
    // ================= COMANDOS =================
    if (interaction.isChatInputCommand()) {
      const slashCommand = slashCommandsMap.get(interaction.commandName);

      if (slashCommand) {
        return slashCommand.execute(interaction, {
          env,
          COR,
          COR_DOURADO,
          COR_ATLAS_VERIFY,
          ATLAS_VERIFY_BANNER,
          ATLAS_CONNECT_BANNER,
          usuarioEhAdmin,
          montarEmbedPainelPontuacao,
          montarBotoesPontuacao,
          montarEmbedRankingSolo,
          montarEmbedRankingGuildas
        });
      }
    }

    // ================= BOTÃO CONECTAR =================
    if (interaction.isButton() && interaction.customId === "connect") {

      const modal = new ModalBuilder()
        .setCustomId("modal_connect")
        .setTitle("Conectar Conta");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("game_id")
            .setLabel("ID do Jogador")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("nick")
            .setLabel("Nick")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("pix")
            .setLabel("Chave Pix")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }



    // ================= PONTUAÇÃO - INICIAR QUEDA =================
    if (interaction.isButton() && interaction.customId === "pontuacao_iniciar_queda") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (quedaAberta) {
        return interaction.reply({
          content: `⚠️ Já existe uma queda aberta: **${quedaAberta.nome}**. Feche a queda atual antes de iniciar outra.`,
          ephemeral: true
        });
      }

      const nomeQueda = obterProximoNomeQueda();

      const info = db.prepare(`
        INSERT INTO quedas (nome, status, criada_por)
        VALUES (?, 'ABERTA', ?)
      `).run(nomeQueda, interaction.user.id);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COR_ATLAS_VERIFY)
            .setTitle("🏁 Queda iniciada")
            .setDescription(
              `A **${nomeQueda}** foi iniciada com sucesso.\n\n` +
              `📌 **ID da queda:** \`${info.lastInsertRowid}\`\n\n` +
              "Agora clique em **Adicionar Guilda** para informar o ID do cargo da guilda e cadastrar os 4 jogadores."
            )
            .setFooter({ text: "Atlas System • Pontuação" })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // ================= PONTUAÇÃO - ADICIONAR GUILDA / LINEUP =================
    if (interaction.isButton() && interaction.customId === "pontuacao_adicionar_guilda") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (!quedaAberta) {
        return interaction.reply({
          content: "❌ Nenhuma queda aberta. Inicie uma queda primeiro.",
          ephemeral: true
        });
      }

      const lineupPendente = obterLineupPendente(quedaAberta.id);

      if (lineupPendente) {
        return interaction.reply({
          content: `⚠️ Já existe uma guilda aguardando resultado: **${lineupPendente.guilda_nome}**. Registre o resultado dela antes de adicionar outra.`,
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_pontuacao_adicionar_lineup")
        .setTitle("Adicionar Guilda e Jogadores");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("guilda_ref")
            .setLabel("ID do cargo da Guilda")
            .setPlaceholder("Cole somente o ID do cargo da guilda")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("jogador1_ref")
            .setLabel("Jogador 1 - ID do jogo ou nick")
            .setPlaceholder("ID ou nick cadastrado no /conectar")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("jogador2_ref")
            .setLabel("Jogador 2 - ID do jogo ou nick")
            .setPlaceholder("ID ou nick cadastrado no /conectar")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("jogador3_ref")
            .setLabel("Jogador 3 - ID do jogo ou nick")
            .setPlaceholder("ID ou nick cadastrado no /conectar")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("jogador4_ref")
            .setLabel("Jogador 4 - ID do jogo ou nick")
            .setPlaceholder("ID ou nick cadastrado no /conectar")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "modal_pontuacao_adicionar_lineup") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (!quedaAberta) {
        return interaction.reply({
          content: "❌ Nenhuma queda aberta.",
          ephemeral: true
        });
      }

      const lineupPendente = obterLineupPendente(quedaAberta.id);

      if (lineupPendente) {
        return interaction.reply({
          content: `⚠️ Já existe uma guilda aguardando resultado: **${lineupPendente.guilda_nome}**.`,
          ephemeral: true
        });
      }

      const guildaRef = interaction.fields.getTextInputValue("guilda_ref").trim();
      const cargoGuilda = obterCargoGuildaPorId(interaction, guildaRef);

      if (!cargoGuilda) {
        return interaction.reply({
          content: "❌ Cargo de guilda não encontrado. Cole somente o **ID do cargo da guilda**. Exemplo: `123456789012345678`.",
          ephemeral: true
        });
      }

      const guildaNome = cargoGuilda.name;
      const jogador1Ref = interaction.fields.getTextInputValue("jogador1_ref").trim();
      const jogador2Ref = interaction.fields.getTextInputValue("jogador2_ref").trim();
      const jogador3Ref = interaction.fields.getTextInputValue("jogador3_ref").trim();
      const jogador4Ref = interaction.fields.getTextInputValue("jogador4_ref").trim();

      const info = db.prepare(`
        INSERT INTO queda_lineups (queda_id, guilda_nome, jogador1_ref, jogador2_ref, jogador3_ref, jogador4_ref, status)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE')
      `).run(quedaAberta.id, guildaNome, jogador1Ref, jogador2Ref, jogador3Ref, jogador4Ref);

      const lineup = db.prepare("SELECT * FROM queda_lineups WHERE id = ?").get(info.lastInsertRowid);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COR_ATLAS_VERIFY)
            .setTitle("👥 Guilda adicionada à queda")
            .setDescription(
              `🏴 **Guilda:** \`${guildaNome}\`\n` +
              `📌 **Queda:** \`${quedaAberta.nome}\`\n\n` +
              "### **Jogadores cadastrados**\n" +
              `${montarResumoJogadoresLineup(lineup)}\n\n` +
              "Agora clique em **Registrar Resultado** para informar as kills e a colocação da guilda."
            )
            .setFooter({ text: "Atlas System • Lineup registrada" })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // ================= PONTUAÇÃO - REGISTRAR RESULTADO =================
    if (interaction.isButton() && interaction.customId === "pontuacao_registrar_resultado") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (!quedaAberta) {
        return interaction.reply({
          content: "❌ Nenhuma queda aberta. Inicie uma queda primeiro.",
          ephemeral: true
        });
      }

      const lineupPendente = obterLineupPendente(quedaAberta.id);

      if (!lineupPendente) {
        return interaction.reply({
          content: "❌ Nenhuma guilda aguardando resultado. Adicione uma guilda primeiro.",
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("modal_pontuacao_registrar_resultado")
        .setTitle("Registrar Resultado");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("kills_jogador1")
            .setLabel("Kills Jogador 1")
            .setPlaceholder(lineupPendente.jogador1_ref || "0")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("kills_jogador2")
            .setLabel("Kills Jogador 2")
            .setPlaceholder(lineupPendente.jogador2_ref || "0")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("kills_jogador3")
            .setLabel("Kills Jogador 3")
            .setPlaceholder(lineupPendente.jogador3_ref || "0")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("kills_jogador4")
            .setLabel("Kills Jogador 4")
            .setPlaceholder(lineupPendente.jogador4_ref || "0")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("colocacao_guilda")
            .setLabel("Colocação da Guilda")
            .setPlaceholder("Ex: 1")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === "modal_pontuacao_registrar_resultado") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (!quedaAberta) {
        return interaction.reply({
          content: "❌ Nenhuma queda aberta.",
          ephemeral: true
        });
      }

      const lineupPendente = obterLineupPendente(quedaAberta.id);

      if (!lineupPendente) {
        return interaction.reply({
          content: "❌ Nenhuma guilda aguardando resultado.",
          ephemeral: true
        });
      }

      const kills = [
        Number(interaction.fields.getTextInputValue("kills_jogador1")) || 0,
        Number(interaction.fields.getTextInputValue("kills_jogador2")) || 0,
        Number(interaction.fields.getTextInputValue("kills_jogador3")) || 0,
        Number(interaction.fields.getTextInputValue("kills_jogador4")) || 0
      ];

      const colocacao = Number(interaction.fields.getTextInputValue("colocacao_guilda")) || 0;
      const totalKillsGuilda = kills.reduce((acc, valor) => acc + valor, 0);
      const pontosGuilda = calcularPontosGuilda(totalKillsGuilda, colocacao);

      db.prepare(`
        INSERT INTO queda_guildas (queda_id, guilda_nome, kills, colocacao, pontos)
        VALUES (?, ?, ?, ?, ?)
      `).run(quedaAberta.id, lineupPendente.guilda_nome, totalKillsGuilda, colocacao, pontosGuilda);

      const refs = [
        lineupPendente.jogador1_ref,
        lineupPendente.jogador2_ref,
        lineupPendente.jogador3_ref,
        lineupPendente.jogador4_ref
      ];

      const jogadoresResumo = [];

      for (let i = 0; i < refs.length; i++) {
        const user = buscarUsuarioPorReferencia(refs[i]);
        const discordId = user?.discord_id || refs[i];
        const nick = user?.nick || refs[i];
        const pontosJogador = calcularPontosJogador(kills[i]);

        db.prepare(`
          INSERT INTO queda_jogadores (queda_id, discord_id, nick, guilda_nome, kills, pontos)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(quedaAberta.id, discordId, nick, lineupPendente.guilda_nome, kills[i], pontosJogador);

        jogadoresResumo.push(
          `**J${i + 1}:** ${nick} • ⚔️ \`${kills[i]}\` kill(s) • ⭐ \`${pontosJogador}\` ponto(s)`
        );
      }

      db.prepare(`
        UPDATE queda_lineups
        SET status = 'FINALIZADA'
        WHERE id = ?
      `).run(lineupPendente.id);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COR_ATLAS_VERIFY)
            .setTitle("🎯 Resultado registrado")
            .setDescription(
              `🏴 **Guilda:** \`${lineupPendente.guilda_nome}\`\n` +
              `🏅 **Colocação:** \`${colocacao}º\`\n` +
              `⚔️ **Kills totais:** \`${totalKillsGuilda}\`\n` +
              `⭐ **Pontos da guilda:** \`${pontosGuilda}\`\n\n` +
              "### **Pontuação individual**\n" +
              jogadoresResumo.join("\n") +
              "\n\nAgora você pode adicionar outra guilda ou fechar a queda."
            )
            .setFooter({ text: "Atlas System • Resultado da guilda" })
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId === "pontuacao_ver_queda") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [montarEmbedQuedaAtual()],
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId === "pontuacao_historico") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [montarEmbedHistoricoQuedas()],
        ephemeral: true
      });
    }

    if (interaction.isButton() && interaction.customId === "pontuacao_fechar_queda") {

      if (!usuarioEhAdmin(interaction)) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const quedaAberta = obterQuedaAberta();

      if (!quedaAberta) {
        return interaction.reply({
          content: "❌ Nenhuma queda aberta para fechar.",
          ephemeral: true
        });
      }

      const lineupPendente = obterLineupPendente(quedaAberta.id);

      if (lineupPendente) {
        return interaction.reply({
          content: `⚠️ A guilda **${lineupPendente.guilda_nome}** ainda está aguardando resultado. Registre o resultado antes de fechar a queda.`,
          ephemeral: true
        });
      }

      const guildas = db.prepare("SELECT * FROM queda_guildas WHERE queda_id = ?").all(quedaAberta.id);
      const jogadores = db.prepare("SELECT * FROM queda_jogadores WHERE queda_id = ?").all(quedaAberta.id);

      if (!guildas.length && !jogadores.length) {
        return interaction.reply({
          content: "⚠️ Essa queda ainda não possui guildas nem jogadores cadastrados.",
          ephemeral: true
        });
      }

      for (const guilda of guildas) {
        atualizarRankingGuilda(guilda.guilda_nome, guilda.kills, guilda.colocacao, guilda.pontos);
      }

      for (const jogador of jogadores) {
        atualizarRankingSolo(jogador.discord_id, jogador.nick, jogador.kills, jogador.pontos);

        db.prepare(`
          UPDATE users
          SET kills = kills + ?
          WHERE discord_id = ?
        `).run(jogador.kills, jogador.discord_id);
      }

      db.prepare(`
        UPDATE users
        SET wins = wins + 1
        WHERE discord_id IN (
          SELECT discord_id
          FROM queda_jogadores
          WHERE queda_id = ?
          AND guilda_nome IN (
            SELECT guilda_nome
            FROM queda_guildas
            WHERE queda_id = ?
            AND colocacao = 1
          )
        )
      `).run(quedaAberta.id, quedaAberta.id);

      db.prepare(`
        UPDATE ranking_solo
        SET wins = wins + 1
        WHERE discord_id IN (
          SELECT discord_id
          FROM queda_jogadores
          WHERE queda_id = ?
          AND guilda_nome IN (
            SELECT guilda_nome
            FROM queda_guildas
            WHERE queda_id = ?
            AND colocacao = 1
          )
        )
      `).run(quedaAberta.id, quedaAberta.id);

      db.prepare(`
        UPDATE quedas
        SET status = 'FECHADA',
            fechada_em = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quedaAberta.id);

      const totalPontosGuildas = guildas.reduce((acc, guilda) => acc + (Number(guilda.pontos) || 0), 0);
      const totalKillsGuildas = guildas.reduce((acc, guilda) => acc + (Number(guilda.kills) || 0), 0);
      const totalKillsJogadores = jogadores.reduce((acc, jogador) => acc + (Number(jogador.kills) || 0), 0);

      const rankingGuildasTexto = guildas
        .sort((a, b) => b.pontos - a.pontos || b.kills - a.kills || a.colocacao - b.colocacao)
        .map((guilda, index) => {
          return `**${index + 1}º — ${guilda.guilda_nome}** • ⚔️ ${guilda.kills} • 🏅 ${guilda.colocacao}º • ⭐ ${guilda.pontos}`;
        })
        .join("\n");

      const rankingJogadoresTexto = jogadores
        .sort((a, b) => b.pontos - a.pontos || b.kills - a.kills)
        .slice(0, 10)
        .map((jogador, index) => {
          return `**${index + 1}º — ${jogador.nick || "Sem nick"}** • 🏴 ${jogador.guilda_nome} • ⚔️ ${jogador.kills} • ⭐ ${jogador.pontos}`;
        })
        .join("\n");

      await interaction.reply({
        content: "✅ Queda fechada e resultado enviado no chat.",
        ephemeral: true
      });

      return interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COR_ATLAS_VERIFY)
            .setTitle(`🔒 Resultado Final — ${quedaAberta.nome}`)
            .setDescription(
              `👥 **Guildas:** \`${guildas.length}\`\n` +
              `🎯 **Jogadores:** \`${jogadores.length}\`\n` +
              `⚔️ **Kills Guildas:** \`${totalKillsGuildas}\`\n` +
              `🩸 **Kills Jogadores:** \`${totalKillsJogadores}\`\n` +
              `⭐ **Pontos Guildas:** \`${totalPontosGuildas}\`\n\n` +
              "## **🏴 Resultado das Guildas**\n" +
              `${rankingGuildasTexto || "Nenhuma guilda."}\n\n` +
              "## **🎯 Pontuação Individual**\n" +
              `${rankingJogadoresTexto || "Nenhum jogador."}\n\n` +
              "Os rankings geral de guildas, ranking solo e perfis foram atualizados."
            )
            .setFooter({ text: "Atlas System • Resultado consolidado" })
            .setTimestamp()
        ]
      });
    }

    // ================= HUB - REGRAS =================
    if (interaction.isButton() && interaction.customId === "atlas_verify_rules_english") {

      const embed = new EmbedBuilder()
        .setColor(COR_ATLAS_VERIFY)
        .setDescription(
          "### **<:bluebadge:1506073703115526177> HUB - Rules**\n\n\u200B\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Respect all players and staff members.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Racism, harassment, bullying, or discriminationS.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> NSFW (+18) content is not allowed.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Avoid spam, flood, excessive links, and abusive caps.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Do not share personal information from other members.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Reports must contain valid proof (prints/videos).\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Issues must be resolved through tickets.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Multiple accounts and fake nicknames are prohibited.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Toxic behavior may result in punishment.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Warnings, suspensions, or bans may be applied depending on the violation.\n\n" +
          "**By accepting, you confirm that:**\n\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> You have read and agree with the community rules.\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> You will keep respect with players, staff, and organization.\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> You understand that punishments may be applied."
        )
        .setImage(ATLAS_VERIFY_BANNER)
        .setFooter({ text: " • Championship Security" })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // =================  - REGRAS EM ESPANHOL =================
    if (interaction.isButton() && interaction.customId === "atlas_verify_rules_spanish") {

      const embed = new EmbedBuilder()
        .setColor(COR_ATLAS_VERIFY)
        .setDescription(
          "### **<:bluebadge:1506073703115526177> HUB - Reglas**\n\n\u200B\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Respeta a todos los jugadores y miembros del staff.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> El racismo, acoso, bullying o discriminación están prohibidos.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> El contenido NSFW (+18) no está permitido.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Evita spam, flood, enlaces excesivos y uso abusivo de mayúsculas.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> No compartas información personal de otros miembros.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Los reportes deben contener pruebas válidas (capturas/videos).\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Los problemas deben resolverse mediante tickets.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Las cuentas múltiples y nicks falsos están prohibidos.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> El comportamiento tóxico puede resultar en sanciones.\n" +
          "<a:c_roxo_preto_fireroxo:1372691295721488516> Advertencias, suspensiones o baneos podrán aplicarse según la infracción.\n\n" +
          "**Al aceptar, confirmas que:**\n\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> Has leído y aceptas las reglas de la comunidad.\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> Mantendrás respeto con jugadores, staff y organización.\n" +
          "<a:LEGENDAPOSTAS:1373180471537565726> Entiendes que pueden aplicarse sanciones."
        )
        .setImage(ATLAS_VERIFY_BANNER)
        .setFooter({ text: "HUB SECURITY • Championship Security" })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ================= HUB SECURITY - ACEITAR REGRAS =================
    if (interaction.isButton() && interaction.customId === "atlas_verify_accept_rules") {

      if (!interaction.guild) {
        return interaction.reply({
          content: "❌ Esta verificação só pode ser feita dentro do servidor.",
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Não foi possível localizar seu perfil no servidor.",
          ephemeral: true
        });
      }

      const role = interaction.guild.roles.cache.get(ATLAS_MEMBER_ROLE_ID)
        || await interaction.guild.roles.fetch(ATLAS_MEMBER_ROLE_ID).catch(() => null);

      if (!role) {
        return interaction.reply({
          content: "❌ O cargo **・Atlas Member** não foi encontrado no servidor. Avise a administração.",
          ephemeral: true
        });
      }

      if (member.roles.cache.has(ATLAS_MEMBER_ROLE_ID)) {
        return interaction.reply({
          content: "⚠️ Você já aceitou as regras e já possui o cargo **・Atlas Member**.",
          ephemeral: true
        });
      }

      await member.roles.add(ATLAS_MEMBER_ROLE_ID).catch((error) => {
        console.error("Erro ao adicionar cargo Atlas Member:", error);
        return null;
      });

      const memberAtualizado = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

      if (!memberAtualizado || !memberAtualizado.roles.cache.has(ATLAS_MEMBER_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Não consegui adicionar o cargo **・Atlas Member**. Verifique se o cargo do bot está acima desse cargo e se ele possui permissão para gerenciar cargos.",
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(COR_ATLAS_VERIFY)
        .setTitle("✅ Verificação concluída")
        .setDescription(
          "Você aceitou as regras com sucesso e recebeu o cargo **・Atlas Member**.\n\n" +
          "Bem-vindo ao Atlas Championship. Boa sorte nas competições!"
        )
        .setFooter({ text: "HUB SECURITY • Acesso liberado" })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ================= CONFIRMAR DADOS ANTES DE SALVAR =================
    if (interaction.isModalSubmit() && interaction.customId === "modal_connect") {

      const gameId = interaction.fields.getTextInputValue("game_id");
      const nick = interaction.fields.getTextInputValue("nick");
      const pix = interaction.fields.getTextInputValue("pix");

      conexoesPendentes.set(interaction.user.id, {
        gameId,
        nick,
        pix
      });

      const embed = new EmbedBuilder()
        .setColor(COR_DOURADO)
        .setTitle("⚠️ Confirmar Conexão")
        .setDescription(
          "Você tem certeza que deseja continuar?\n\n" +
          "Confira todos os dados antes de confirmar. Caso você informe dados incorretos e ganhe alguma premiação, a Ascend não se responsabiliza por erros."
        )
        .addFields(
          { name: "🎮 Nick informado", value: nick || "Não informado", inline: true },
          { name: "🆔 ID informado", value: gameId || "Não informado", inline: true },
          { name: "💸 Pix informado", value: pix || "Não informado" }
        )
        .setFooter({ text: "Confirme apenas se os dados estiverem corretos." });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirmar_conexao")
          .setLabel("Confirmar")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("cancelar_conexao")
          .setLabel("Cancelar")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }

    // ================= SALVAR CONTA APÓS CONFIRMAR =================
    if (interaction.isButton() && interaction.customId === "confirmar_conexao") {

      const dados = conexoesPendentes.get(interaction.user.id);

      if (!dados) {
        return interaction.reply({
          content: "❌ Nenhuma conexão pendente encontrada. Use /conectar novamente.",
          ephemeral: true
        });
      }

      db.prepare(`
        INSERT OR REPLACE INTO users (discord_id, game_id, nick, pix)
        VALUES (?, ?, ?, ?)
      `).run(interaction.user.id, dados.gameId, dados.nick, dados.pix);

      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (env.CARGO_ACESSO_ANTECIPADO) {
        await member.roles.remove(env.CARGO_ACESSO_ANTECIPADO).catch(() => null);
      }

      if (env.CARGO_VISITANTE) {
        await member.roles.add(env.CARGO_VISITANTE).catch(() => null);
      }

      if (env.CARGO_CONECTADO) {
        await member.roles.add(env.CARGO_CONECTADO).catch(() => null);
      }

      conexoesPendentes.delete(interaction.user.id);

      return interaction.update({
        content: "✅ Conta conectada com sucesso!",
        embeds: [],
        components: []
      });
    }

    // ================= CANCELAR CONEXÃO =================
    if (interaction.isButton() && interaction.customId === "cancelar_conexao") {

      conexoesPendentes.delete(interaction.user.id);

      return interaction.update({
        content: "❌ Conexão cancelada. Nenhum dado foi salvo.",
        embeds: [],
        components: []
      });
    }

    // ================= VER PERFIL EM CARD PNG =================
    if (interaction.isButton() && interaction.customId === "ver_perfil") {

      const user = db.prepare("SELECT * FROM users WHERE discord_id = ?").get(interaction.user.id);

      if (!user) {
        return interaction.reply({
          content: "❌ Você ainda não conectou sua conta.",
          ephemeral: true
        });
      }

      const ranking = db.prepare(`
        SELECT discord_id, wins,
        RANK() OVER (ORDER BY wins DESC) as posicao
        FROM users
      `).all();

      const playerRank = ranking.find(r => r.discord_id === interaction.user.id);

      try {
        const buffer = await gerarCardPerfil(interaction, user, playerRank?.posicao);
        const attachment = new AttachmentBuilder(buffer, { name: "perfil-atlas.png" });

        return interaction.reply({
          files: [attachment],
          ephemeral: true
        });
      } catch (error) {
        console.error("Erro ao gerar card de perfil:", error);

        return interaction.reply({
          content: "❌ Não foi possível gerar seu card de perfil agora.",
          ephemeral: true
        });
      }
    }

    // ================= VER RANKING =================
    if (interaction.isButton() && interaction.customId === "ver_ranking") {

      const top = db.prepare(`
        SELECT discord_id, nick, game_id, wins, kills
        FROM users
        ORDER BY wins DESC, kills DESC
        LIMIT 10
      `).all();

      if (!top.length) {
        return interaction.reply({
          content: "❌ Nenhum jogador encontrado no ranking.",
          ephemeral: true
        });
      }

      const medalhasRanking = [
        "<:17:1499621178376196247>",
        "🥈",
        "🥉",
        "🏅",
        "🏅",
        "🏅",
        "🏅",
        "🏅",
        "🏅",
        "🏅"
      ];

      let textoRanking =
        "## <:ASCENDINFINITY:1493013232741519421> **Ranking Global ATLAS**\n" +
        "Confira abaixo os melhores jogadores cadastrados no sistema competitivo.\n\n" +
        `<:trainingcenter:1499622266718261418> **Jogadores exibidos: ${top.length}/10**\n\n`;

      for (let i = 0; i < top.length; i++) {
        const jogador = top[i];
        const medalha = medalhasRanking[i] || "🏅";

        textoRanking +=
          `${medalha} **${i + 1}º Lugar — ${jogador.nick || "Sem nick"}**\n` +
          `<:trainingcenter:1494031930222579855> **ID:** ${jogador.game_id || "Não informado"}\n` +
          `<a:ASCENDINFINITY:1493015893893189673> **Vitórias:** ${jogador.wins || 0}\n` +
          `<:ASCENDINFINITY:1493014912681775204> **Kills:** ${jogador.kills || 0}\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(COR)
        .setDescription(textoRanking)
        .setFooter({ text: "Ranking atualizado automaticamente • Atlas System" });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ================= EVENTO =================
    if (interaction.isButton() && interaction.customId === "evento") {

  const user = db.prepare("SELECT * FROM users WHERE discord_id = ?").get(interaction.user.id);

  if (!user) {
    return interaction.reply({
      content: "❌ Conecte sua conta primeiro.",
      ephemeral: true
    });
  }

  // 🔥 NOVO: VERIFICA DUPLICADO
  const jaInscrito = db.prepare(`
    SELECT * FROM event_registrations WHERE discord_id = ?
  `).get(interaction.user.id);

  if (jaInscrito) {
    return interaction.reply({
      content: "⚠️ Você já está inscrito neste evento.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(COR)
    .setTitle("Confirmar Inscrição")
    .addFields(
      { name: "Nick", value: user.nick },
      { name: "ID", value: user.game_id },
      { name: "Pix", value: user.pix }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("confirmar_evento")
      .setLabel("Confirmar")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

    // ================= CONFIRMAR EVENTO =================
    if (interaction.isButton() && interaction.customId === "confirmar_evento") {

      const user = db.prepare("SELECT * FROM users WHERE discord_id = ?").get(interaction.user.id);

      if (!user) {
        return interaction.reply({
          content: "❌ Conecte sua conta primeiro.",
          ephemeral: true
        });
      }

      db.prepare(`
        INSERT OR REPLACE INTO event_registrations (discord_id, game_id, nick, pix, registered_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(interaction.user.id, user.game_id, user.nick, user.pix);

      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(env.CARGO_EVENTO);

      return interaction.update({
        content: "🎉 Inscrição confirmada! Você já está registrado no evento.",
        embeds: [],
        components: []
      });
    }

    // ================= ADMIN EVENTO INSCRITOS =================
    if (interaction.isButton() && interaction.customId === "admin_evento_inscritos") {

      if (interaction.user.id !== env.ADMIN_ID) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true
        });
      }

      const inscritos = db.prepare(`
        SELECT discord_id, game_id, nick, registered_at
        FROM event_registrations
        ORDER BY registered_at DESC
      `).all();

      if (!inscritos.length) {
        return interaction.reply({
          content: "📭 Nenhum jogador inscrito no evento ainda.",
          ephemeral: true
        });
      }

      let texto = "";

      for (let i = 0; i < inscritos.length; i++) {
        const jogador = inscritos[i];

        texto +=
          `**${i + 1}. ${jogador.nick || "Sem nick"}**\n` +
          `🆔 **ID:** ${jogador.game_id || "Não informado"}\n` +
          `👤 **Discord:** <@${jogador.discord_id}>\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(COR_DOURADO)
        .setTitle("🏆 Inscritos no Evento")
        .setDescription(texto.slice(0, 4000))
        .setFooter({ text: `Total de inscritos: ${inscritos.length}` });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ================= ADMIN BUSCAR =================
    if (interaction.isButton() && interaction.customId === "buscar_user") {

      const modal = new ModalBuilder()
        .setCustomId("modal_busca")
        .setTitle("Buscar Jogador");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("id_busca")
            .setLabel("ID do Discord")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // ================= RESULTADO BUSCA =================
    if (interaction.isModalSubmit() && interaction.customId === "modal_busca") {

      const id = interaction.fields.getTextInputValue("id_busca");
      const user = db.prepare("SELECT * FROM users WHERE discord_id = ?").get(id);

      if (!user) {
        return interaction.reply({
          content: "❌ Jogador não encontrado.",
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(COR)
        .setTitle("📊 Dados do Jogador")
        .addFields(
          { name: "Nick", value: user.nick },
          { name: "ID", value: user.game_id },
          { name: "Pix", value: user.pix },
          { name: "Wins", value: `${user.wins}` },
          { name: "Kills", value: `${user.kills}` }
        );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Erro em interactionCreate:", error);

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: "❌ Ocorreu um erro ao executar esta ação.",
        ephemeral: true
      }).catch(() => null);
    }

    return interaction.reply({
      content: "❌ Ocorreu um erro ao executar esta ação.",
      ephemeral: true
    }).catch(() => null);
  }
});

// ================= COMANDOS =================
const commands = slashCommandsData.map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(env.TOKEN);

(async () => {
  try {
    console.log("🔄 Registrando comandos...");
    await rest.put(
      Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Comandos registrados!");
  } catch (err) {
    console.error(err);
  }
})();

client.login(env.TOKEN);
