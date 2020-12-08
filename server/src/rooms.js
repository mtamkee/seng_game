// Maps roomNames to Game instances
const games = new Map();

// All the letters
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

const objs = require('./gameObj');

/*
 * Creates a new Game, adds it to games, and returns roomName
 */ 
function createNewRoom() {
  let roomName = generateRandomAlpha(4);

  while (games.has(roomName)) {
    roomName = generateRandomAlpha(4);
  }

  let game = new objs.Game(roomName);
  games.set(roomName, game);
  return roomName;
}

/*
 * Creates a new player in specified room, and returns playerId
 */ 
function createPlayerInRoom(roomName, playerName, socketId) {
  const playerIdLen = 10;

  if (isValidRoomName(roomName) == false) {
    return;
  }

  let playerId = generateRandomAlpha(playerIdLen);

  while (games.get(roomName).hasPlayerWithId(playerId)) {
    playerId = generateRandomAlpha(playerIdLen);
  }

  let player = new objs.Player(playerId, socketId, playerName);

  games.get(roomName).players.push(player);

  // Add the id -> index mapping
  games.get(roomName).playerIdMap.set(playerId, games.get(roomName).players.indexOf(player));
  return playerId;
}

function generateRandomAlpha(n) {
  let output = "";
  for (let i = 0; i < n; i++) {
    output += letters[Math.floor(Math.random()*letters.length)];
  }
  return output;
}

function getGame(roomName) {
  if (isValidRoomName(roomName)) {
    return games.get(roomName);
  } else {
    return null;
  }
}

function isValidRoomName(roomName) {
  return games.has(roomName);
}

function isValidPlayerInRoom(playerId, roomName) {
  return isValidRoomName(roomName) && games.get(roomName).hasPlayerWithId(playerId);
}

function getCurrentTurnPlayer(roomName) {
  if (isValidRoomName(roomName)) {
    return games.get(roomName).players[games.get(roomName).currentPlayerTurn];
  }
}

function setPlayerName(playerId, roomName, playerName) {
  if (isValidPlayerInRoom(playerId, roomName) && playerName.length <= 16) {
    getGame(roomName).getPlayer(playerId).name = playerName;
  }
}

module.exports = {createNewRoom, createPlayerInRoom, games, isValidPlayerInRoom, getGame, getCurrentTurnPlayer, isValidRoomName, setPlayerName};