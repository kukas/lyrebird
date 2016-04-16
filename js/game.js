var PhaserGame = function () {
};

PhaserGame.prototype = {
    preload: function () {

    },
    create: function () {
        // centrování canvasu
        $(game.canvas).center();
		// Zapnutí progressu
        game.stage.backgroundColor = '#dddddd';
        game.time.advancedTiming = true;

        var debugGui = game.add.group(game.world, "debugGui");
        game.fpsCounter = game.make.text(600, 0, "fps: ", {
            font: "normal 32px monacoregular"
        });
        debugGui.add(game.fpsCounter);

        var gui = game.add.group(game.world, "gui");

        var door = new Door(this.game, 0, 0);
        // door.position.set(320, 240);
        gui.add(door);

        this.datgui = new dat.GUI();
        // dat.GUI.toggleHide();
        // $(this.datgui.domElement).attr("hidden", true);
        // this.datgui.add(game.march.psychology, "baseSpeed");
    },

    update: function () {
        game.fpsCounter.text = game.time.fps+" "+game.time.fpsMin+" "+game.time.fpsMax;
    },

    render: function () {
        // game.debug.spriteBounds(game.diary.textA);
        // game.debug.cameraInfo(game.camera, 32, 32);
        // game.debug.spriteCoords(player, 32, 500);
    },
};
var game;
$(document).ready(function(){
    game = new Phaser.Game(800, 480, Phaser.AUTO, document.body);
    // game.state.add("Loading", loading);
    // game.state.add("Preload", preloadA);
    game.state.add("PhaserGame", PhaserGame);
    game.state.start("PhaserGame");
});

