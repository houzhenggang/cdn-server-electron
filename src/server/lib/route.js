var request = require('request')
var path = require('path')
var ram = require("./ram");
var setting = require("./setting");
var util = require("./util");
var route = require("./router");
var proxyHandler = require('./proxy');
var task = require('./task');

route.get("/clear", function(req, res){
    var overtime = req.params.get("overtime", 24 * 3600)
    ram.clear(overtime * 1000)
    res.jsonOutput({
        "message": "clear success!",
        "overtime": overtime + "s",
    });
});

route.get("/preload", function(req, res){ 
    var ret = {"message": "preload fail!"}
    var link = req.params.get("link")
    if(link){
        task.preload(link, res, function(error){
            if(error){
                ret.message = error
                res.jsonOutput(ret);
            }else{
                res.jsonOutput({
                    "message": "Success",
                    "link": link,
                });
            }
        })
    }else{
        res.jsonOutput(ret);
    }
});

route.get("/getFileSavePath", function(req, res){
    setting.get("file-save-path", function(value){
        var _path = "";
        if(value) _path = value;
        if(!_path) _path = util.getDefaultPath();
        res.jsonOutput({"status": 1, "path": _path});
    });
});

route.get("/setFileSavePath", function(req, res){
    setting.set("file-save-path", req.params.value, function(data){
        if(data.content){
            ram.setPath(data.content);
            res.jsonOutput({"status": 1, "path": data.content});
        }else{
            res.jsonOutput({"status": -1});
        }
    });
});

route.get("/getSetting", function(req, res){
    setting.get(req.params.key, function(value){
        res.jsonOutput({"status": 1, "value": value});
    });
});

route.get("/setSetting", function(req, res){
    setting.set(req.params.key, req.params.value);
    res.jsonOutput({"status": 1});
});

route.get("/test", function(req, res){ 
    res.statusCode = 206
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', 'video/mp4')
    var link = req.params.get("link")
    if(link){
        //require("pump")(request(link), res)
        /*request({
            url: link,
            headers:{'Range': req.headers['range']}
        }).pipe(res)  //res.setHeader('Accept-Ranges', 'bytes') 和 res.setHeader('Content-Type', 'video/mp4')*/
        request({
            url: link,
            headers:{'Range': req.headers['range']}
        }).on("response", function(response){
            //console.info(response.headers)
            res.setHeader('content-length', response.headers["content-length"])
            if(response.headers["content-range"]){
                res.setHeader('content-range', response.headers["content-range"])
            }
            response.on("data", function(chunk){
                res.write(chunk)
            })
        }).on('error', function(err) {
            console.log("ERROR", err)
            res.end()
        })
    }
});


