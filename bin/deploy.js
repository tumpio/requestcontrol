const fs = require("fs");
const deploy = require("firefox-extension-deploy");
const manifest = require('../manifest.json');

deploy({
    issuer: process.env.JWT_ISSUER,
    secret: process.env.JWT_SECRET,
    id: manifest.applications.gecko.id,
    version: manifest.version,
    src: fs.createReadStream(".releases/request_control-" + manifest.version+ ".zip"),
}).then(function() {
    console.log("Deployed to AMO!");
}, function(err) {
    console.error("Failed to deploy to AMO!", err);
});
