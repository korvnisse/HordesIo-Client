const { app, session, screen, BrowserView, BrowserWindow, autoUpdater, dialog } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
require('update-electron-app')()


require('update-electron-app')({
        repo: 'korvnisse/Hordes.io-Electron',
        updateInterval: '1 hour',
    })
    //notify user of update
    //    win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Client version ' + releaseName + ' Available. Restart to apply changes"')

if (require('electron-squirrel-startup')) app.quit();

//installation event
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    app.quit();
}

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
    })
    load.loadURL(url.format({
        pathname: path.join(__dirname, 'assets/splashscreen.html'),
        protocol: 'file:',
        slashes: true
    }))


    //Outer window
    var win = new BrowserWindow({
        width: 805,
        height: 720,
        useContentSize: true,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'client.html'),
        protocol: 'file:',
        slashes: true
    }))


    //Load and attach new BrowserView to to parent window
    let view = new BrowserView

    win.setBrowserView(view)
    view.setAutoResize({
        width: true,
        height: true
    });
    view.setBounds({
        x: 0,
        y: 32,
        width: win.getContentBounds()['width'],
        height: win.getContentBounds()['height'] - 32
    })


    //Load HordesIO URL in BrowserView
    view.webContents.loadURL('https://hordes.io/', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
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
            //maximize clips screen - Bad css?
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            win.setSize(width, height)
            win.setPosition(0, 0)
                // win.maximize(); 
        }
    })

    //destroy win on close
    win.on('closed', () => {
            view = null
            win = null
        })
        //view.webContents.openDevTools() //-->Devtools for debugging<--
}

app.on('ready', createWindow)

//macOS related window handling
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

//Squirrel installation events
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
            spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
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