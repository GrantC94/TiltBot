var http, director, bot, router, server, port, tiltBotEnable, tfTilterEnabletfTilter;

http            = require('http');
https           = require('https');
director        = require('director');
botUtils        = require('./botUtils');
tiltBot         = require('./tiltBot.js');
tfTilter        = require('./tfTilter.js');
tfTilterEnable  = process.env.TFTILTER_ENABLE == 'true'
tiltBotEnable   = process.env.TILTBOT_ENABLE == 'true'
//Eighth Place Andy

router = new director.http.Router({
  '/' : {
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);

initializeBots();

//These pings keep the Heroku app awake
https.get("https://tiltbot2.herokuapp.com/");
setInterval(function() {
    https.get("https://tiltbot2.herokuapp.com/");
}, 300000);

setInterval(function() {
  tiltBot.run(tiltBotEnable)
}, 600000)

setInterval(function() {
  tfTilter.run(tfTilterEnable)
}, 600000)

function ping() {
  this.res.writeHead(200);
  this.res.end("Hey, I'm Cool Guy.");
}

async function initializeBots() {
  await botUtils.loadSummonerCache();
  tiltBot.initialize(tiltBotEnable);
  tfTilter.initialize(tfTilterEnable);
  return;
}
