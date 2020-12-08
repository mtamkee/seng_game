const cardsJSON = require('./baseCards.json')
const roomManager = require('./rooms.js');
const MAX_CARDS_IN_HAND = 7;
const nodeConstants = require('../nodeConstants.js');

state = {
  SUBMIT: 0,
  PICK: 1,
}

function convertCardId(ids) {
  return ids.map((index) => {
    return cardsJSON.white[index];
  });
}

function generateCard(isWhiteCard, roomName) {
  if (isWhiteCard) {
    let numCards = cardsJSON.white.length;
    let cardNum = Math.floor(Math.random() * numCards);
    while ( roomManager.getGame(roomName).whiteCardsUsed.has(cardNum) ||
            cardsJSON.white[cardNum].text.includes('\n') ||
            cardsJSON.white[cardNum].text.includes('*')) {
      cardNum = Math.floor(Math.random() * numCards);
    }
    roomManager.getGame(roomName).whiteCardsUsed.add(cardNum);
    return cardNum;
  } else {
    let numCards = cardsJSON.black.length;
    let cardNum = Math.floor(Math.random() * numCards);
    while ( roomManager.getGame(roomName).blackCardsUsed.has(cardNum) ||
            cardsJSON.black[cardNum].text.includes('\n') ||
            cardsJSON.black[cardNum].text.includes('*')) {
      cardNum = Math.floor(Math.random() * numCards);
    }
    roomManager.getGame(roomName).blackCardsUsed.add(cardNum);
    return cardNum;
  }
}

function emitCurrentPlayerTurn(roomName) {
  if (roomManager.isValidRoomName(roomName)) {
    const currentPlayerTurn = roomManager.getGame(roomName).currentPlayerTurn;
    for (let index in roomManager.getGame(roomName).players) {
      let val = false;
      if (index == currentPlayerTurn) {
        val = true;
      } 
      nodeConstants.io.to(roomManager.getGame(roomName).players[index].socketId).emit('setIsMyTurn', {status: "success", msg: val});
    }
  }
}

function startTurnSetup(roomName) {
  roomManager.getGame(roomName).players.forEach((player, key) => {
    while (player.hand.length < MAX_CARDS_IN_HAND) {
      player.hand.push(generateCard(true, roomName));
    }

    player.selection = [];

    nodeConstants.io.to(player.socketId).emit('setHand', {status: "success", msg: convertCardId(player.hand)});
  });

  const scores = roomManager.getGame(roomName).players.map((player) => {
    return [player.name, player.points];
  });

  nodeConstants.io.sockets.in(roomName).emit('setScores', {status: "success", msg: scores});
}

function startTurn(playerId, roomName) {
    if (roomManager.isValidRoomName(roomName)) {
      startTurnSetup(roomName);
      const blackCard = generateCard(false, roomName);
      nodeConstants.io.sockets.in(roomName).emit('setBlackCard', {status: "success", msg: {card: cardsJSON.black[blackCard]}});
      emitCurrentPlayerTurn(roomName);
      roomManager.getGame(roomName).currentState = state.SUBMIT;
      roomManager.getGame(roomName).numExpectedCards = cardsJSON.black[blackCard].pick;
  }
}

function receiveWhiteCardSelection(selection, playerId, roomName, respond) {
  if (roomManager.isValidPlayerInRoom(playerId, roomName) && 
      roomManager.getCurrentTurnPlayer(roomName).id != playerId &&
      roomManager.getGame(roomName).getPlayer(playerId).selection.length == 0 &&
      selection.length == roomManager.getGame(roomName).numExpectedCards) {

    respond({status: "success"});
    // console.log("Received white card selection: ", selection);
    // Put the specified cards in the selection
    roomManager.getGame(roomName).getPlayer(playerId).selection = selection.map((index) => {
      return roomManager.getGame(roomName).getPlayer(playerId).hand[index];
    });

    // console.log(roomManager.getGame(roomName).getPlayer(playerId).hand);
    // Removed the cards from the player's hand
    roomManager.getGame(roomName).getPlayer(playerId).hand = 
    roomManager.getGame(roomName).getPlayer(playerId).hand.filter((card, index) => {
      return !selection.includes(index);
    });
    // console.log(roomManager.getGame(roomName).getPlayer(playerId).hand);

    // Update that player's hand
    player = roomManager.getGame(roomName).getPlayer(playerId);
    nodeConstants.io.to(player.socketId).emit('setHand', {status: "success", msg: convertCardId(player.hand)});

    if (roomManager.getGame(roomName).numPlayersWithSelection() == roomManager.getGame(roomName).players.length - 1) {
      startWinnerSelection(roomName);
    }
  }
}

function startWinnerSelection(roomName) {
  // console.log("Starting winner selection");
  roomManager.getGame(roomName).currentState = state.PICK;
  let toSend = roomManager.getGame(roomName).getShuffledPlayerSelection().map((playerSubmission) => {
    return {cardIds: playerSubmission, cards: convertCardId(playerSubmission)};
  });
  nodeConstants.io.sockets.in(roomName).emit('sendWhiteCardSelections', {status: "success", msg: toSend});
}

function selectWinner(winnerId, playerId, roomName) {
  if(roomManager.isValidPlayerInRoom(playerId, roomName) &&
     roomManager.getCurrentTurnPlayer(roomName).id == playerId) {
    let realId = roomManager.getGame(roomName).shuffledIDs[winnerId];
    let player = roomManager.getGame(roomName).players[realId];
    if (player != undefined) {
      const name_index = [player.name, winnerId];
      nodeConstants.io.sockets.in(roomName).emit('displayWinner', {status: "success", msg: name_index})

      roomManager.getGame(roomName).players[realId].points++;

      // After displaying the winner, wait a bit, then move to next turn
      setTimeout(() => {
        roomManager.getGame(roomName).incrementTurn();
        startTurn(roomManager.getCurrentTurnPlayer(roomName), roomName);  
      }, 3000);
    }
  }
}

module.exports = {startTurn, receiveWhiteCardSelection, selectWinner};