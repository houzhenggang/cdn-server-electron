var config = {}

config.APP_NAME = 'Hozz';
config.APP_VERSION = '0.1.2';
config.APP_RELEASES_URL = `https://api.github.com/repos/ppoffice/${ config.APP_NAME }/releases`;
config.MATEDATA_SAVE_DIR = "D:\\cdn-server\\"
config.MATEDATA_DEFAULT_SIZE = 1024 * 1024 * 10
config.MATEDATA_OVER_SIZE = 1024 * 1024 * 3 
config.DEFAULT_PORT = 80 
config.REMOTE_HOST = "http://dot.dwstatic.com" 
config.REMOTE_IP = "http://115.231.33.196" 
config.VIDEO_HOST = "http://video-dot.webdev.duowan.com/frontend/index.php" 

module.exports = config