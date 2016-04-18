var PhaserGame = function () {
};

PhaserGame.prototype = {
    preload: function () {
        game.load.image('tick', 'img/tick.png');
        game.load.audio('raven', 'sounds/toucan.wav');
        game.load.audio('move', 'sounds/move.wav');
        game.load.audio('knock', 'sounds/knock2.wav');
        game.load.audio('impulse_response', 'sounds/koli_summer_site1_1way_mono.wav');
        game.load.audio('door1', 'sounds/door2.wav');
    },
    create: function () {
        // centrování canvasu
        $(game.canvas).center();
        game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
        game.stage.backgroundColor = '#000000';
        game.time.advancedTiming = true;

        var debugGui = game.add.group(game.world, "debugGui");
        debugGui.visible = false;
        game.fpsCounter = game.make.text(600, 0, "fps: ", {
            font: "normal 32px monacoregular"
        });
        debugGui.add(game.fpsCounter);

        var gui = game.add.group(game.world, "gui");

        this.door = new Door(this.game, 0, this.game.height/4);
        gui.add(this.door);

        if(!game.sound.usingWebAudio){
            alert("Your browser doesn't support WebAudio. :(");
        }

        var ctx = this.game.sound.context;
        this.bird = new Bird(ctx, ctx.destination);
        this.otherBird = new Bird(ctx, ctx.destination);

        this.otherBird.onDoneSinging.add(function () {
            if(!this.win){
                this.otherBird.listen = true;
                game.time.events.add(500, function () {
                    this.birdGui.slider.bg.input.enabled = true;
                    game.add.tween(this.door).to( { y:0 }, 1500, Phaser.Easing.Quadratic.Out, true).onComplete.add(function () {
                    }, this);
                    game.add.tween(this.birdGui).to( { y:this.game.height/2 }, 1000, Phaser.Easing.Quadratic.InOut, true);
                }, this);
            }
            else {
                game.time.events.add(500, function () {
                    this.win = false;
                    game.time.events.add(100, function () {
                        var delay = 1300;
                        game.add.tween(this.door.circle).to( { alpha:1 }, delay, Phaser.Easing.Quadratic.Out, true);
                        game.add.tween(this.door.circle).to( { x:this.game.width/2 }, delay, Phaser.Easing.Quadratic.Out, true);
                        game.add.tween(this.door.circle.scale).to( { x:0.7 }, delay, Phaser.Easing.Quadratic.Out, true);
                    }, this);
                    game.add.tween(this.door).to( { y:this.game.height/4 }, 1500, Phaser.Easing.Quadratic.Out, true).onComplete.add(function () {
                        this.birdGui.slider.bg.input.enabled = true;
                        this.newBird();
                        this.birdGui.tickHide();
                        this.door.dontKnock = false;
                    }, this);
                    game.add.tween(this.birdGui).to( { y:this.game.height }, 1000, Phaser.Easing.Quadratic.InOut, true);
                }, this);
            }

        }, this);

        this.door.onKnock.add(function () {
            this.birdGui.slider.bg.input.enabled = false;
            this.door.dontKnock = true;
            this.door.openSfx.play("1");
            var delay = 1000;
            game.time.events.add(370, function () {
                game.add.tween(this.door.circle.scale).to( { x:0.65 }, 400, Phaser.Easing.Quadratic.Out, true);
            }, this);
            game.time.events.add(2000, function () {
                game.add.tween(this.door.circle).to( { alpha:0.8 }, delay, Phaser.Easing.Quadratic.Out, true);
                game.add.tween(this.door.circle).to( { x:this.game.width/5 }, delay, Phaser.Easing.Quadratic.Out, true);
                game.add.tween(this.door.circle.scale).to( { x:0.2 }, delay, Phaser.Easing.Quadratic.Out, true);
            }, this);
            this.door.openSfx.onMarkerComplete.addOnce(function () {
                game.time.events.add(750, function () {
                    this.otherBird.singSong();
                }, this);
            }, this);
        }, this);

        this.bird.onStartSinging.add(function () {
            if(this.otherBird.listen){
                var test = this.otherBird.compare(this.bird);
                this.bird.lastTest = test;
            }
        }, this);

        this.bird.onDoneSinging.add(function (chirpCount) {
            if(!this.otherBird.listen){
                game.add.tween(this.door.circle.scale).to( { x:0.75, y:0.75 }, 100, Phaser.Easing.Quadratic.Out, true).chain(
                    game.add.tween(this.door.circle.scale).to( { x:0.7, y:0.7 }, 100, Phaser.Easing.Quadratic.Out)
                    );
            }

            if(this.bird.lastTest && this.otherBird.listen){
                this.birdGui.slider.bg.input.enabled = false;
                this.door.dontKnock = false;
                var test = this.bird.lastTest;
                if(this.birdGui.sliderCircle.visible)
                    game.add.tween(this.birdGui.tickCircle).to( { alpha:(test.circle ? 1 : 0) }, 300, Phaser.Easing.Exponential.Out, true);
                if(this.birdGui.sliderSq.visible)
                    game.add.tween(this.birdGui.tickCroak).to( { alpha:(test.croak ? 1 : 0) }, 300, Phaser.Easing.Exponential.Out, true);
                if(this.birdGui.slider2D.visible)
                    game.add.tween(this.birdGui.tickSquare).to( { alpha:(test.square ? 1 : 0) }, 300, Phaser.Easing.Exponential.Out, true);
                if(this.birdGui.sliderChirpCut.visible)
                    game.add.tween(this.birdGui.tickCut).to( { alpha:(test.cut ? 1 : 0) }, 300, Phaser.Easing.Exponential.Out, true);
                
                if(test.circle && test.croak && test.square && test.cut && chirpCount == this.otherBird.song.length){
                    this.onWin.dispatch();
                }
                else {
                    this.onMissed.dispatch();
                }
                
            }
        }, this);

        this.win = false;
        this.onWin = new Phaser.Signal();
        this.onMissed = new Phaser.Signal();

        this.onWin.add(function () {
            this.win = true;
            this.door.dontKnock = true;
            this.otherBird.singSong([0, 1]);
        }, this);

        this.onMissed.add(function () {
            this.otherBird.listen = false;
            game.time.events.add(100, function () {
                game.time.events.add(266, function () {
                    var delay = 100;
                    game.add.tween(this.door.circle).to( { alpha:1 }, delay, Phaser.Easing.Quadratic.Out, true);
                    game.add.tween(this.door.circle).to( { x:this.game.width/2 }, delay, Phaser.Easing.Quadratic.Out, true);
                    game.add.tween(this.door.circle.scale).to( { x:0.7 }, delay, Phaser.Easing.Quadratic.Out, true);

                    game.time.events.add(200, function () {
                        this.birdGui.slider.bg.input.enabled = true;
                    }, this);
                }, this);

                this.door.openSfx.play("2");
                game.time.events.add(400, function () {
                    game.add.tween(this.birdGui.tickCircle).to( { alpha:0 }, 3000, Phaser.Easing.Linear.None, true);
                    game.add.tween(this.birdGui.tickCroak).to( { alpha:0 }, 3000, Phaser.Easing.Linear.None, true);
                    game.add.tween(this.birdGui.tickSquare).to( { alpha:0 }, 3000, Phaser.Easing.Linear.None, true);
                    game.add.tween(this.birdGui.tickCut).to( { alpha:0 }, 3000, Phaser.Easing.Linear.None, true);
                }, this);
            }, this);
        }, this);

        this.birdGui = new BirdGui(this.game, 0, this.game.height, this.bird);

        this.storyPointer = 7;
        this.story = [
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0.5, max:1},
                    // ctverec y
                    chirpFreqRange: {min:0.4, max:0.7},
                    // slider x
                    chirpCut: {min: 0.4, max: 0.4},
                    // kruh x
                    chirpLength: {min: 0.28, max: 0.28},
                    // kruh y
                    chirpDelay: {min: 0.1, max: 0.1},
                    // toggle
                    croak: 0
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: false
                },
                song: [0.6, 0.6, 0.6, 0.6],
                // song: [0.6, 0.6, 0.4, 0.5],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: false,
                    sliderSq: false,
                }
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0.5, max:1},
                    // ctverec y
                    chirpFreqRange: {min:0.4, max:0.7},
                    // slider x
                    chirpCut: {min: 0.4, max: 0.4},
                    // kruh x
                    chirpLength: {min: 0.18, max: 0.20},
                    // kruh y
                    chirpDelay: {min: 0.06, max: 0.07},
                    // toggle
                    croak: 0
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: false
                },
                song: [0.6, 0.8, 1.0, 1.8],
                // song: [0.6, 0.6, 0.4, 0.5],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: false,
                    sliderSq: false,
                }
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0, max:0.07},
                    // ctverec y
                    chirpFreqRange: {min:0.5, max:1},
                    // slider x
                    chirpCut: {min: 1, max: 1},
                    // kruh x
                    chirpLength: {min: 0.5, max: 0.55},
                    // kruh y
                    chirpDelay: {min: 0.6, max: 0.65},
                    // toggle
                    croak: 0
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: false
                },
                song: [0.6, 0.6],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: false,
                    sliderSq: false,
                }
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0, max:0.5},
                    // ctverec y
                    chirpFreqRange: {min:0, max:1},
                    // slider x
                    chirpCut: {min: 1, max: 0.5},
                    // kruh x
                    chirpLength: {min: 0.25, max: 0.27},
                    // kruh y
                    chirpDelay: {min: 0.73, max: 0.77},
                    // toggle
                    croak: 1
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: 2
                },
                song: [0.6, 0.6, 0.6],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: false,
                    sliderSq: true,
                },
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0.8, max:0.9},
                    // ctverec y
                    chirpFreqRange: {min:0.3, max:0.5},
                    // slider x
                    chirpCut: {min: 1, max: 0.9},
                    // kruh x
                    chirpLength: {min: 0.04, max: 0.07},
                    // kruh y
                    chirpDelay: {min: 0.23, max: 0.26},
                    // toggle
                    croak: 0
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: 2
                },
                song: [0.5, 0.5, 0.4, 0.6],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: false,
                    sliderSq: true,
                },
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0.2, max:0.3},
                    // ctverec y
                    chirpFreqRange: {min:0, max:1},
                    // slider x
                    chirpCut: {min: 0.3, max: 0.2},
                    // kruh x
                    chirpLength: {min: 0.47, max: 0.50},
                    // kruh y
                    chirpDelay: {min: 0.07, max: 0.09},
                    // toggle
                    croak: 0
                },
                set: {
                    chirpCut: 1
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: false
                },
                song: [0.6, 0.3, 0.5, 0.6, 0.8, 0.7],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: true,
                    sliderSq: true,
                },
            },
            {
                values: {
                    // ctverec x
                    chirpFreqRamp: {min:0.6, max:1},
                    // ctverec y
                    chirpFreqRange: {min:0.4, max:0.8},
                    // slider x
                    chirpCut: {min: 0, max: 0},
                    // kruh x
                    chirpLength: {min: 0.53, max: 0.6},
                    // kruh y
                    chirpDelay: {min: 0.6, max: 0.66},
                    // toggle
                    croak: 1
                },
                set: {
                    chirpCut: 1
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: false,
                    chirpDelay: false,
                    // toggle
                    croak: 2
                },
                song: [0.4, 0.4, 0.4, 0.4],
                visibility: {
                    sliderCircle: false,
                    slider2D: false,
                    sliderChirpCut: true,
                    sliderSq: true,
                },
            },
            {
                values: {
                    chirpCut: {min: 1, max: 1},
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: false,
                    // kruh
                    chirpLength: true,
                    chirpDelay: true,
                    // toggle
                    croak: 1
                },
                // song: [0.4, 0.4, 0.4, 0.4],
                visibility: {
                    sliderCircle: true,
                    slider2D: false,
                    sliderChirpCut: true,
                    sliderSq: true,
                },
            },
            {
                values: {
                    chirpCut: {min: 1, max: 1},
                },
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: true,
                    // kruh
                    chirpLength: true,
                    chirpDelay: true,
                    // toggle
                    croak: 1
                },
                // song: [0.4, 0.4, 0.4, 0.4],
                visibility: {
                    sliderCircle: true,
                    slider2D: false,
                    sliderChirpCut: true,
                    sliderSq: true,
                },
            },
            {
                values: {},
                randomize: {
                    // ctverec
                    chirpFreqRamp: false,
                    chirpFreqRange: false,
                    // slider
                    chirpCut: true,
                    // kruh
                    chirpLength: true,
                    chirpDelay: true,
                    // toggle
                    croak: 1
                },
                // song: [0.4, 0.4, 0.4, 0.4],
                visibility: {
                    sliderCircle: true,
                    slider2D: false,
                    sliderChirpCut: true,
                    sliderSq: true,
                },
            },
        ];
        this.newBird();
    },

    newBird: function () {
        if(this.storyPointer < this.story.length){
            var story = this.story[this.storyPointer];
            // nastaví oponenta
            var settingsOther = this.otherBird.randomize(story.values);
            // nastaví mu song
            if(story.song)
                this.otherBird.song = story.song;
            // hráč začne se stejným nastavením
            this.bird.copySettings(this.otherBird);
            // ale některá se rozhází
            this.bird.shuffle(story.randomize, this.otherBird, settingsOther);
            if(story.set){
                this.bird.setSettings(story.set);
                if(story.set.chirpFreqRamp !== undefined)
                    settingsOther.chirpFreqRamp = story.set.chirpFreqRamp;
                if(story.set.chirpFreqRange !== undefined)
                    settingsOther.chirpFreqRange = story.set.chirpFreqRange;
                if(story.set.chirpCut !== undefined)
                    settingsOther.chirpCut = story.set.chirpCut;
                if(story.set.chirpLength !== undefined)
                    settingsOther.chirpLength = story.set.chirpLength;
                if(story.set.chirpDelay !== undefined)
                    settingsOther.chirpDelay = story.set.chirpDelay;
                if(story.set.croak !== undefined)
                    settingsOther.croak = story.set.croak;
            }
            // až teď můžeme aktualizovat gui
            this.birdGui.setSliders(settingsOther);

            // nastavíme gui
            this.birdGui.sliderCircle.visible = story.visibility.sliderCircle;
            this.birdGui.slider2D.visible = story.visibility.slider2D;
            this.birdGui.sliderChirpCut.visible = story.visibility.sliderChirpCut;
            this.birdGui.sliderSq.visible = story.visibility.sliderSq;
            
            this.storyPointer++;
        }
        else {
            // sandbox
            var settingsOther = this.otherBird.randomize();
            var settings = this.bird.randomize();
            this.birdGui.setSliders(settings);

            this.birdGui.sliderCircle.visible = true;
            this.birdGui.slider2D.visible = true;
            this.birdGui.sliderChirpCut.visible = true;
            this.birdGui.sliderSq.visible = true;
        }
    },

    update: function () {
        this.bird.update();
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

