function Bird(ctx, destination) {
	this.ctx = ctx;

	var dryReverb = ctx.createGain();
	dryReverb.gain.value = 0.5;
	dryReverb.connect(destination);

	this.bins = new Float32Array(32);
	this.analyser = ctx.createAnalyser();
	this.analyser.fftSize = 32;
	this.analyser.connect(dryReverb);
	
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
	this.chirperGain.connect(this.analyser);
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
	this.squareGain.gain.value = 1;
	this.squareGain.connect(this.oscGain);
	// this.square = ctx.createOscillator();
	this.square = ctx.createBufferSource();
	this.square.loop = true;
	this.square.start();
	// this.square.type = 'square';
	
	this.square.connect(this.squareGain);
	var raven = game.add.audio("raven");
	game.sound.decode("raven", impulse);
	raven.onDecoded.add(function () {
		var buffer = game.cache.getSoundData("raven");
		this.square.buffer = buffer;
	}, this);

	this.triangleGain = ctx.createGain();
	this.triangleGain.gain.value = 0;
	this.triangleGain.connect(this.oscGain);
	this.triangle = ctx.createOscillator();
	this.triangle.type = 'triangle';
	this.triangle.start();
	this.triangle.connect(this.triangleGain);

	this.sawtoothGain = ctx.createGain();
	this.sawtoothGain.gain.value = 0;
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
	this.stopSingTime = 0;
	this.chirpTime = 0;
	this.chirpCount = 0;
	this.chirping = false;
	this.stopChirp = false;
	this.singingSong = false;
	this.userSingingSongEventDispatched = true;

	this.onDoneSinging = new Phaser.Signal();

	this.useScale = true;
	this.song = [];

	this.listen = false;
}

Bird.prototype.startChirping = function () {
	var _this = this;

	this.chirping = true;
	if(this.stopChirp){
		this.chirping = false;
		this.stopChirp = false;
		return;
	}

	if(this.singingSong){
		this.setFreq(this.song[this.songPointer]);
		this.songPointer++;
		if(this.songPointer == this.song.length){
			this.onDoneSinging.dispatch();
			this.singingSong = false;
			this.stopSing();
		}
	}

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
		var prop = "frequency";
		var scaleRate = 1;
		// console.log(osc)
		// audiobuffer
		if(osc instanceof AudioBufferSourceNode){
			prop = "playbackRate";
			scaleRate = 1/1000;
			var startRate = this.frequency * scaleRate;
			var endRate = startRate + (-this.chirpFreqRamp + 0.2);
			osc.playbackRate.cancelScheduledValues(t);
			osc.playbackRate.setValueAtTime(startRate, t);
			var dur = this.chirpLength*chirpCut*(this.chirpFreqRange-0.2)/1000;
			osc.playbackRate.linearRampToValueAtTime(endRate, t + dur);
		}
		else { // oscillator
			osc[prop].cancelScheduledValues(t);
			osc[prop].setValueAtTime(this.frequency, t);
			// osc.frequency.linearRampToValueAtTime(this.frequency + this.chirpFreqRamp, t+this.chirpLength/1000);
			var size = 512;
			var values = new Float32Array(size);
			var range = this.chirpFreqRange * chirpCut;
			var scale = this.chirpFreqRamp;
			var freq = this.frequency * scaleRate;
			// var freq = this.frequency + Math.random()*100;
			for (var i = 0; i < size; i++) {
				var x = (i/size*range*2 - 1);
				values[i] = freq + Math.sqrt(1 - x*x) * scale * freq;
			}
			osc[prop].setValueCurveAtTime(values, t, this.chirpLength*chirpCut/1000)
		}
	});

	this.chirpCount++;
}

Bird.prototype.update = function () {
	var dt = Date.now() - this.stopSingTime;
	if(!this.userSingingSongEventDispatched && dt > 1000){
		this.userSingingSongEventDispatched = true;
		this.onDoneSinging.dispatch();
	}
}

Bird.prototype.eachOsc = function (callback) {
	// var oscs = [this.sawtooth, this.triangle];
	var oscs = [this.square, this.sawtooth, this.triangle];
	for (var i = 0; i < oscs.length; i++) {
		callback.call(this, oscs[i]);
	}
}

Bird.prototype.sing = function () {
	this.chirpCount = 0;
	this.oscGain.gain.value = 1;
	this.singTime = Date.now();
	this.userSingingSongEventDispatched = true;
	if(!this.chirping){
		this.startChirping();
	}
}

Bird.prototype.stopSing = function () {
	// this.oscGain.gain.value = 0;
	this.stopSingTime = Date.now();
	this.userSingingSongEventDispatched = false;
	if(this.chirping)
		this.stopChirp = true;
}

Bird.prototype.setFreq = function (freq) {
	var base = 880;
	// pentatonic = [1, 1/2, 1/3, 1/4, 1/5, 1/6];
	pentatonic = [4/3, 3/2, 16/9, 2, 2*32/27, 2*4/3, 2*3/2, 2*16/9];
	var f = pentatonic[Math.floor((pentatonic.length-1)*freq)]*base;

	if(!this.useScale){
		f = base + freq*1000;
	}

	this.frequency = f;
}

Bird.prototype.setChirpLength = function (value) {
	this.chirpLength = ((0.05 + value)*0.7) * 1000;
}
Bird.prototype.setChirpDelay = function (value) {
	this.chirpDelay = (0.2 + value) * 400;
}
Bird.prototype.setChirpFreqRamp = function (value) {
	this.chirpFreqRamp = value - 0.2;
}
Bird.prototype.setChirpFreqRange = function (value) {
	this.chirpFreqRange = 0.5+value*0.5;
}
Bird.prototype.setChirpCut = function (value) {
	this.chirpCut = value*0.9+0.1;
}

Bird.prototype.setColor = function (sq, sw, tr) {
	var sum = sq + sw + tr;
	if(sum == 0)
		return;
	this.squareGain.gain.value = sq/sum;
	this.sawtoothGain.gain.value = sw/sum;
	this.triangleGain.gain.value = tr/sum;
}

Bird.prototype.setScale = function (value) {
	this.useScale = value > 0.5;
}

Bird.prototype.randomize = function (values) {
	values = values === undefined ? {} : values;
	this.setChirpLength(values.chirpLength = values.chirpLength === undefined ? Math.random() : utils.random(values.chirpLength.min, values.chirpLength.max));
	this.setChirpDelay(values.chirpDelay = values.chirpDelay === undefined ? Math.random() : utils.random(values.chirpDelay.min, values.chirpDelay.max));
	this.setChirpFreqRamp(values.chirpFreqRamp = values.chirpFreqRamp === undefined ? Math.random() : utils.random(values.chirpFreqRamp.min, values.chirpFreqRamp.max));
	this.setChirpFreqRange(values.chirpFreqRange = values.chirpFreqRange === undefined ? Math.random() : utils.random(values.chirpFreqRange.min, values.chirpFreqRange.max));
	var cut = Math.random() > 0.7 ? 1 : Math.random();
	this.setChirpCut(values.chirpCut = values.chirpCut === undefined ? cut : utils.random(values.chirpCut.min, values.chirpCut.max));

	if(values.color === undefined){
		values.color = {};
		if(Math.random() > 0.5){
			this.setColor(1, 0, 0);
			values.color.sq = 1;
			values.color.sw = 1;
			values.color.tr = 1;
		}
		else {
			var c = 0.8;
			this.setColor(0, 1-c, c);
			values.color.sq = 0;
			values.color.sw = 1-c;
			values.color.tr = c;
		}
	}
	else {
		this.setColor(
				values.color.sq = utils.random(values.color.sq.min, values.color.sq.max),
				values.color.sw = utils.random(values.color.sw.min, values.color.sw.max),
				values.color.tr = utils.random(values.color.tr.min, values.color.tr.max)
			);
	}

	this.song = [];
	var chirpTotalLength = this.chirpDelay + this.chirpLength*this.chirpCut;
	var songLength = utils.random(2000, 3000) - this.chirpLength;
	var songChirps = Math.round(songLength/chirpTotalLength);
	var repeating = Math.random();
	// console.log(repeating);
	for (var i = 0; i < songChirps; i++) {
		if(Math.random() > repeating || i == 0)
			this.song.push(Math.random());
		else
			this.song.push(this.song[i-1]);
	}

	return values;
}

Bird.prototype.singSong = function () {
	// console.log(this.song);
	this.songPointer = 0;
	this.singingSong = true;
	this.sing();
}

Bird.prototype.compare = function (bird) {
	var deltaDelay = Math.abs(this.chirpDelay - bird.chirpDelay);
	var deltaLength = Math.abs(this.chirpLength - bird.chirpLength);
	var deltaRange = Math.abs(this.chirpFreqRange - bird.chirpFreqRange);
	var deltaRamp = Math.abs(this.chirpFreqRamp - bird.chirpFreqRamp);
	var deltaCut = Math.abs(this.chirpCut - bird.chirpCut);
	console.log("deltaDelay", deltaDelay);
	console.log("deltaLength", deltaLength);
	console.log("deltaRange", deltaRange);
	console.log("deltaRamp", deltaRamp);
	console.log("deltaCut", deltaCut);

	return {
		circle: deltaDelay+deltaLength < 150,
		croak: this.squareGain.gain.value == bird.squareGain.gain.value,
		square: deltaRange < 0.15 && deltaRamp < 0.2,
		cut: deltaCut < 0.15
	};
}