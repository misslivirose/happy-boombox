// Happy Boom Box
// boomBoxEntityScript.js
// Licensed under the Apache 2.0 License
// Music provided by Bensound
/* globals EventBridge */
(function(){
    var RETRY_SEND_INFO = 1000; // ms
    var MAX_ATTEMPTS = 10;
    var EMPTY = -1;

    var attempts = 0;
    var boomboxID;
    var songList;
    var boomboxUserData;

    var tablet;
    var controllerApp = Script.resolvePath("app/boomBoxController.html");

    var tabletAppIsSetup = false;
    var tabletListener = EMPTY;
    var tabletPageChangedListener = EMPTY;
    
    function onWebEventReceived(message) {
        message = JSON.parse(message);
        if (message.type === 'confirmSongList') {
            tabletAppIsSetup = true;
        }
        if (message.type === 'playSong') {
            if (message.song === "stop") {
                Entities.callEntityServerMethod(boomboxID, 'stopMusic');
            } else {
                var position = Entities.getEntityProperties(boomboxID, 'position').position;
                Entities.callEntityServerMethod(boomboxID, 'playMusic', [message.song, position]);
            }
        }
        if (message.type === 'adjustVolume') {
            Entities.callEntityServerMethod(boomboxID, 'adjustVolume', [message.volume]);
        }
    }

    function onTabletPageChanged(type, url) {
        if (url !== controllerApp) {
            tablet.webEventReceived.disconnect(onWebEventReceived);
            tablet.screenChanged.disconnect(onTabletPageChanged);
            tabletListener = EMPTY;
            tabletPageChangedListener = EMPTY;
        }
        tabletAppIsSetup = false;
        attempts = 0;
    }

    function getVolume() {
        return JSON.parse(Entities.getEntityProperties(boomboxID, 'userData').userData).volume;
    }

    function emitData() {
        songList = JSON.parse(boomboxUserData).music;
        if (!tabletAppIsSetup && attempts < MAX_ATTEMPTS) {
            attempts++;
            tablet.emitScriptEvent(JSON.stringify({
                'type' : 'updateSongList',
                'songList': songList,
                'volume' : getVolume()
            }));
            Script.setTimeout(emitData, RETRY_SEND_INFO);
        }
    }

    function setupApplicationInformation() {
        tablet.gotoWebScreen(controllerApp);
        if (tabletListener === EMPTY) {
            tabletListener = tablet.webEventReceived.connect(onWebEventReceived);
        }
        if (tabletPageChangedListener === EMPTY) {
            tabletPageChangedListener = tablet.screenChanged.connect(onTabletPageChanged);
        }
        emitData();
    }

    this.preload = function(entityID) {
        tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
        boomboxID = Entities.getEntityProperties(entityID, 'parentID').parentID;
        boomboxUserData = Entities.getEntityProperties(boomboxID, 'userData').userData;
    };

    this.clickDownOnEntity = function() {
        setupApplicationInformation();
    };

    this.stopNearTrigger = function() {
        setupApplicationInformation();
    };
});