var HTTPS               = require('https');
var fs                  = require('fs');
var leagueKey           = process.env.LEAGUE_KEY;
var tftKey              = process.env.TFT_KEY;
var leagueAccountInfo   = [];
var tftAccountInfo      = [];

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
    await getAccountId(lines[i], leagueAccountInfo, leagueKey, '/lol/summoner/v4/summoners/by-name/', false);
    await getAccountId(lines[i], tftAccountInfo, tftKey, '/tft/summoner/v1/summoners/by-name/', true);
  }
  return;
}

async function getAccountId(summonerName, accountInfo, apiKey, pathPrefix, doFilter) {
  var options;

  var filteredSummonerName =  doFilter ? summonerName.replace(/%20/g, "") : summonerName

  options = {
    hostname: 'na1.api.riotgames.com',
    path: pathPrefix + filteredSummonerName  + '?api_key=' + apiKey,
    method: 'GET'
  }

  async function getAccountIdOnResponse(res) {
    if(res.statusCode == 200) {
      await res.on('data', function (chunk) {
        accountInfo[summonerName] = JSON.parse(chunk)
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

function respond() {
  var test = this.req.chunks[0];
  var request = JSON.parse(this.req.chunks[0]),
  botRegex = /^!tilt/i;
  console.log(test)
  console.log(request)

}

exports.respond = respond;
exports.botRequest = botRequest;
exports.sleep = sleep;
exports.loadSummonerCache = loadSummonerCache;
exports.leagueAccountInfo = leagueAccountInfo;
exports.tftAccountInfo = tftAccountInfo;