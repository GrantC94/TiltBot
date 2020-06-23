var botUtils, fs, fetch, botID, leagueKey, championKeys, numberOfSummoners, accountIDs,
    mostRecentGames, oldMostRecentGames;

botUtils            = require('./utils.js');
fs                  = require('fs');
fetch               = require('node-fetch');
botID               = process.env.BOT_ID;
leagueKey           = process.env.LEAGUE_KEY;
championKeys        = [];
numberOfSummoners;
accountIDs          = [];
mostRecentGames     = [];
oldMostRecentGames  = [];

function initialize() {
  loadChampionInfo();
  checkGames();
}

function run() {
  console.log("Initializing Tilt")
  for (var accountID in accountIDs) {
    getGames(accountIDs[accountID], accountID)
  }
}

function getAccountId(summonerName) {
  var options;

  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/summoner/v4/summoners/by-name/' + summonerName + '?api_key=' + leagueKey,
    method: 'GET'
  };
  
  function getAccountIdOnResponse(res) {
    if(res.statusCode == 200) {
      res.on('data', function (chunk) {
        accountIDs[summonerName] = JSON.parse(chunk).accountId
        if(numberOfSummoners == Object.keys(accountIDs).length) {
          run()
        }
      });
    } else if(res.statusCode == 429) {
      botUtils.sleep(4000)
      getAccountId(summonerName);
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
    }
  }

  botUtils.botRequest(options, getAccountIdOnResponse);
}

function getGames(accountID, summonerName) {
  var options;

  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/match/v4/matchlists/by-account/' + accountID + '?queue=420&queue=440&queue=700&endIndex=1&beginIndex=0&api_key=' + leagueKey,
    method: 'GET'
  };
  
  function getGamesOnResponse(res) {
    if(res.statusCode == 200) {
      res.on('data', function (chunk) {
        var gameId = JSON.parse(chunk).matches[0].gameId
        if(mostRecentGames[summonerName] != gameId) {
          oldMostRecentGames[summonerName] = mostRecentGames[summonerName];
          mostRecentGames[summonerName] = gameId;

          if(oldMostRecentGames[summonerName] != undefined) {
            getMostRecentGame(gameId, accountID);
          } else {
            console.log('Skipping ' + summonerName + '. ' + mostRecentGames[summonerName] + ' is the first game loaded.')
          }
        }
      });
    } else if(res.statusCode == 429) {
      botUtils.sleep(4000)
      getGames(accountID, summonerName);
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
      console.log('failure for ' + accountID + ", summoner name: " + summonerName)
    }
  }

  botUtils.botRequest(options, getGamesOnResponse);
}

function getMostRecentGame(message, accountId) {
  var options;
  
  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/match/v4/matches/' + message + '?api_key=' + leagueKey,
    method: 'GET'
  };

  function getMostRecentGamesOnRespone(res) {
    if(res.statusCode == 200) {
        var stats = [];
        var data = [];
        res.on('data', function (chunk) {
          data.push(chunk);
        });
        res.on('end', function() {
          var participantId = null
          var result = JSON.parse(data.join(''))
          for (var i = 0; i < result.participantIdentities.length; i++) {
              if(result.participantIdentities[i].player.accountId == accountId) {
                participantId = result.participantIdentities[i].participantId
                stats[0] = result.participantIdentities[i].player.summonerName
              }
          }
          for (var i = 0; i < result.participants.length; i++) {
              if(result.participants[i].participantId == participantId) {
                stats[1] = result.participants[i].stats.win
                stats[2] = result.participants[i].stats.kills
                stats[3] = result.participants[i].stats.deaths
                stats[4] = result.participants[i].stats.assists
                stats[5] = championKeys[result.participants[i].championId]
              }
          }
          if(!stats[1]) {
            tilt(stats)
          } else {
            console.log(stats[0] + ' Winned') 
          }
        });
      }  else if(res.statusCode == 429) {
        botUtils.sleep(4000)
        getMostRecentGame(message, accountId);
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  }

  botUtils.botRequest(options, getMostRecentGamesOnRespone);
}

function tilt(stats) {
  var tiltMessage, options, body;

  tiltMessage = 'Yikes! ' + stats[0] + ' just lost a League game! They went ' + stats[2] + '/' + stats[3] + '/' + stats[4] + ' on ' + stats[5] + '! That\'s a tilter!';

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };
  
  body = {
    "bot_id" : botID,
    "text" : tiltMessage
  };

  console.log('sending ' + tiltMessage + ' to ' + botID);

  function tiltOnResponse(res) {
    if(res.statusCode == 202) {
        console.log('sent ' + tiltMessage + ' to ' + botID);
      } else {
        console.log('failed sending ' + tiltMessage + ' to ' + botID);
        console.log('rejecting bad status code ' + res.statusCode);
      }
  }

  botUtils.botRequest(options, tiltOnResponse, body);
}

function parseSummoners(filename) {
  var data = ""
  data = fs.readFileSync(filename)
  var lines = data.toString().split('\n');
  for(var i = 0; i < lines.length; i++){
    if(lines[i] != '')
    getAccountId(lines[i]);
  }
  numberOfSummoners = lines.length-1;
}

function checkGames() {
    parseSummoners("./Resources/summoners.txt")
}

function loadChampionInfo() {
  let url = "http://ddragon.leagueoflegends.com/cdn/10.2.1/data/en_US/champion.json";

  let settings = { method: "Get" };

  fetch(url, settings)
    .then(res => res.json())
    .then((json) => {
        for (var champion in json.data) {
          championKeys[json.data[champion].key] = champion
        }
    });
}

exports.initialize = initialize;
exports.run = run;
