var fs = require("fs")
var url = require("url")
var util = require('./util');
var ram = require('./ram');
var config = require('../config');

module.exports.handler = function(proxyRes, req, res, options){
    try{
        module.exports.process(req.url, proxyRes, res)
    }catch(e){
        util.error(e)
    }
}

module.exports.process = function(link, response, res, cb){
    var id = util.md5(url.parse(link).path)
    var size = 0;
    var fd = null;
    var first = false;
    if(!cb) cb = function(){}
    if(!util.isVideo(response.headers["content-type"])){
        return cb;
    }

    var mateDataSize = config.MATEDATA_DEFAULT_SIZE;
    var cacheFile = ram.create(id, { 
        link: link,
        cacheFile: ram.getFilePath(id),
        tempFile: ram.getTempFilePath(id),
        length: util.getLength(response.headers),
        cacheLength: 0,
        mateDataSize: mateDataSize,
        createTime: new Date().getTime(),
    })

    if(!cacheFile || !cacheFile.id) return
    try{
        response.on('data',function(chunk){
            var start = util.getRangeStart(response.headers["content-range"])
            if(start == 0){
                if(first == false){
                    first = true
                    mateDataSize = util.getMateDataSize(chunk) + config.MATEDATA_OVER_SIZE
                    cacheFile.setMateDataSize(mateDataSize)
                }
                if(size <= mateDataSize){
                    if(fd == null)  fd = fs.openSync(cacheFile.getTempFile(), "w+")
                    fs.writeSync(fd, new Buffer(chunk), 0, chunk.length, size);
                    size += chunk.length;
                }else{
                    cacheFile.setCacheLength(size)
                    cacheFile.setStatus(9)
                    try{
                        cacheFile.rename(cacheFile.getTempFile(), cacheFile.getCacheFile())
                        ram.add(cacheFile)
                        fd = closeFd(fd)
                        cb()
                    }catch(e){
                        util.error(e)
                    }
                }
            }

            res.on("close", function(){
                fd = closeFd(fd)
                cb()
            });
        })
    }catch(e){
        cacheFile.destroy()
        fd = closeFd(fd)
        ram.delete(id)
        util.error(e)
        cacheFile = null
        cb()
    }
}

function closeFd(fd){
    if(fd != null){
        fs.closeSync(fd);
    }
    return null
}