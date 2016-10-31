var fs = require('fs');
var util = require('./util');
var setting = require('./setting');
var db = require('./db').video;
var config = require('../config');

var RAM = {}
var _path = util.getDefaultPath()

module.exports.get = function(id, callback){
    callback = callback || function(){}
    db.findOne({ id: id }, function (err, data) {
        if(data){
            callback(module.exports.bind(data));
        }else{
            callback(null)
        }
    });
}

module.exports.create = function(id, data, callback){
    var obj = Object.assign({
        id: id,
        link: "",
        path: "",
        length: 0,
        cacheLength: 0,
        mateDataSize: 0,
        createTime: 0,
        status: 0,
    }, data);
    return module.exports.bind(obj)
}

module.exports.bind = function(obj){
    obj = obj || {}
    obj.setMateDataSize = function(size){
        this.mateDataSize = size
    }
    obj.getCacheFile = function(){
        return this.cacheFile
    }
    obj.getTempFile = function(){
        return this.tempFile
    }
    obj.setCacheLength = function(size){ 
        this.cacheLength = size;
    }
    obj.destroy = function(){
        util.logger("Unlink: " + this.getCacheFile())
        util.unlink(this.getCacheFile())
        util.unlink(this.getTempFile())
    }
    obj.setStatus = function(status){
        this.status = status
    }
    obj.rename = function(oldPath, newPath){
        fs.renameSync(oldPath, newPath)
    }
    obj.save = function(callback){
        module.exports.update(this.id, this)
    }
    return obj;
}



module.exports.getCacheSuffix = function(){
    return "_cache"
}

module.exports.getTempSuffix = function(){
    return "_temp"
}

module.exports.getPath = function(){
    util.mkdirsSync(_path)
    return _path
}

module.exports.setPath = function(path){
    _path = path + "\\"
}

module.exports.getFilePath = function(id){
    return module.exports.getPath() + id + "." + module.exports.getCacheSuffix()
}

module.exports.getTempFilePath = function(id){
    return module.exports.getFilePath(id) + new Date().getTime() + "." + module.exports.getTempSuffix()
}

module.exports.add = function(obj, callback){
    callback = callback || function(){}
    module.exports.get(obj.id, function(item){
        if(item){
            db.update({ id: obj.id }, { $set: obj }, {returnUpdatedDocs: true}, function (err, num, affectedDocuments) {
                callback(affectedDocuments)
            });
        }else{
            db.insert(obj, function(err, data){
                callback(data)
            })
        }
    })
}

module.exports.delete = function(id){
    util.logger("Delete: " + id)
    db.remove({ id: id }, {}, function (err, numRemoved) {
        if(err) util.logger(err)
    });
}

module.exports.update = function(id, obj, callback){
    callback = callback || function(){}
    db.update({ id: id }, { $set: obj }, {returnUpdatedDocs: true}, function (err, num, affectedDocuments) {
        callback(affectedDocuments)
    });
}

module.exports.clear = function(overTime){
    db.find({createTime: {$lt: new Date().getTime()-overTime}}, function (err, docs) {
        for(key in docs){
            var item = module.exports.bind(docs[key])
            item.destroy()
            module.exports.delete(item.id)
        }
    })
}

module.exports.clearLoss = function(overTime){
    var path = module.exports.getPath()
    fs.readdir(path, function(err, files){
        util.logger(files)
        if(err){
            util.error("ReadDir Error: " + err)
        }else{
            files.forEach(function(file){
                if(file.lastIndexOf(module.exports.getCacheSuffix()) != -1 || file.lastIndexOf(module.exports.getTempSuffix()) != -1){
                    fs.stat(path + '/' + file, function(err, stat){
                        if(err) return util.error("ReadFile Error: " + err)
                        if(!stat.isDirectory()){  
                            var ctime = new Date(stat.ctime).getTime();
                            if(new Date().getTime()-overTime > ctime){
                                util.unlink(path + '/' + file);
                            }
                        }               
                    });
                }
            })
        }
    })
}

function init(){
    setting.get("file-save-path", function(path){
        if(path){
            module.exports.setPath(path);
        }
    })
}

init()