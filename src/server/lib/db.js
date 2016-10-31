var Datastore = require('nedb')
var path = require('path');
var util = require('./util');
var dbPath = path.join(util.getHomePath(),  'Databases');

db = {};
db.setting = new Datastore({ filename: path.join(dbPath, 'setting.db'), timestampData:true});
db.video = new Datastore({ filename: path.join(dbPath, 'video.db'), timestampData:true});

// You need to load each database (here we do it asynchronously)
db.setting.loadDatabase();
db.video.loadDatabase();

module.exports = db;