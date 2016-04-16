function Bird(ctx, destination) {
	this.ctx = ctx;

	var dryReverb = ctx.createGain();
	dryReverb.gain.value = 0.5;
	dryReverb.connect(destination);
	
	var wetReverb = ctx.createGain();
	wetReverb.gain.value = 0.2;
	wetReverb.connect(destination);


	this.convolver = ctx.createConvolver();
	this.convolver.normalize = true;
	this.convolver.connect(wetReverb);
	var impulse = game.add.audio("impulse_response");
	game.sound.decode("impulse_response", impulse);
	impulse.onDecoded.add(function () {
		var buffer = game.cache.getSoundData("impulse_response");
		this.convolver.buffer = buffer;
	}, this);

	this.chirperGain = ctx.createGain();
	this.chirperGain.gain.value = 0;
	this.chirperGain.connect(dryReverb);
	this.chirperGain.connect(this.convolver);

	this.chirpDelay = 200;
	this.chirpLength = 50;
	this.chirpFreqRamp = 300;

	this.attack = 40;

	this.oscGain = ctx.createGain();
	this.oscGain.gain.value = 0;
	this.oscGain.connect(this.chirperGain);

	this.square = ctx.createOscillator();
	this.squareGain = ctx.createGain();
	this.squareGain.gain.value = 0.1;
	this.square.type = 'triangle';
	this.square.frequency.value = 440;
	this.square.start();
	this.square.connect(this.squareGain);
	this.squareGain.connect(this.oscGain);

	// sine
	// square
	// sawtooth
	// triangle
	// custom

	this.saw = ctx.createOscillator();
	this.sawGain = ctx.createGain();
	this.sawGain.gain.value = 0.2;
	this.saw.type = 'triangle';
	this.saw.frequency.value = 440;
	// this.saw.start();
	this.saw.connect(this.sawGain);
	this.sawGain.connect(this.oscGain);

	this.timeout = null;
	this.singTime = 0;
	this.chirpTime = 0;
}

Bird.prototype.startChirping = function () {
	var _this = this;
	chirpTotalLength = this.chirpLength + this.chirpDelay;
	this.timeout = setTimeout(function () {
		_this.startChirping();
	}, chirpTotalLength);

	var t = this.ctx.currentTime;
	this.chirperGain.gain.cancelScheduledValues(t);
	this.chirperGain.gain.setValueAtTime(0, t);
	this.chirperGain.gain.linearRampToValueAtTime(1, t+this.attack/1000);
	this.chirperGain.gain.setTargetAtTime(0, t+this.chirpLength/1000, 0.02);

	this.square.frequency.setValueAtTime(this.frequency, t);
	this.square.frequency.linearRampToValueAtTime(this.frequency + this.chirpFreqRamp, t+this.chirpLength/1000);
}

Bird.prototype.sing = function () {
	this.oscGain.gain.value = 1;
	this.singTime = Date.now();
	this.startChirping();
}

Bird.prototype.stopSing = function () {
	this.oscGain.gain.value = 0;
	clearTimeout(this.timeout);
}

Bird.prototype.setFreq = function (freq) {
	// this.saw.frequency.value = 100 + freq*1000;
	// this.square.frequency.value = 100 + freq*1000;
	var base = 440;
	pentatonic = [1, 32/27, 4/3, 3/2, 16/9, 2, 2*32/27, 2*4/3, 2*3/2, 2*16/9, 4];
	var f = pentatonic[Math.floor((pentatonic.length-1)*freq)]*base;

	// f = 100 + freq*1000;

	this.frequency = f;
	// var t = this.ctx.currentTime;
	// this.square.frequency.setValueAtTime(f, t);
	// this.square.frequency.value = f;
	// this.chirperGain.gain.setValueAtTime(1, t);
	// this.squareGain.gain.cancelScheduledValues(0);
	// this.squareGain.gain.setValueAtTime(0, t);
	// this.squareGain.gain.exponentialRampToValueAtTime(1, t + 0.3);
	// this.saw.frequency.value = f;
}