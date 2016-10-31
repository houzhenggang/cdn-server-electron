const log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
      type: 'file', //文件输出
      filename: 'log.log', 
      category: 'logDebug',
      replaceConsole: true,  
      levels: { "logDebug": "DEBUG", "logInfo": "DEBUG", "logWarn": "DEBUG", "logErr": "DEBUG"}
    }
  ]
});

module.exports = log4js.getLogger("logDebug");
