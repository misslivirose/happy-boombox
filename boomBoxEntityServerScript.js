// Happy Boom Box
// boomBoxEntityScript.js
// Licensed under the Apache 2.0 License
// Music provided by Bensound
(function(){
    var LOAD_WAIT = 500;

    var selfEntityID;
    var audioInjector;

    var volume = 0.5;

    function BoomBox(){

    }

    function playSong(sound, audioInjectorOptions) {
        if (sound.downloaded) {
            audioInjector = Audio.playSound(sound, audioInjectorOptions);
        } else {
            Script.setTimeout(playSong, LOAD_WAIT);
        }
    }

    BoomBox.prototype = {
        remotelyCallable: ['playMusic', 'stopMusic', 'adjustVolume'],
        preload: function(entityID) {
            selfEntityID = entityID;
            var boomBoxData = JSON.parse(Entities.getEntityProperties(selfEntityID, 'userData').userData);
            var songsToPreload = boomBoxData.music;
            songsToPreload.foreach(function(song){
                SoundCache.preload(song);
            });
            volume = boomBoxData.volume;
        },
        unload: function () {
            if (audioInjector && audioInjector.playing) {
                audioInjector.stop();
            }
        },
        playMusic: function(entityID, args) {
            var sound = SoundCache.getSound(args[0]);
            var audioInjectorOptions = {
                volume: volume, 
                loop: false,
                position: Entities.getEntityProperties(selfEntityID, 'position').position
            };
            if (audioInjector && audioInjector.playing) {
                audioInjector.stop();
            }
            playSong(sound, audioInjectorOptions);
        }, 
        stopMusic : function() {
            if (audioInjector && audioInjector.playing) {
                audioInjector.stop();
            }
        }, 
        adjustVolume : function(entityID, args) {
            volume = parseFloat(args[0]);
            var properties = Entities.getEntityProperties(selfEntityID, ['position', 'userData']);
            if (audioInjector) {
                audioInjector.setOptions({
                    volume: volume,
                    loop: false,
                    position: properties.position
                });               
            }

            var userdata = JSON.parse(properties.userData);
            userdata.volume = volume;
            Entities.editEntity(selfEntityID, {'userData' : JSON.stringify(userdata)});
        }
    };
    return new BoomBox();
});