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
	this.chirpLength = 100;
	this.chirpFreqRange = 1;
	this.chirpFreqRamp = 1;
	this.chirpCut = 0.5;
	this.chirpCutCount = 1;

	this.attack = 40;

	this.oscGain = ctx.createGain();
	this.oscGain.gain.value = 0;
	this.oscGain.connect(this.chirperGain);

	this.squareGain = ctx.createGain();
	this.squareGain.gain.value = 0.1;
	this.squareGain.connect(this.oscGain);
	this.square = ctx.createOscillator();
	this.square.type = 'square';
	this.square.start();
	this.square.connect(this.squareGain);

	this.triangleGain = ctx.createGain();
	this.triangleGain.gain.value = 0.1;
	this.triangleGain.connect(this.oscGain);
	this.triangle = ctx.createOscillator();
	this.triangle.type = 'triangle';
	this.triangle.start();
	this.triangle.connect(this.triangleGain);

	this.sawtoothGain = ctx.createGain();
	this.sawtoothGain.gain.value = 0.1;
	this.sawtoothGain.connect(this.oscGain);
	this.sawtooth = ctx.createOscillator();
	this.sawtooth.type = 'sawtooth';
	this.sawtooth.start();
	this.sawtooth.connect(this.sawtoothGain);

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
	this.chirpCount = 0;
}

Bird.prototype.startChirping = function () {
	var _this = this;

	chirpCut = 1;
	if(this.chirpCount >= this.chirpCutCount)
		chirpCut = this.chirpCut;

	chirpTotalLength = this.chirpLength*chirpCut + this.chirpDelay;
	this.timeout = setTimeout(function () {
		_this.startChirping();
	}, chirpTotalLength);

	var t = this.ctx.currentTime;
	this.chirperGain.gain.cancelScheduledValues(t);
	this.chirperGain.gain.setValueAtTime(0, t);
	var attack = t+this.attack/1000;
	this.chirperGain.gain.linearRampToValueAtTime(1, attack);
	var release = t+this.chirpLength/1000 * chirpCut;
	var releaseDur = 0.02;
	this.chirperGain.gain.setTargetAtTime(0, Math.max(attack + releaseDur, release), releaseDur);

	this.eachOsc(function (osc) {
		osc.frequency.cancelScheduledValues(t);
		osc.frequency.setValueAtTime(this.frequency, t);
		// osc.frequency.linearRampToValueAtTime(this.frequency + this.chirpFreqRamp, t+this.chirpLength/1000);
		var size = 512;
		var values = new Float32Array(size);
		var range = this.chirpFreqRange * chirpCut;
		var scale = this.chirpFreqRamp;
		var freq = this.frequency;
		// var freq = this.frequency + Math.random()*100;
		for (var i = 0; i < size; i++) {
			var x = (i/size*range*2 - 1);
			values[i] = freq + Math.sqrt(1 - x*x) * scale * freq;
		}
		osc.frequency.setValueCurveAtTime(values, t, this.chirpLength*chirpCut/1000)
	});

	this.chirpCount++;
}

Bird.prototype.eachOsc = function (callback) {
	var oscs = [this.square, this.sawtooth, this.triangle];
	for (var i = 0; i < oscs.length; i++) {
		callback.call(this, oscs[i]);
	}
}

Bird.prototype.sing = function () {
	this.chirpCount = 0;
	this.oscGain.gain.value = 1;
	this.singTime = Date.now();
	this.startChirping();
}

Bird.prototype.stopSing = function () {
	// this.oscGain.gain.value = 0;
	clearTimeout(this.timeout);
}

Bird.prototype.setFreq = function (freq) {
	// this.saw.frequency.value = 100 + freq*1000;
	// this.square.frequency.value = 100 + freq*1000;
	var base = 880;
	// pentatonic = [1, 1/2, 1/3, 1/4, 1/5, 1/6];
	pentatonic = [1, 32/27, 4/3, 3/2, 16/9, 2, 2*32/27, 2*4/3, 2*3/2, 2*16/9, 4];
	var f = pentatonic[Math.floor((pentatonic.length-1)*freq)]*base;

	// f = 440 + freq*1000;

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