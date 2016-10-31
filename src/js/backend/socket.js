var socket = require('socket.io-client')('http://127.0.0.1:' + process.env.APP_SOCKET_PORT);

export default socket;
 