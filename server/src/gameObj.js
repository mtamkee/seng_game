class Game {
  constructor(roomName) {
    this.roomName = roomName;
    this.players = [];
    this.playerIdMap = new Map();
    this.whiteCardsUsed = new Set();
    this.blackCardsUsed = new Set();
    this.currentPlayerTurn = 0;
    this.currentState;
    this.numExpectedCards;
    this.leaderId = "";
    this.shuffledIDs = [];
  }

  playerIndexFromPlayerId(playerId) {
    if (this.playerIdMap.has(playerId)) {
      return this.playerIdMap.get(playerId);
    }
    return -1;
  }

  getPlayer(playerId) {
    if (this.playerIdMap.has(playerId)) {
      return this.players[this.playerIdMap.get(playerId)];
    }
  }

  hasPlayerWithId(playerId) {
    for (let player of this.players) {
      if (player.id == playerId) {
        return true;
      }
    }
    return false;
  }

  numPlayersWithSelection() {
    let count = 0;
    for (let player of this.players) {
      if (player.selection.length > 0) {
        count++;
      }
    }
    return count;
  }

  getShuffledPlayerSelection() {
    let shuffled = [];
    const len = this.players.length;
    for (let i = 0; i < len; i++) {
      shuffled.push(i);
    }
    for (let i = 0; i < len; i++) {
      let one = Math.floor(Math.random() * len);
      let two = Math.floor(Math.random() * len);
      let temp = shuffled[one];
      shuffled[one] = shuffled[two];
      shuffled[two] = temp;
    }

    this.shuffledIDs = shuffled;

    let output = [];
    for (let id of shuffled) {
      output.push(this.players[id].selection);
    }
    return output;
  }

  incrementTurn() {
    this.currentPlayerTurn = (++this.currentPlayerTurn)%this.players.length;
  }

  getAllPlayerNames() {
    return this.players.map((player) => {
      return player.name;
    });
  }
}

class Player {
  constructor(id, socketId, name) {
    this.id = id;
    this.socketId = socketId;
    this.hand = [];
    this.points = 0;
    this.selection = [];
    this.name = name;
  }
}

module.exports = {Game, Player};

