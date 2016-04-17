var Slider2D = function (game, group, x, y, _width, _height) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);
    this.value = new Phaser.Point();

    this._width = _width === undefined ? 100 : _width;
    this._height = _height === undefined ? 100 : _height;

    var size = 40;
    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x000000, 1);
    this.bg.drawRect(-size/2, 0, this._width + size, this._height);
    this.bg.drawRect(0, -size/2, this._width, this._height + size);
    this.bg.drawCircle(0, 0, size);
    this.bg.drawCircle(this._width, this._height, size);
    this.bg.drawCircle(this._width, 0, size);
    this.bg.drawCircle(0, this._height, size);
    this.bg.endFill();

    this.add(this.bg);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    this.fg = new Phaser.Graphics(game, 0, 0);
    this.fgBaseScale = new Phaser.Point(0.8, 0.8);
    this.fg.beginFill(0xffffff, 1);
    this.fg.drawCircle(0, 0, 40);
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

Slider2D.prototype = Object.create(Phaser.Group.prototype);
Slider2D.prototype.constructor = Slider2D;

Slider2D.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    this.updateXYPos();
}

Slider2D.prototype.updateXYPos = function () {
    var dx = 0;
    var dy = 0;
    if(this.pointer){
        var x = this.toLocal(this.pointer.position).x;
        var y = this.toLocal(this.pointer.position).y;
        x = utils.clamp(x, 0, this._width);
        y = utils.clamp(y, 0, this._height);
        dx = Math.abs(this.fg.position.x - x);
        dy = Math.abs(this.fg.position.y - y);
        
        this.value.set(x / this._width, 1 - y / this._height);
        this.onChange.dispatch(this, this.value);
    }

    this.fg.position.set(this.value.x * this._width, (1 -this.value.y) * this._height);

    this.moveSfx.volume = utils.clamp((this.moveSfx.volume + Math.sqrt(dx*dx+dy*dy))/2, 0, 1);
}

Slider2D.prototype.mouseDown = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( { x:0.9, y:0.9 }, 50, Phaser.Easing.Quadratic.Out, true);

    this.pointer = pointer;
    this.updateXYPos();
    this.onDown.dispatch();
}

Slider2D.prototype.mouseUp = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( {x:this.fgBaseScale.x, y:this.fgBaseScale.y}, 150, Phaser.Easing.Quadratic.Out, true);

    this.moveSfx.volume = 0;

    this.updateXYPos();
    this.pointer = null;
    this.onUp.dispatch();
}
