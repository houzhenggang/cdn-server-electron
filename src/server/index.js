const minimist = require('minimist')
const server = require("./boot")
const config = require("./config")

var argv = minimist(process.argv.slice(2), {
    alias: {port: 'p'},
    "default": {
        port: config.DEFAULT_PORT,
    }
});

server.run(argv.port)