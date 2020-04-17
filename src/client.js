(function() {

    const remote = require('electron').remote;
    const app = require('electron').remote.app;

    //Eventlisteners for window buttons (min/max/close)
    function init() {
        document.getElementById("min-btn").addEventListener("click", function(e) {
            const window = remote.getCurrentWindow();
            window.minimize();
        });

        document.getElementById("max-btn").addEventListener("click", function(e) {
            const window = remote.getCurrentWindow();
            if (!window.isMaximized()) {
                window.maximize();
            } else {
                window.unmaximize();
            }
        });

        document.getElementById("close-btn").addEventListener("click", function(e) {
            app.quit();
        });

    };

    document.onreadystatechange = function() {
        if (document.readyState == "complete") {
            init();
        }
    };
})();