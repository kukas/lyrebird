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
}

Door.prototype = Object.create(Phaser.Group.prototype);
Door.prototype.constructor = Door;

Door.prototype.mouseUp = function () {
    this.circle.scale.set(0.5, 0.5);
}

Door.prototype.mouseDown = function () {
    this.circle.scale.set(1, 1);
}

// Door.prototype.update = function() {
//     this.__proto__.__proto__.update.call(this);
// };