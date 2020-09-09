const getOpponent = (myId, allPlayers) => {
  const availablePlayers = allPlayers.filter((clientId) => clientId !== myId);
  if (availablePlayers.length > 0)
    return availablePlayers[
      Math.floor(Math.random() * availablePlayers.length)
    ];
  return null;
};

const chooseSides = () => {
  const sideArray = ["X", "O"];
  const random = Math.floor(Math.random() * 2);
  const side1 = sideArray[random];
  const side2 = sideArray[1 - random];
  return { side1, side2 };
};

module.exports = { getOpponent, chooseSides };
