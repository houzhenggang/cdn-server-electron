const path = require('path');
const electron = require('electron');
const server = require("./server/boot")
const {app, ipcMain, BrowserWindow, dialog, Tray, Menu, MenuItem} = electron;

if (handleSquirrelEvent()) {
  return;
}

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

global.dirname = __dirname
server.run(function(host){
  global.host = host;
})

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let mainWindow;
let exiting = false;
let shouldQuit = false;

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

  mainWindow.webContents.openDevTools();

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
        e.preventDefault()
        //mainWindow.show();
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
  //const exeName = path.basename("DotApp.exe");

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
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

