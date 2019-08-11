// Electron.js
const { app, BrowserWindow, ipcMain } = require('electron');

// Obj.js
const Obj = require('@jenselg/obj.js');
let options = { name: 'data', path: app.getPath('userData') };
let data = new Obj(options);

// Initialize data objects
data.config ? true : data.config = {}
data.store ? true : data.store = {}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: data.config.width ? data.config.width : data.config.width = 800,
    height: data.config.height ? data.config.height : data.config.height = 600,
    webPreferences: { nodeIntegration: true }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC events

// arg = {key: '', value ''}
ipcMain.on('write', (e, arg) =>
{
  data.store[arg.key] = arg.value
  mainWindow.webContents.send('data', data.store[arg.key])
})

// arg = key
ipcMain.on('read', (e, arg) =>
{
  mainWindow.webContents.send('data', data.store[arg])
})
