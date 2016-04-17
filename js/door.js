var Door = function (game) {
    Phaser.Group.call(this, game, game.world, 'Door', false, false);
    // Phaser.Graphics.call(this, game, x, y);

    this._width = game.width;
    this._height = game.height/2;

    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x000000, 1);
    this.bg.drawRect(0, 0, this._width, this._height);
    this.bg.endFill();

    this.add(this.bg);

    this.circle = new Phaser.Graphics(game, this._width/2, this._height/2);
    this.circle.beginFill(0xffffff, 1);
    this.circle.drawCircle(0, 0, this._height);
    this.circle.endFill();
    this.add(this.circle);

    this.circle.scale.set(0.7, 0.7);

    this.bg.inputEnabled = true;
    this.bg.input.useHandCursor = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    // sound
    this.knock = game.add.audio('knock');
    this.knock.allowMultiple = true;
    this.knock.addMarker('1', 0, 0.2);
    this.knock.addMarker('2', 0.53, 0.2);
    this.knock.addMarker('3', 1.04, 0.2);
    this.knock.addMarker('4', 1.67, 0.2);

    this.last = 0;
    this.onKnock = new Phaser.Signal();
    this.dontKnock = false;
}

Door.prototype = Object.create(Phaser.Group.prototype);
Door.prototype.constructor = Door;

Door.prototype.update = function () {
    this.__proto__.__proto__.update.call(this);
    if(Date.now() - this.last > 500 && this.knocked){
        this.knocked = false;
        this.onKnock.dispatch();
    }
}

Door.prototype.mouseUp = function () {
    if(this.dontKnock)
        return;
    if(this.circleTween)
        this.circleTween.stop();
    this.circleTween = game.add.tween(this.circle.scale).to( { x:0.7, y:0.7 }, 150, Phaser.Easing.Quadratic.Out, true)
    // this.circle.scale.set(0.5, 0.5);
    var last = Date.now();
    if(last - this.last < 500){
        console.log(last-this.last);
        this.knocked = true;
    }
    else {
        this.knocked = false;
    }
    this.last = last;
}

Door.prototype.mouseDown = function () {
    if(this.dontKnock)
        return;
    if(this.circleTween)
        this.circleTween.stop();
    this.circle.scale.set(0.8, 0.8);

    this.knock.play("" + utils.randomInt(1,4));
}

// Door.prototype.update = function() {
//     this.__proto__.__proto__.update.call(this);
// };