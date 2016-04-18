var SliderCircle = function (game, group, x, y, _width, _height) {
    Phaser.Group.call(this, game, group, undefined, false, false);

    this.position.set(x, y);
    this.value = new Phaser.Point();

    this._width = _width === undefined ? 100 : _width;
    this._height = _height === undefined ? 100 : _height;

    var size = this.size = 40;
    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x000000, 1);
    this.bg.drawCircle(0, 0, this._width + size);
    this.bg.endFill();

    this.add(this.bg);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    this.fg2 = new Phaser.Graphics(game, 0, 0);
    // this.fg2.beginFill(0x000000, 1);
    // this.fg2.drawCircle(0, 0, 40);
    // this.fg2.endFill();
    this.fg2.beginFill(0xffffff, 1);
    this.fg2.drawCircle(0, 0, size*0.8);
    this.fg2.endFill();
    // this.add(this.fg2);

    this.fg = new Phaser.Graphics(game, 0, 0);
    this.fgBaseScale = new Phaser.Point(0.8, 0.8);
    this.fg.beginFill(0x000000, 1);
    this.fg.drawCircle(0, 0, size*1.1);
    this.fg.endFill();
    this.fg.beginFill(0xffffff, 1);
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
    var dy = 0, dx = 0;
    if(this.pointer){
        var x = this.toLocal(this.pointer.position).x;
        var y = this.toLocal(this.pointer.position).y;
        var angle = Math.atan(y/x);
        if(x < 0){
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

        var xn = Math.abs(x / this._width * 2);
        var yn = Math.abs(- y / this._height * 2);
        var rt = xn > yn ? (1+yn*yn/xn/xn) : (1+xn*xn/yn/yn);
        rt = Math.sqrt(rt);

        var xx = xn * rt * Math.sign(x);
        var yy = yn * rt * Math.sign(y);

        this.fg.position.set(x, y);

        this.value.set((1 + xx) * 0.5, (1 + yy) * 0.5);
        // this.setValue(this.value.x, this.value.y);

        this.onChange.dispatch(this, this.value);
    }

    this.moveSfx.volume = utils.clamp((this.moveSfx.volume + Math.sqrt(dx*dx + dy*dy))/2, 0, 1);
}

SliderCircle.prototype.setValue = function (x, y) {
    this.value.set(x, y);

    x = (x - 0.5) * 2;
    y = (y - 0.5) * 2;

    var xn = Math.abs(x);
    var yn = Math.abs(y);
    var rt = xn > yn ? (1+yn*yn/xn/xn) : (1+xn*xn/yn/yn);
    rt = Math.sqrt(rt);

    var xx = xn / rt * Math.sign(x);
    var yy = yn / rt * Math.sign(y);

    this.fg.position.set(xx*this._width/2, yy*this._height/2);
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
