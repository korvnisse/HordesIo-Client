const { app, session, screen, BrowserView, BrowserWindow, autoUpdater, dialog } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const server = 'https://update.electronjs.org'
const feed = `${server}/korvnisse/HordesIo-Client/${process.platform}/${app.getVersion()}`
var win;
if (require('electron-squirrel-startup')) app.quit();

//Squirrel installation events
if (handleSquirrelEvent()) {
    app.quit();
}

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

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-uninstall':

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version -

            //Copy cookies here?
            app.quit();
            return true;
    }
};

//Better updater hopefully
function update() {
    autoUpdater.setFeedURL(feed)
    autoUpdater.checkForUpdates()

    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 60000 * 10)

    autoUpdater.on('checking-for-update', () => {
        win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Checking for update..."')
        console.log("checking for update")
    })
    autoUpdater.on('update-available', () => {
        win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Downloading new version..."')
    })
    autoUpdater.on('update-not-available', () => {
        win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Latest version already!"')
        setTimeout(function() { win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = ""') }, 5000)
    })
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        win.webContents.webContents.executeJavaScript('document.getElementById("upd").innerHTML = "Client version V.' + releaseName + '  Restart to apply changes"')
    })
};
/*/check for updates - works like shit
require('update-electron-app')({
    logger: require('electron-log')
})
*/

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
    win = new BrowserWindow({
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

app.on('ready', () => {
    createWindow();
    setTimeout(function() { update(); }, 5000);
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
    }
})