var BirdGui = function (game, x, y, bird) {
    Phaser.Group.call(this, game, game.world, 'Birdgui', false, false);
    var _this = this;

    this.position.set(x, y);
    this._width = game.width;
    this._height = game.height/2;

    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0xffffff, 1);
    this.bg.drawRect(0, 0, this._width, this._height);
    this.bg.endFill();
    this.add(this.bg);

    this.slider = new Slider(game, this, this._width/2, this._height/4, 80, this._height/2);
    this.slider.fgBaseScale.set(0, 0);
    this.slider.fg.scale.set(0, 0);
    this.slider.moveSfx.stop();
    this.slider.fg.events.onInputOver.removeAll();
    this.slider.onChange.add(function (target, value) {
        bird.setFreq(value);
    });

    this.slider.onDown.add(function (target) {
        bird.setFreq(_this.slider.value);
        bird.sing();
    });

    this.slider.onUp.add(function (target) {
        bird.stopSing();
    });
    this.add(this.slider);

    this.sliderCircle = new SliderCircle(game, this, 510+50, 100+20);
    this.sliderCircle.onChange.add(function (target, value) {
        bird.setChirpLength(value.x);
        bird.setChirpDelay(value.y);
    });
    
    this.slider2D = new Slider2D(game, this, 130-55, 50+20);
    this.slider2D.onChange.add(function (target, value) {
        bird.setChirpFreqRamp(value.x);
        bird.setChirpFreqRange(value.y);
    });

    this.sliderChirpCut = new Slider(game, this, 240+40, 70);
    this.sliderChirpCut.onChange.add(function (target, value) {
        bird.setChirpCut(value);
    });

    // var sliderSw = new Slider(game, this, 630, 50);
    // sliderSw.onChange.add(function (target, value) {
    //     if(sliderSq.value > 0.5)
    //         bird.setColor(0, 1 - value, value);
    // });

    this.sliderSq = new SliderToggle(game, this, 670+35, 100);
    this.sliderSq.onChange.add(function (target, value) {
        if(value > 0.5)
            bird.setColor(1,0,0);
        else
            bird.setColor(0,0.2,0.8);
    });





    // this.sliderScale = new SliderToggle(game, this, 700, 50);
    // sliderScale.onChange.add(function (target, value) {
    //     bird.setScale(value);
    // });
}

BirdGui.prototype = Object.create(Phaser.Group.prototype);
BirdGui.prototype.constructor = BirdGui;


BirdGui.prototype.setSliders = function (values) {
    console.log(values);
    this.slider2D.value.set(values.chirpFreqRamp, values.chirpFreqRange);
    this.sliderCircle.setValue(values.chirpLength, values.chirpDelay);
    this.sliderChirpCut.value = values.chirpCut;
    this.sliderSq.setValue(values.color.sq);
}