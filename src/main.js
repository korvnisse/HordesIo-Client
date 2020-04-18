import { handleSquirrelEvent } from './squirrelInstall'

const { app, autoUpdater, BrowserView, BrowserWindow, screen } = require('electron')
const path = require('path');
const url = require('url');
const fs = require('fs');
const server = 'https://update.electronjs.org'
const feed = `${server}/korvnisse/HordesIo-Client/${process.platform}/${app.getVersion()}`
var win;


//Squirrel installation events
if (require('electron-squirrel-startup')) app.quit();
if (handleSquirrelEvent()) {
    app.quit();
}

//Check for updates
function update() {
    autoUpdater.setFeedURL(feed);

    fs.access(path.resolve(path.dirname(process.execPath), '..', 'update.exe'), fs.F_OK, (err) => {
        if (err) {
            console.error("Update.exe not found, Either in dev mode or file is missing.")
            return
        }

        autoUpdater.checkForUpdates();

        autoUpdater.on('update-available', () => {
            win.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Downloading new version..."');
        });

        autoUpdater.on('update-not-available', () => {
            win.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Latest version already!"');
            setTimeout(function() { win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = ""'); }, 5000);
        });

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
            win.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Client version v.' + releaseName + '  Restart to apply changes"');
        });


    });
};


function createWindow() {
    //splashscreen
    var load = new BrowserWindow({
        width: 605,
        height: 605,
        useContentSize: true,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    load.loadURL(url.format({
        pathname: path.join(__dirname, 'assets/splashscreen.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Outer window
    win = new BrowserWindow({
        width: 805,
        height: 720,
        useContentSize: true,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'client.html'),
        protocol: 'file:',
        slashes: true
    }));

    //Load and attach new BrowserView to outer window
    let view = new BrowserView;
    win.setBrowserView(view);
    view.setAutoResize({
        width: true,
        height: true
    });

    view.setBounds({
        x: 0,
        y: 32,
        width: win.getContentBounds()['width'],
        height: win.getContentBounds()['height'] - 32
    });

    //Load HordesIO URL in BrowserView
    view.webContents.loadURL('https://hordes.io/', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
    });

    //hide splashscreen + show main window
    view.webContents.on('did-finish-load', () => {
        view.webContents.insertCSS('::-webkit-scrollbar {width: 0px;}');
        win.show();
        load.hide();
    });

    //maximize on game login
    view.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (message == "Connecting to game server") {
            //Frameless window .isMaximized(); never true. Cant "unMaximize" 2year old bug
            win.maximize();
        }
    });

    //manually set browserview size on min/max. normal way is bugged
    win.on('maximize', () => {
        view.setBounds({
            x: 0,
            y: 32,
            width: win.getContentBounds()['width'],
            height: win.getContentBounds()['height'] - 32
        })
    });

    win.on('unmaximize', () => {
        view.setBounds({
            x: 0,
            y: 32,
            width: win.getContentBounds()['width'],
            height: win.getContentBounds()['height'] - 32
        })
    });

    //remove windows on close
    win.on('closed', () => {
        view = null;
        win = null;
    });

}

//Main
app.on('ready', () => {
    createWindow();

    update();
    setInterval(() => {
        update();
    }, 60000 * 10);

})


//macOS related window handling
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (win === null) {
        createWindow()
        update();
    }
})