var SliderCircle = function (game, group, x, y, _width, _height) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);
    this.value = new Phaser.Point();

    this._width = _width === undefined ? 100 : _width;
    this._height = _height === undefined ? 100 : _height;

    var size = this.size = 40;
    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x444444, 1);
    this.bg.drawCircle(0, 0, this._width + size);
    this.bg.endFill();

    this.add(this.bg);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    this.fg = new Phaser.Graphics(game, 0, 0);
    this.fgBaseScale = new Phaser.Point(0.8, 0.8);
    this.fg.beginFill(0xdddddd, 1);
    this.fg.drawCircle(0, 0, size);
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

SliderCircle.prototype = Object.create(Phaser.Group.prototype);
SliderCircle.prototype.constructor = SliderCircle;

SliderCircle.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    this.updateXYPos();
}

SliderCircle.prototype.updateXYPos = function () {
    var dy = 0;
    if(this.pointer){
        var x = this.toLocal(this.pointer.position).x;
        var y = this.toLocal(this.pointer.position).y;
        var angle = Math.atan(y/x);
        if(x < 0){
            // angle *= -1;
            angle += Math.PI;
        }
        var r = this._width/2;
        if(x*x + y*y > r*r){
            x = Math.cos(angle) * r;
            y = Math.sin(angle) * r;
        }
        dx = Math.abs(this.fg.position.x - x);
        dy = Math.abs(this.fg.position.y - y);
        
        this.fg.position.set(x, y);

        var yy = 1 - 2 * Math.sqrt(x*x + y*y) / this._width;
        // var xx = (angle + Math.PI/2)/Math.PI/2;
        var xx = Math.acos(x/r)/Math.PI;
        console.log(xx);
        this.value.set(0.5 + x / this._width, yy*yy);
        // console.log(this.value.x, this.value.y);
        this.onChange.dispatch(this, this.value);
    }

    this.moveSfx.volume = utils.clamp((this.moveSfx.volume + Math.sqrt(dy ))/2, 0, 1);
}

SliderCircle.prototype.mouseDown = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( { x:0.9, y:0.9 }, 50, Phaser.Easing.Quadratic.Out, true);

    this.pointer = pointer;
    this.updateXYPos();
    this.onDown.dispatch();
}

SliderCircle.prototype.mouseUp = function (target, pointer) {
    if(this.fgTween)
        this.fgTween.stop();
    this.fgTween = game.add.tween(this.fg.scale).to( {x:this.fgBaseScale.x, y:this.fgBaseScale.y}, 150, Phaser.Easing.Quadratic.Out, true);

    this.moveSfx.volume = 0;

    this.updateXYPos();
    this.pointer = null;
    this.onUp.dispatch();
}
