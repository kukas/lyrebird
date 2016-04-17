var PhaserGame = function () {
};

PhaserGame.prototype = {
    preload: function () {
        game.load.audio('raven', 'sounds/toucan.wav');
        game.load.audio('move', 'sounds/move.wav');
        game.load.audio('knock', 'sounds/knock2.wav');
        game.load.audio('impulse_response', 'sounds/koli_summer_site1_1way_mono.wav');
    },
    create: function () {
        // centrování canvasu
        $(game.canvas).center();
        game.stage.backgroundColor = '#ffffff';
        game.time.advancedTiming = true;

        var debugGui = game.add.group(game.world, "debugGui");
        debugGui.visible = false;
        game.fpsCounter = game.make.text(600, 0, "fps: ", {
            font: "normal 32px monacoregular"
        });
        debugGui.add(game.fpsCounter);

        var gui = game.add.group(game.world, "gui");

        var door = new Door(this.game, 0, 0);
        gui.add(door);

        if(!game.sound.usingWebAudio){
            alert("Your browser doesn't support WebAudio. :(");
        }

        var ctx = this.game.sound.context;
        this.bird = new Bird(ctx, ctx.destination);
        var settings = this.bird.randomize();
        this.bird.singSong();

        var birdGui = new BirdGui(this.game, 0, this.game.height/2, this.bird);
        birdGui.setSliders(settings);
    },

    newBird: function () {
        var ctx = this.game.sound.context;
        this.bird = new Bird(ctx, ctx.destination);
        this.bird.randomize();
        this.bird.singSong();

        var bird = new Bird();
    },

    update: function () {
        game.fpsCounter.text = game.time.fps+" "+game.time.fpsMin+" "+game.time.fpsMax;
        this.bird.update();
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

