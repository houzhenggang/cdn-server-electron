const log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
      type: 'file', //文件输出
      filename: './log/info.log', 
      category: 'debug',
      maxLogSize: 1024,
      replaceConsole: true,  
      levels: { "debug": "DEBUG"}
    },
    {
      type: 'file', //文件输出
      filename: './log/error.log', 
      category: 'error',
      maxLogSize: 1024,
      replaceConsole: true,  
      levels: { "error": "ERROR"}
    }
  ]
});

module.exports.debug = log4js.getLogger('debug');
module.exports.error = log4js.getLogger('error');
