const path = require('path');
const electron = require('electron');
const minimist = require('minimist')
const server = require("./server/boot")
const config = require('./server/config');
const autoUpdater = require('./auto-updater')
const {app, ipcMain, BrowserWindow, dialog, Tray, Menu, MenuItem} = electron;

var argv = minimist(process.argv.slice(2), {
    alias: {debug: 'd', port: 'p'},
    "default": {
        debug: false,
        port: config.DEFAULT_PORT,
    }
});

/*if (handleSquirrelEvent()) {
  return;
}*/

var shouldStartInstance = app.makeSingleInstance(function(commandLine, workingDirectory) {
    if (mainWindow) {
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
    return true;
});

if (shouldStartInstance) {
    quit();
    return;
}

server.run(argv.port, function(host){
  global.host = host;
})

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let mainWindow;
let exiting = false;
let shouldQuit = false;

global.appRootDir = __dirname
global.updateStatus = (function () {
    let status = '';
    return {
        get () {
            return status;
        },

        set (value) {
            status = value;
        }
    };
})();

global.terminate = function () {
    shouldQuit = true;
    quit();
};

function quit(){
    exiting = true;
    app.quit();
}

function createWindow() {
  // 创建浏览器窗口。
  mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        //transparent: true,
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  if(argv.debug){
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  createTray();
}

function createTray(){
   const appIcon = new Tray(path.join(__dirname, './assets/images/icon.png'));
    var trayMenu = new Menu()
    trayMenu.append(new MenuItem({
      label: '显示',
      click: function () {
        if(!exiting){
            mainWindow.show();
        }else{
            dialog.showErrorBox('错误', '应用正在退出.')
        }
      }
    }))
    trayMenu.append(new MenuItem({
      label: '隐藏',
      click: function () {
        mainWindow.hide();
      }
    }))
    trayMenu.append(new MenuItem({
      label: '退出',
      click: function () {
          quit();
      }
    }));
    trayMenu.append(new MenuItem({
      label: '强制退出',
      click: function () {
          app.exit(0)
      }
    }));
    appIcon.setContextMenu(trayMenu)
    appIcon.on('click', function (e) {
        //mainWindow.show();
        e.preventDefault()
        appIcon.popUpContextMenu(trayMenu)
    })

}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('open-file-dialog', function (event, channel) {
    dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory']
    }, function (files) {
        if (files) event.sender.send(channel, files)
    })
});

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };
  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName]);
      setTimeout(app.quit, 1000);
      return true;
    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName]);
      setTimeout(app.quit, 1000);
      return true;
    case '--squirrel-firstrun':
      break;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};
//autoUpdater.checkUpdate(function () { app.quit() })
//require('./server/lib/util').logger(process.argv[1])
// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(function () { app.quit() })
    break
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(function () { app.quit() })
    break
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit()
    break
  default:
    //initialize()
}
