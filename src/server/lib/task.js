var request = require('request');
var events = require('events');
var url = require('url');
var config = require('../config');
var util = require('./util');
var queue = require('./queue');
var ram = require('./ram');
var proxyHandler = require('./proxy');

var updateing = false;
module.exports.update = function(option, callback){
    if(!callback) callback = function(){}
    option = Object.assign({
        r: "video/list",
        channel: "",
        page: 1,
        pageSize: 100,
    }, option)
    request({url:config.VIDEO_HOST, qs:option}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            queue.adds(data.data)
            callback(null, data)
        }
    })
}

module.exports.runUpdateTimer = function(option, time){
    setInterval(function(){
        if(!updateing){
            module.exports.runUpdate(option)
        }
    }, time);
}

module.exports.runUpdate = function(option){
    updateing = true
    option = Object.assign({
        page: 1,
        pageSize: 100,
    }, option)
    module.exports.update(option, function(error, data){
        if(data.data.length >= option.pageSize){
            option.page++;
            module.exports.runUpdate(option);
        }else{
            updateing = false;
        }
    })

}

module.exports.runQueue = function(taskNum){
    queue.start(taskNum, module.exports.runTask)
}

module.exports.runTask = function(task, worker, i){
    var link = config.REMOTE_HOST + "/" + task.video_name
    var id = util.md5(url.parse(link).path)
    ram.get(id, function(item){
        if(item == null){
            util.logger("Add cache: " + link)
            module.exports.preload(link, new events.EventEmitter(), function(err){
                if(err) util.error(err)
                worker.run(module.exports.runTask, i);
            })
        }else{
            worker.run(module.exports.runTask, i);
        }
    })
}

module.exports.preload = function(link, res, callback){
    try{
        var ipLink = link.replace(config.REMOTE_HOST, config.REMOTE_IP)
        request({
            url: ipLink,
            headers:{
                "Host": config.REMOTE_HOST.replace("http://", ""),
            }
        }).on("response", function(response){
            var stream = this;
            var code = response.statusCode;
            if(code == 200 || code == 206){
                try{
                    var length = response.headers["content-length"];
                    response.headers["content-range"] = "bytes 0-" + length + "/" + length
                    proxyHandler.process(link, response, res, function(){
                        stream.abort()
                        callback(null)
                    })
                }catch(e){
                    callback(e)
                }
            }else{
                callback(link + " " + code + " " + response.statusMessage);
            }
        })
    }catch(e){
        util.error(e)
    }
}

module.exports.runClear = function(overTime, interval){
    try{
        setInterval(function(){
            ram.clear(overTime, function(){
                ram.clearLoss(overTime)
            })
        }, interval);
    }catch(e){
        util.error(e)
    }
}