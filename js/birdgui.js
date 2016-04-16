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

    var slider = new Slider(game, this, 30, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpLength(value);
    });
    var slider = new Slider(game, this, 80, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpDelay(value);
    });

    
    var slider = new Slider(game, this, 200, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpFreqRamp(value);
    });

    var slider = new Slider(game, this, 250, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpFreqRange(value);
    });

    var slider = new Slider(game, this, 300, 50);
    slider.onChange.add(function (target, value) {
        bird.setChirpCut(value);
    });

    
    var sliderSq = new Slider(game, this, 680, 50);
    sliderSq.onChange.add(function (target, value) {
        bird.setColor(sliderSq.value,sliderSw.value,sliderTr.value);
    });
    
    var sliderSw = new Slider(game, this, 630, 50);
    sliderSw.onChange.add(function (target, value) {
        bird.setColor(sliderSq.value,sliderSw.value,sliderTr.value);
    });

    var sliderTr = new Slider(game, this, 580, 50);
    sliderTr.onChange.add(function (target, value) {
        bird.setColor(sliderSq.value,sliderSw.value,sliderTr.value);
    });
}

BirdGui.prototype = Object.create(Phaser.Group.prototype);
BirdGui.prototype.constructor = BirdGui;

var Slider = function (game, group, x, y, _width, _height) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);
    this.value = 0;

    this._width = _width === undefined ? 40 : _width;
    this._height = _height === undefined ? 100 : _height;

    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x444444, 1);
    this.bg.drawRect(-this._width/2, 0, this._width, this._height);
    this.bg.drawCircle(0, 0, this._width);
    this.bg.drawCircle(0, this._height, this._width);
    this.bg.endFill();

    this.add(this.bg);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    this.fg = new Phaser.Graphics(game, 0, 0);
    this.fgBaseScale = new Phaser.Point(0.8, 0.8);
    this.fg.beginFill(0xdddddd, 1);
    this.fg.drawCircle(0, 0, this._width);
    this.fg.endFill();
    this.fg.scale.copyFrom(this.fgBaseScale);
    this.add(this.fg);
    this.fg.inputEnabled = true;
    this.fg.input.useHandCursor = true;
    this.fg.events.onInputDown.add(this.mouseDown, this);
    this.fg.events.onInputUp.add(this.mouseUp, this);
    this.fg.events.onInputOver.add(function (target) {
        if(!this.pointer){
            if(this.fgTween)
                this.fgTween.stop();
            this.fgTween = game.add.tween(this.fg.scale).to( { x:0.82, y:0.82 }, 50, Phaser.Easing.Quadratic.Out, true);
        }
    }, this);
    this.fg.events.onInputOut.add(function (target) {
        if(!this.pointer){
            if(this.fgTween)
                this.fgTween.stop();
            this.fg.scale.copyFrom(this.fgBaseScale);
        }
    }, this);

    this.onChange = new Phaser.Signal();
    this.onDown = new Phaser.Signal();
    this.onUp = new Phaser.Signal();

    this.moveSfx = game.add.audio('move');
    this.moveSfx.loopFull();
    this.moveSfx.volume = 0;

    this.pointer = null;
}

Slider.prototype = Object.create(Phaser.Group.prototype);
Slider.prototype.constructor = Slider;

Slider.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    this.updateYPos();
}

Slider.prototype.updateYPos = function () {
    var dy = 0;
    if(this.pointer){
        var y = this.toLocal(this.pointer.position).y;
        y = utils.clamp(y, 0, this._height);
        dy = Math.abs(this.fg.position.y - y);
        
        // if(dy > 5){
        //     this.fgPosTween = game.add.tween(this.fg).to( { y:y }, 50, Phaser.Easing.Quadratic.Out, true);
        // }
        // else {
            this.fg.position.set(0, y);
        // }

        this.value = 1 - y / this._height;
        this.onChange.dispatch(this, this.value);
    }

    this.moveSfx.volume = utils.clamp((this.moveSfx.volume + Math.sqrt(dy))/2, 0, 1);
}

Slider.prototype.mouseDown = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( { x:0.9, y:0.9 }, 50, Phaser.Easing.Quadratic.Out, true);

    this.pointer = pointer;
    this.updateYPos();
    this.onDown.dispatch();
}

Slider.prototype.mouseUp = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( {x:this.fgBaseScale.x, y:this.fgBaseScale.y}, 150, Phaser.Easing.Quadratic.Out, true);

    this.moveSfx.volume = 0;

    this.updateYPos();
    this.pointer = null;
    this.onUp.dispatch();
}