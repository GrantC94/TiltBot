var http, director, cool, bot, router, server, port;

http        = require('http');
https       = require('https');
director    = require('director');
cool        = require('cool-ascii-faces');
bot         = require('./bot.js');

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
bot.checkGamesInitialize();
https.get("https://tiltbot2.herokuapp.com/");
setInterval(function() {
    https.get("https://tiltbot2.herokuapp.com/");
}, 300000);
setInterval(function() {
  bot.initialize()
}, 600000)

function ping() {
  this.res.writeHead(200);
  this.res.end("Hey, I'm Cool Guy.");
}
