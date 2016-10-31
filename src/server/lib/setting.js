var Datastore = require('nedb')
var db = require('./db').setting;

function Setting(options){
    options = typeof options == "object" ? options : {};
    var self = {
        id: options.id || "",
        content:  options.content || "",
    };
    return self;
}

module.exports.create = function(options, callback){
    callback = callback || function(){}
    var item = new Setting(options);
    db.insert(item, function(err, data){
        callback(data)
    })
}

module.exports.get = function(id, callback){
    callback = callback || function(){}
    db.findOne({ id: id }, function (err, data) {
        callback(data ? data.content : null);
    });
}

module.exports.set = function(id, content, callback){
    callback = callback || function(){}
    db.update({ id: id }, { $set: { content: content } }, {upsert: true, returnUpdatedDocs: true}, function (err, num, affectedDocuments) {
        callback(affectedDocuments)
    });
}

