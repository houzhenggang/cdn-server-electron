var http = require('http');
var minimist = require('minimist')
var serverHandler = require('./lib/server');
var route = require('./lib/route');
var router = require('./lib/router');
var util = require('./lib/util');
var config = require('./config');

var localhost = "127.0.0.1:80";
var argv = minimist(process.argv.slice(2), {
    alias: {port: 'p'},
    "default": {
        port: config.DEFAULT_PORT
    }
});

var server = http.createServer(function(req, res){
    util.logger(req.url)
    var ip = this.address().address;
    if(ip == "::") ip = "localhost";
    localhost = ip + ":" + this.address().port;
    var host = req.headers.host, ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    switch(host){
        case "localhost":
        case "127.0.0.1":
        case "172.26.41.18":
        case localhost:
            router.runAction(req, res);
            break;
        case "dot.dwstatic.com":
        case "proxy-dot.dwstatic.com":
            serverHandler.http(req, res)
            break;
        default:
            serverHandler.proxy(req, res)
    }
})


module.exports.run = function(callback){
    server.listen(argv.port, function () {
        var ip = server.address().address;
        if(ip == "::") ip = "localhost";
        util.logger('cdn server running on port ' + server.address().port)
        util.logger('http://' + ip + ':' + server.address().port)
    })
    callback(localhost)
}
