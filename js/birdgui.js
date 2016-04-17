var BirdGui = function (game, x, y, bird) {
    Phaser.Group.call(this, game, game.world, 'Birdgui', false, false);
    var _this = this;

    this.position.set(x, y);
    this._width = game.width;
    this._height = game.height/2;

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

    var slider = new SliderCircle(game, this, 90, 30+70);
    slider.onChange.add(function (target, value) {
        bird.setChirpLength(value.x);
        bird.setChirpDelay(value.y);
    });
    
    var slider = new Slider2D(game, this, 200, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpFreqRamp(value.x);
        bird.setChirpFreqRange(value.y);
    });


    var slider = new Slider(game, this, 470, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpCut(value);
    });

    var sliderSw = new Slider(game, this, 630, 50);
    sliderSw.onChange.add(function (target, value) {
        if(sliderSq.value > 0.5)
            bird.setColor(0, 1 - value, value);
    });

    var sliderSq = new SliderToggle(game, this, 750, 50);
    sliderSq.onChange.add(function (target, value) {
        console.log(value, "toggle")
        if(value < 0.5)
            bird.setColor(1,0,0);
        else
            bird.setColor(0,0.2,0.8);
    });

    var sliderScale = new SliderToggle(game, this, 700, 50);
    sliderScale.onChange.add(function (target, value) {
        bird.setScale(value);
    });
}

BirdGui.prototype = Object.create(Phaser.Group.prototype);
BirdGui.prototype.constructor = BirdGui;
