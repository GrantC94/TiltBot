var HTTPS = require('https');
var fs = require('fs');
var botID = process.env.BOT_ID;
var leagueKey = process.env.LEAGUE_KEY;
var mostRecentGames = [];

function initialize(firstRun) {
  checkGames(firstRun);
}

function postMessage(message, firstRun) {
  var options, body, botReq;

  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/summoner/v4/summoners/by-name/' + message + '?api_key=' + leagueKey,
    method: 'GET'
  };
  console.log(message)
  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 200) {
        res.on('data', function (chunk) {
          getGames(JSON.parse(chunk).accountId, message, firstRun);
        });
      } else if(res.statusCode == 429) {
        sleep(4000)
        postMessage(message, firstRun);
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function getGames(message, summonerName, firstRun) {
  var botResponse, options, body, botReq;

  botResponse = message;
  
  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/match/v4/matchlists/by-account/' + message + '?queue=420&queue=440&queue=700&endIndex=1&beginIndex=0&api_key=' + leagueKey,
    method: 'GET'
  };

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 200) {
        res.on('data', function (chunk) {
          //console.log('BODY: ' + chunk);
          var gameId = JSON.parse(chunk).matches[0].gameId
          if(mostRecentGames[summonerName] != gameId) {
            console.log('Updating ' + summonerName + ' latest game to GameID ' + gameId)
            mostRecentGames[summonerName] = gameId;
            getMostRecentGame(gameId, message, firstRun);
          }
        });
      } else if(res.statusCode == 429) {
        sleep(4000)
        getGames(message, summonerName, firstRun);
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function getMostRecentGame(message, accountId, firstRun) {
  var options, body, botReq;
  
  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/match/v4/matches/' + message + '?api_key=' + leagueKey,
    method: 'GET'
  };

  botReq = HTTPS.request(options, function(res) {
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
              //console.log(result.participantIdentities[i]);
              if(result.participantIdentities[i].player.accountId == accountId) {
                participantId = result.participantIdentities[i].participantId
                stats[0] = result.participantIdentities[i].player.summonerName
              }
          }
          for (var i = 0; i < result.participants.length; i++) {
              //console.log(result.participantIdentities[i]);
              if(result.participants[i].participantId == participantId) {
                stats[1] = result.participants[i].stats.win
                stats[2] = result.participants[i].stats.kills
                stats[3] = result.participants[i].stats.deaths
                stats[4] = result.participants[i].stats.assists
              }
          }
          if(!stats[1] && !firstRun) {
            tilt(stats)
          } else {
            console.log(stats[0] + ' Winned') 
          }
        });
      }  else if(res.statusCode == 429) {
        sleep(4000)
        getMostRecentGame(message, accountId);
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function tilt(stats) {
  var botResponse, options, body, botReq;

  botResponse = 'Yikes! ' + stats[0] + ' just lost a League game! They went ' + stats[2] + '/' + stats[3] + '/' + stats[4] + '! That\'s a tilter!';

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };
  
  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function sendEachLine(filename, firstRun) {
  var data = ""
  fs.readFile(filename, function(err, data){
    if(err) throw err;
    var lines = data.toString().split('\n');
    for(var i = 0; i < lines.length; i++){
      if(lines[i] != '')
      postMessage(lines[i], firstRun);
      sleep(2000)
    }
 })
}

function checkGames(firstRun) {
  console.log(process.cwd())
  sendEachLine("./Resources/summoners.txt", firstRun)
}

exports.initialize = initialize;
