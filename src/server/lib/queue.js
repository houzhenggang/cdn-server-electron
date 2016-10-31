var util = require('./util');

var list = []

module.exports.add = function(item){
    list.push(item)
}

module.exports.adds = function(data){
    for(key in data){
        module.exports.add(data[key])
    }
}

module.exports.next = function(){
    if(list.length > 0){
        return list.shift()
    }
    return null;
}

module.exports.run = function(callback, i){
    var item = module.exports.next();
    if(item !== null){
        callback(item, this, i)
    }else{
        module.exports.runNext(callback, i)
    }
}

module.exports.runNext = function(callback, i){
    setTimeout(function(){
        module.exports.run(callback, i)
    }, 1000 * 10)
}

module.exports.start = function(num, callback){
    for (var i = 0; i < num; i++) {
        module.exports.run(callback, i)
    };
}