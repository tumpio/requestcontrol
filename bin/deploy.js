const fs = require("fs");
const deploy = require("firefox-extension-deploy");

deploy({
    issuer: process.env.JWT_ISSUER,
    secret: process.env.JWT_SECRET,
    id: "{1b1e6108-2d88-4f0f-a338-01f9dbcccd6f}",
    version: process.env.VERSION,
    src: fs.createReadStream("./releases/request_control-" + process.env.VERSION + ".zip"),
});
