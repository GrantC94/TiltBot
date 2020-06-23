var http, director, cool, bot, router, server, port, tiltBotEnable;

http            = require('http');
https           = require('https');
director        = require('director');
cool            = require('cool-ascii-faces');
tiltBot         = require('./tiltBot.js');
tiltBotEnable   = process.env.TILTBOT_ENABLE

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

if(tiltBotEnable) {
  tiltBot.initialize();
}

//These pings keep the Heroku app awake
https.get("https://tiltbot2.herokuapp.com/");
setInterval(function() {
    https.get("https://tiltbot2.herokuapp.com/");
}, 300000);

setInterval(function() {
  if(tiltBotEnable)
  tiltBot.run()
}, 600000)

function ping() {
  this.res.writeHead(200);
  this.res.end("Hey, I'm Cool Guy.");
}
