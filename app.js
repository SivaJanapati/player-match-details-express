const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

convertPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const result = await db.all(query);
  response.send(result.map((eachPlayer) => convertPlayer(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_details where player_id=${playerId};`;
  const player = await db.get(query);
  response.send(convertPlayer(player));
});

app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let { playerName } = request.body;
  let query = `
    update player_details set player_name='${playerName}' where player_id=${playerId};`;
  let res = await db.run(query);
  response.send("Player Details Updated");
});

convertMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from match_details where match_id = ${matchId};`;
  const result = await db.get(query);
  response.send(convertMatch(result));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_match_score natural join match_details player_match_score where player_id = ${playerId}; `;
  const result = await db.all(query);
  response.send(result.map((eachMatch) => convertMatch(eachMatch)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from player_match_score natural join player_details where match_id = ${matchId};`;
  const result = await db.all(query);
  response.send(result.map((eachPlayer) => convertPlayer(eachPlayer)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    select 
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(player_match_score.fours) as totalFours,
    SUM(player_match_score.Sixes) as totalSixes
    from player_details inner join player_match_score
    on player_details.player_id = player_match_score.player_id
    where player_details.player_id = ${playerId};
    `;
  const playerScores = await db.get(query);
  response.send({
    playerId: playerScores["playerId"],
    playerName: playerScores["playerName"],
    totalScore: playerScores["totalScore"],
    totalFours: playerScores["totalFours"],
    totalSixes: playerScores["totalSixes"],
  });
});

module.exports = app;
