require("dotenv").config();

const requiredVars = [
  "TOKEN",
  "CLIENT_ID",
  "ADMIN_ID"
];

const missingVars = requiredVars.filter((name) => !process.env[name]);

const normalizedCommandsScope = (process.env.COMMANDS_SCOPE || "global")
  .trim()
  .toLowerCase();

const commandsScope = normalizedCommandsScope === "guild" ? "guild" : "global";

if (missingVars.length > 0) {
  throw new Error(
    `[ENV] Variáveis obrigatórias ausentes: ${missingVars.join(", ")}`
  );
}

const env = {
  TOKEN: process.env.TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  ADMIN_ID: process.env.ADMIN_ID,
  COMMANDS_SCOPE: commandsScope,

  GUILD_ROLE_IDS: process.env.GUILD_ROLE_IDS,

  PLAYER_ELO_GENERAL_ROLE_ID: process.env.PLAYER_ELO_GENERAL_ROLE_ID,
  PLAYER_ELO_GENERAL_IMAGE: process.env.PLAYER_ELO_GENERAL_IMAGE,
  RANK_GENERAL_IMAGE: process.env.RANK_GENERAL_IMAGE,

  PLAYER_ELO_ESMERALDA_ROLE_ID: process.env.PLAYER_ELO_ESMERALDA_ROLE_ID,
  PLAYER_ELO_ESMERALDA_IMAGE: process.env.PLAYER_ELO_ESMERALDA_IMAGE,
  RANK_ESMERALDA_IMAGE: process.env.RANK_ESMERALDA_IMAGE,

  PLAYER_ELO_OURO_ROLE_ID: process.env.PLAYER_ELO_OURO_ROLE_ID,
  PLAYER_ELO_OURO_IMAGE: process.env.PLAYER_ELO_OURO_IMAGE,
  RANK_OURO_IMAGE: process.env.RANK_OURO_IMAGE,

  PLAYER_ELO_BRONZE_ROLE_ID: process.env.PLAYER_ELO_BRONZE_ROLE_ID,
  PLAYER_ELO_BRONZE_IMAGE: process.env.PLAYER_ELO_BRONZE_IMAGE,
  RANK_BRONZE_IMAGE: process.env.RANK_BRONZE_IMAGE,

  PLAYER_ELO_FERRO_ROLE_ID: process.env.PLAYER_ELO_FERRO_ROLE_ID,
  PLAYER_ELO_FERRO_IMAGE: process.env.PLAYER_ELO_FERRO_IMAGE,
  RANK_FERRO_IMAGE: process.env.RANK_FERRO_IMAGE,

  CARGO_ACESSO_ANTECIPADO: process.env.CARGO_ACESSO_ANTECIPADO,
  CARGO_VISITANTE: process.env.CARGO_VISITANTE,
  CARGO_CONECTADO: process.env.CARGO_CONECTADO,
  CARGO_EVENTO: process.env.CARGO_EVENTO
};

module.exports = env;
