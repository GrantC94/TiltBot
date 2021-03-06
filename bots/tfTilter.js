var botUtils, fetch, botID, leagueKey, championKeys, mostRecentTFTGames, oldMostRecentTFTGames;

botUtils            = require('./botUtils.js');
fetch               = require('node-fetch');
botID               = process.env.BOT_ID;
leagueKey           = process.env.TFT_KEY;
summonersByPUUID    = [];
mostRecentTFTGames     = [];
oldMostRecentTFTGames  = [];

const nicknames = ['', '', '', '', "Fifth Place Fredrick", "Sixth Place Samson", "Seventh Place Susan", "Eight Place Andy"]
function initialize(enabled) {
  if(!enabled) {
    console.log("TFTilter Disabled.")
  } else {
    console.log("Initializing TFTilter")
    run();
  }
}

function run(enabled) {
  var name, puuid
  for (var accountInfo in botUtils.tftAccountInfo) {
    name = botUtils.tftAccountInfo[accountInfo].name
    puuid = botUtils.tftAccountInfo[accountInfo].puuid
    summonersByPUUID[puuid] = name
    tftilt(name, puuid);
  }
}

function tftilt(summonerName, puuid) {
  var options;

  options = {
    hostname: 'americas.api.riotgames.com',
    path:'/tft/match/v1/matches/by-puuid/' + puuid + '/ids?count=1&api_key=' + leagueKey,
    method: 'GET'
  };
  
  function getGamesOnResponse(res) {
    if(res.statusCode == 200) {
      res.on('data', function (chunk) {
        var gameId = JSON.parse(chunk)[0]
        if(mostRecentTFTGames[summonerName] != gameId) {
          oldMostRecentTFTGames[summonerName] = mostRecentTFTGames[summonerName];
          mostRecentTFTGames[summonerName] = gameId;

          if(oldMostRecentTFTGames[summonerName] != undefined) {
            getMostRecentTFTGame(gameId, summonerName, puuid);
          } else {
            console.log('TFT Skipping ' + summonerName + '. ' + mostRecentTFTGames[summonerName] + ' is the first game loaded.')
          }
        }
      });
    } else if(res.statusCode == 429) {
      botUtils.sleep(4000)
      tftilt(summonerName, puuid);
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
      console.log('failure for ' + puuid + ", summoner name: " + summonerName)
    }
  }

  botUtils.botRequest(options, getGamesOnResponse);
}

function getMostRecentTFTGame(gameId, summonerName, puuid) {
  var options;
  
  options = {
    hostname: 'americas.api.riotgames.com',
    path: '/tft/match/v1/matches/' + gameId + '?api_key=' + leagueKey,
    method: 'GET'
  };

  function getMostRecentTFTGameOnRespone(res) {
    if(res.statusCode == 200) {
        var stats = [];
        var data = [];
        res.on('data', function (chunk) {
          data.push(chunk);
        });
        res.on('end', function() {
          console.log('HERE2')
          var results = JSON.parse(data.join(''));
          if(results.info.queue_id != 1100) {
            mostRecentTFTGames[summonerName] = oldMostRecentTFTGames[summonerName];
          } else {
            var participants = results.info.participants;
            var participant = participants.filter(participant => {
              return participant.puuid == puuid;
            })
            var placement = participant[0].placement;
            if(placement > 4) {
              tilt(summonersByPUUID[puuid] + " is a " + nicknames[placement-1]);
            }
          }
        });
      }  else if(res.statusCode == 429) {
        botUtils.sleep(4000);
        getMostRecentTFTGame(gameId, summonerName, puuid);
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  }

  botUtils.botRequest(options, getMostRecentTFTGameOnRespone);
}

function tilt(tiltMessage) {
  var options, body;


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
        console.log('success');
      } else {
        console.log('failed sending ' + tiltMessage + ' to ' + botID);
        console.log('rejecting bad status code ' + res.statusCode);
      }
  }

  botUtils.botRequest(options, tiltOnResponse, body);
}

exports.initialize = initialize;
exports.run = run;
