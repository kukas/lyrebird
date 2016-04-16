var BirdGui = function (game, x, y, bird) {
    Phaser.Group.call(this, game, game.world, 'Birdgui', false, false);
    var _this = this;

    this.position.set(x, y);
    this._width = game.width;
    this._height = game.height/2;

    console.log(this._width/2, this._height/3)
    this.slider = new Slider(game, this, this._width/2, this._height/3);
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

    var slider = new Slider(game, this, 30, 10);
    slider.onChange.add(function (target, value) {
        bird.chirpLength = value * 1000;
    });
    var slider = new Slider(game, this, 80, 10);
    slider.onChange.add(function (target, value) {
        bird.chirpDelay = value * 1000;
    });
    var slider = new Slider(game, this, 130, 10);
    slider.onChange.add(function (target, value) {
        bird.chirpFreqRamp = 500 - value * 1000;
    });



    // this.bg = new Phaser.Graphics(game, x, y);
    // this.bg.beginFill(0x000000, 0.7);
    // this.bg.drawRect(0, 0, this._width, this._height);
    // this.bg.endFill();

    // this.add(this.bg);

    // this.bg.inputEnabled = true;
    // this.bg.events.onInputDown.add(this.mouseDown, this);
    // this.bg.events.onInputUp.add(this.mouseUp, this);
}

BirdGui.prototype = Object.create(Phaser.Group.prototype);
BirdGui.prototype.constructor = BirdGui;


var Slider = function (game, group, x, y) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);

    this._width = 40;
    this._height = 100;

    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x000000, 0.7);
    this.bg.drawRect(-this._width/2, 0, this._width, this._height);
    this.bg.drawCircle(0, 0, this._width);
    this.bg.drawCircle(0, this._height, this._width);
    this.bg.endFill();

    this.add(this.bg);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    this.fg = new Phaser.Graphics(game, 0, 0);
    this.fg.beginFill(0xffffff, 0.7);
    this.fg.drawCircle(0, 0, this._width);
    this.fg.endFill();
    this.add(this.fg);

    this.onChange = new Phaser.Signal();
    this.onDown = new Phaser.Signal();
    this.onUp = new Phaser.Signal();

    this.pointer = null;
}

Slider.prototype = Object.create(Phaser.Group.prototype);
Slider.prototype.constructor = Slider;

Slider.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    this.updateYPos();
}

Slider.prototype.updateYPos = function () {
    if(this.pointer){
        var y = this.toLocal(this.pointer.position).y;
        y = utils.clamp(y, 0, this._height);
        this.fg.position.set(0, y);

        this.value = 1 - y / this._height;
        this.onChange.dispatch(this, this.value);
    }
}

Slider.prototype.mouseDown = function (target, pointer) {
    this.pointer = pointer;
    this.updateYPos();
    this.onDown.dispatch();
    // this.fg.visible = true;
}

Slider.prototype.mouseUp = function (target, pointer) {
    this.pointer = null;
    this.onUp.dispatch();
    // this.fg.visible = false;
}