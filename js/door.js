var Door = function (game) {
    Phaser.Group.call(this, game, game.world, 'Door', false, false);
    // Phaser.Graphics.call(this, game, x, y);

    this._width = game.width;
    this._height = game.height/2;

    this.bg = new Phaser.Graphics(game, 0, 0);
    this.bg.beginFill(0x000000, 0.7);
    this.bg.drawRect(0, 0, this._width, this._height);
    this.bg.endFill();

    this.add(this.bg);

    this.circle = new Phaser.Graphics(game, this._width/2, this._height/2);
    this.circle.beginFill(0xffffff, 0.7);
    this.circle.drawCircle(0, 0, this._height);
    this.circle.endFill();
    this.add(this.circle);

    this.circle.scale.set(0.5, 0.5);

    this.bg.inputEnabled = true;
    this.bg.events.onInputDown.add(this.mouseDown, this);
    this.bg.events.onInputUp.add(this.mouseUp, this);

    // sound
    this.knock = game.add.audio('knock');
    this.knock.allowMultiple = true;
    this.knock.addMarker('1', 0, 0.2);
    this.knock.addMarker('2', 0.53, 0.2);
    this.knock.addMarker('3', 1.04, 0.2);
    this.knock.addMarker('4', 1.67, 0.2);
}

Door.prototype = Object.create(Phaser.Group.prototype);
Door.prototype.constructor = Door;

Door.prototype.mouseUp = function () {
    this.circle.scale.set(0.5, 0.5);
}

Door.prototype.mouseDown = function () {
    this.circle.scale.set(0.6, 0.6);

    console.log(utils.randomInt(1,4));
    this.knock.play("" + utils.randomInt(1,4));
}

// Door.prototype.update = function() {
//     this.__proto__.__proto__.update.call(this);
// };