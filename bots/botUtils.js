var HTTPS               = require('https');
var fs                  = require('fs');
var leagueKey           = process.env.LEAGUE_KEY;
var accountInfoDumps    = [];

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

async function botRequest(httpInfo, onResponse, body) {
  var botReq;
  
  return new Promise((resolve, reject) => {
    botReq = HTTPS.request(httpInfo, async function(res) {
      await onResponse(res);
      resolve();
    });

    botReq.on('error', function(err) {
      console.log('error posting message '  + JSON.stringify(err));
    });
    botReq.on('timeout', function(err) {
      console.log('timeout posting message '  + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
  });
}

async function loadSummonerCache() {
    console.log("Loading Summoner Cache")
    await parseSummoners("./Resources/summoners.txt")
    console.log("Summoner Cache Loadding Complete")
    return;
}

async function parseSummoners(filename) {
  var data = ""
  data = fs.readFileSync(filename)
  var lines = data.toString().split('\n');
  for(var i = 0; i < lines.length; i++){
    if(lines[i] != '')
    await getAccountId(lines[i]);
  }
  return;
}

async function getAccountId(summonerName) {
  var options;

  options = {
    hostname: 'na1.api.riotgames.com',
    path: '/lol/summoner/v4/summoners/by-name/' + summonerName + '?api_key=' + leagueKey,
    method: 'GET'
  };
  
  async function getAccountIdOnResponse(res) {
    if(res.statusCode == 200) {
      await res.on('data', function (chunk) {
        accountInfoDumps[summonerName] = JSON.parse(chunk)
      });
    } else if(res.statusCode == 429) {
      sleep(4000)
      getAccountId(summonerName);
    } else {
      console.log('rejecting bad status code ' + res.statusCode);
    }
  
    return;
  }

  return await botRequest(options, getAccountIdOnResponse);
}

exports.botRequest = botRequest;
exports.sleep = sleep;
exports.loadSummonerCache = loadSummonerCache;
exports.accountInfoDumps = accountInfoDumps;