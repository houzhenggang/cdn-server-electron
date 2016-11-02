var http = require('http');
var url = require('url');
var request = require('request');
var httpProxy = require('http-proxy');
var rangeParser = require('range-parser')
var pump = require('pump')
var util = require('./util');
var ram = require('./ram');
var task = require('./task');
var proxyHandler = require('./proxy');
var config = require('../config');

var proxy = httpProxy.createProxyServer({});
proxy.on('proxyRes', proxyHandler.handler)
task.runClear(24 * 3 * 3600 * 1000, 3600 * 1000); //过期时间三天
task.runUpdate({pageSize: 10, create_time:  parseInt(util.getYesterdayTime() / 1000)})
task.runUpdateTimer({page: 1, pageSize: 100}, 3600 * 1000)
task.runQueue(2)


function onProxy(req, res){
    var host = req.headers.host, ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    proxy.web(req, res, { target: 'http://' + host });
    util.logger("From the remote data") 
}

function onHttp(req, res){
    var link = config.REMOTE_IP + req.url
    pump(request({
        url: link,
        headers:{
            'Range': req.headers['range'],
            "Host": config.REMOTE_HOST.replace("http://", ""),
        }
    }).on("response", function(response){
        if(!response.headers["content-range"]) {
            var length = response.headers["content-length"];
            response.headers["content-range"] = "bytes 0-" + length + "/" + length
        }
        proxyHandler.process(req.url, response, res)
    }), res)
    util.logger(req.url + " From the remote data") 
}

function handler(link, req, res, onRemote){
    if (req.headers.origin) res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    var id = util.md5(url.parse(link).path)
    ram.get(id, function(cacheFile){
        var end = false;
        if(!cacheFile || cacheFile.status!=9) return onRemote(req, res)
        try{
            util.stat(cacheFile.getCacheFile(), function(file){
                if(file == null){
                    ram.delete(id)
                    return onRemote(req, res)
                }else{
                    var range = req.headers.range && rangeParser(cacheFile.length, req.headers.range)[0]
                    if(range && (range.start > cacheFile.mateDataSize || range.start > file.length )){
                        return onRemote(req, res)
                    }else{
                        if (!range) range = {start:0, end:cacheFile.cacheLength}
                        res.statusCode = 206
                        res.setHeader('Accept-Ranges', 'bytes')
                        res.setHeader('Content-Type', 'video/mp4')
                        if(req.headers['user-agent'] && req.headers['user-agent'].indexOf("Firefox") != -1){
                            res.setHeader('Content-Length', cacheFile.length - range.start + 1)
                            res.setHeader('Content-Range', 'bytes ' + range.start + '-' + cacheFile.length + '/' + cacheFile.length)
                        }else{
                            res.setHeader('Content-Length', cacheFile.cacheLength - range.start + 1)
                            res.setHeader('Content-Range', 'bytes ' + range.start + '-' + cacheFile.cacheLength + '/' + cacheFile.length)
                        }

                        var size = 0;
                        var chunks = []
                        file.createReadStream(range).on("data", function(chunk){
                            size += chunk.length
                            res.write(chunk)
                            if(size >= cacheFile.cacheLength){
                                request({
                                    url: link,
                                    headers:{'Range': 'bytes='+(cacheFile.cacheLength)+'-'}
                                }).on("response", function(response){
                                    response.on("data", function(nextChunk){
                                        res.write(nextChunk)
                                        if(end){
                                            response.emit("end");
                                        }
                                    })
                                }).on("error", function(error){
                                    res.end();
                                })
                            }
                        })
                        util.logger(link + " From the local cache")
                    }
                } 
            })
        res.on("close", function(){
            end = true
        });
        }catch(e){
            res.end()
            util.error(e)
        }
    });
}

module.exports.http = function(req, res){
    var link = config.REMOTE_HOST + req.url 
    handler(link, req, res, onHttp)
}

module.exports.proxy = function(req, res){
    handler(req.url, req, res, onHttp)
}
