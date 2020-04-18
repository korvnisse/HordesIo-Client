(function() {
    const remote = require('electron').remote;
    const app = require('electron').remote.app;
    const window = remote.getCurrentWindow();

    //Eventlisteners for window buttons (min/max/close)
    function init() {
        document.getElementById("min-btn").addEventListener("click", function(e) {
            window.minimize();
        });

        document.getElementById("max-btn").addEventListener("click", function(e) {
            window.maximize();
        });

        document.getElementById("restore-btn").addEventListener("click", function(e) {
            window.unmaximize();
        });

        document.getElementById("close-btn").addEventListener("click", function(e) {
            app.quit();
        });


        toggleMaxRestoreButtons();
        window.on('maximize', toggleMaxRestoreButtons);
        window.on('unmaximize', toggleMaxRestoreButtons);

        function toggleMaxRestoreButtons() {
            if (window.isMaximized()) {
                document.body.classList.add('maximized');
            } else {
                document.body.classList.remove('maximized');
            }
        }

    };

    document.onreadystatechange = function() {
        if (document.readyState == "complete") {
            init();
        }
    };
})();