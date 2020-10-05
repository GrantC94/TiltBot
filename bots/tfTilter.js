var botUtils;

botUtils            = require('./botUtils.js');


function initialize(enabled) {
  if(!enabled) {
    console.log("TFTilter Disabled.")
  } else {
    console.log("Initializing TFTilter")
    run();
  }
}

function run(enabled) {
  for (var accountInfo in botUtils.accountInfoDumps) {
    console.log("Prepping to TFTilt " + botUtils.accountInfoDumps[accountInfo].puuid);
    //tftilt(accountID)
  }
}

exports.initialize = initialize;
exports.run = run;
