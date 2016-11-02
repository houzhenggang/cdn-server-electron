var url = require("url");            //解析GET请求  
var query = require("querystring");    //解析POST请求
var getBody = require('raw-body');
var logger = require('./log');

var router = {};
router.GET = {};
router.POST = {};

router.runAction = function(req, res){
    try{
        var method = req.method;
        res.jsonOutput = function(data){
            res.writeHead(200, {
                'Content-Type': 'application/json',
            });
            res.end(JSON.stringify(data));
        }
        var path = url.parse(req.url, true).pathname;
        if(typeof router[method][path] == "function"){
            parseParam(req, function(params){
                params.get = function(key, defaultValue){
                    return params[key] !== undefined ? params[key] : defaultValue
                }
                router[method][path](req, res, params);
            })
        }else{
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end();
        }
    }catch(e){
        res.writeHead(504, {'Content-Type': 'text/html'});
        res.end();
    }
}

router.get = function(path, handler){
    this.GET[path] = handler;
} 
router.post = function(path, handler){
    this.POST[path] = handler;
} 

function parseParam(req, callback){
    try{
        if(req.method == "GET"){
            var params = [];
            req.params = url.parse(req.url,true).query;
            callback(req.params)
        }else{
            getBody(req, {
                limit: '1mb',
                length: req.headers['content-length'],
                encoding: 'utf8',
            }, function(err, buf){
                req.params = buf.length ? query.parse(buf): {};
                callback(req.params);
            })
        }
    }catch(e){
        callback({})
    }
}

module.exports = router;