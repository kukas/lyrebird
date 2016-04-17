var SliderToggle = function (game, group, x, y, _width, _height) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);
    this.value = 0;

    this._width = _width === undefined ? 40 : _width;
    this._height = _height === undefined ? 40 : _height;

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

SliderToggle.prototype = Object.create(Phaser.Group.prototype);
SliderToggle.prototype.constructor = SliderToggle;

SliderToggle.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    this.updateYPos();
}

SliderToggle.prototype.updateYPos = function () {
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

SliderToggle.prototype.mouseDown = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( { x:0.9, y:0.9 }, 50, Phaser.Easing.Quadratic.Out, true);

    this.pointer = pointer;
    this.updateYPos();
    this.onDown.dispatch();
}

SliderToggle.prototype.mouseUp = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( {x:this.fgBaseScale.x, y:this.fgBaseScale.y}, 150, Phaser.Easing.Quadratic.Out, true);

    this.moveSfx.volume = 0;

    this.updateYPos();
    this.pointer = null;
    this.onUp.dispatch();

    var y = 0;
    console.log(this.value)
    if(this.value < 0.5)
        y = this._height;
    this.fgPosTween = game.add.tween(this.fg).to( { y:y }, 50, Phaser.Easing.Quadratic.Out, true);
}
