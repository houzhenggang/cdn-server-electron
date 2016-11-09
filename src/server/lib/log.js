const fs = require("fs")
const log4js = require('log4js');
const dir = "D:\\cdn-server\\log"//"./log"

mkLogdir()
log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
      type: 'file', //文件输出
      filename: dir + '/info.log', 
      category: 'debug',
      maxLogSize: 1024 * 1024 * 100,
      replaceConsole: true,  
      levels: { "debug": "DEBUG"}
    },
    {
      type: 'file', //文件输出
      filename: dir + '/error.log', 
      category: 'error',
      maxLogSize: 1024 * 1024 * 100,
      replaceConsole: true,  
      levels: { "error": "ERROR"}
    }
  ]
});


function mkLogdir(){
  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
};

module.exports.debug = log4js.getLogger('debug');
module.exports.error = log4js.getLogger('error');

