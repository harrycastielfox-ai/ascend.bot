const conectar = require('./conectar');
const perfil = require('./perfil');
const evento = require('./evento');
const regras = require('./regras');
const pontuacao = require('./pontuacao');
const rankingSolo = require('./ranking-solo');
const rankingGuildas = require('./ranking-guildas');
const admin = require('./admin');

const slashCommands = [conectar, perfil, evento, regras, pontuacao, rankingSolo, rankingGuildas, admin];

module.exports = {
  slashCommands,
  slashCommandsMap: new Map(slashCommands.map(command => [command.data.name, command])),
  slashCommandsData: slashCommands.map(command => command.data)
};
