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
		if(buffer){
			this.convolver.buffer = buffer;
		}
	}, this);

	this.chirperGain = ctx.createGain();
	this.chirperGain.gain.setValueAtTime(0, ctx.currentTime);
	this.chirperGain.connect(dryReverb);
	this.chirperGain.connect(this.convolver);

	this.chirpDelay = 200;
	this.chirpLength = 100;
	this.chirpFreqRange = 1;
	this.chirpFreqRamp = 1;
	this.chirpCut = 0.5;
	this.chirpCutCount = 1;

	this.attack = 40;
	this.release = 40;

	this.oscGain = ctx.createGain();
	this.oscGain.gain.value = 0.3;
	this.oscGain.connect(this.chirperGain);

	this.squareGain = ctx.createGain();
	this.squareGain.connect(this.chirperGain);
	this.square = ctx.createBufferSource();
	this.square.loop = true;
	this.square.start();
	
	this.square.connect(this.squareGain);
	var raven = game.add.audio("raven");
	raven.onDecoded.add(function () {
		var buffer = game.cache.getSoundData("raven");
		this.square.buffer = buffer;
	}, this);

	this.triangleGain = ctx.createGain();
	this.triangleGain.connect(this.oscGain);
	this.triangle = ctx.createOscillator();
	this.triangle.type = 'triangle';
	this.triangle.start();
	this.triangle.connect(this.triangleGain);

	this.sawtoothGain = ctx.createGain();
	this.sawtoothGain.connect(this.oscGain);
	this.sawtooth = ctx.createOscillator();
	this.sawtooth.type = 'sawtooth';
	this.sawtooth.start();
	this.sawtooth.connect(this.sawtoothGain);

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
	this.onStartSinging = new Phaser.Signal();

	this.useScale = true;
	this.song = [];
	this.userSong = [];

	this.listen = false;

	this.deltaMaxDelay = 75;
	this.deltaMaxLength = 75;
	this.deltaMaxRange = 0.15
	this.deltaMaxRamp = 0.2;
	this.deltaMaxCut = 0.2;
}

Bird.prototype.startChirping = function () {
	var _this = this;

	this.chirping = true;
	if(this.stopChirp){
		if(this.singingSong){
			this.onDoneSinging.dispatch();
			this.singingSong = false;
		}
		this.chirping = false;
		this.stopChirp = false;
		return;
	}

	var notToday = false;
	if(this.singingSong){
		if(this.song[this.songPointer] === false)
			notToday = true;
		else 
			this.setFreq(this.song[this.songPointer]);
		this.songPointer++;
		if(this.songPointer == this.song.length){
			this.stopSing();
		}
	}

	chirpCut = 1;
	if(this.chirpCount >= this.chirpCutCount)
		chirpCut = this.chirpCut;

	// this.userSong.push(this.frequency);

	chirpTotalLength = this.chirpLength*chirpCut + this.chirpDelay;
	this.timeout = setTimeout(function () {
		_this.startChirping();
	}, chirpTotalLength);

	var t = this.ctx.currentTime;
	var attack = t+this.attack/1000;
	var release = t+this.chirpLength/1000 * chirpCut;
	var releaseDur = this.release/1000;
	this.chirperGain.gain.cancelScheduledValues(t);
	this.chirperGain.gain.setValueAtTime(0, t);
	if(!notToday){
		this.chirperGain.gain.linearRampToValueAtTime(1, attack);
		// this.chirperGain.gain.setTargetAtTime(0, release, releaseDur);
		this.chirperGain.gain.setTargetAtTime(0, Math.max(attack + releaseDur, release), releaseDur);
	}
	else {
		this.chirpCount = -1;
	}

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
	if(!this.userSingingSongEventDispatched && dt > 300){
		this.userSingingSongEventDispatched = true;
		this.onDoneSinging.dispatch(this.chirpCount);
	}
	// if(!this.userSingingSongEventDispatched && this.userSong.length > 0){
	// 	if(this.userSong[this.userSong.length-1] !== false){
	// 		this.userSong.push(false);
	// 	}
	// }
}

Bird.prototype.eachOsc = function (callback) {
	// var oscs = [this.sawtooth, this.triangle];
	var oscs = [this.square, this.sawtooth, this.triangle];
	for (var i = 0; i < oscs.length; i++) {
		callback.call(this, oscs[i]);
	}
}

Bird.prototype.sing = function () {
	this.onStartSinging.dispatch();
	this.chirpCount = 0;
	this.singTime = Date.now();
	this.userSingingSongEventDispatched = true;
	if(!this.chirping){
		this.startChirping();
	}
}

Bird.prototype.stopSing = function () {
	this.stopSingTime = Date.now();
	this.userSingingSongEventDispatched = false;
	if(this.chirping)
		this.stopChirp = true;
}

Bird.prototype.setFreq = function (freq) {
	var base = 523.25;
	// pentatonic = [1, 1/2, 1/3, 1/4, 1/5, 1/6];
	mult = 1;
	if(freq > 1){
		mult = 2;
		freq -= 1;
	}
	pentatonic = [4/3, 3/2, 16/9, 2, 2*32/27, 2*4/3, 2*3/2, 2*16/9];
	var f = pentatonic[Math.floor((pentatonic.length-1)*freq)]*base;

	if(!this.useScale){
		f = base + freq*1000;
	}

	this.frequency = f*mult;
}

Bird.prototype.setChirpLength = function (value) {
	this.chirpLength = this.attack*2 + value * 300;
}
Bird.prototype.setChirpDelay = function (value) {
	this.chirpDelay = 160 + value * 300;
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

Bird.prototype.setSettings = function (values) {
	values = values === undefined ? {} : values;
	if(values.chirpLength !== undefined)
		this.setChirpLength(values.chirpLength);
	if(values.chirpDelay !== undefined)
		this.setChirpDelay(values.chirpDelay);
	if(values.chirpFreqRamp !== undefined)
		this.setChirpFreqRamp(values.chirpFreqRamp);
	if(values.chirpFreqRange !== undefined)
		this.setChirpFreqRange(values.chirpFreqRange);
	if(values.chirpCut !== undefined)
		this.setChirpCut(values.chirpCut);

	if(values.croak !== undefined){
		if(values.croak === 1)
			this.setColor(1, 0, 0);
		else
			this.setColor(0, 0.2, 0.8);
	}
}

Bird.prototype.shuffle = function (values, otherBird, settings) {
	values = values === undefined ? {} : values;

	// this.deltaMaxDelay = 75;
	// this.deltaMaxLength = 75;
	// this.deltaMaxRange = 0.15
	// this.deltaMaxRamp = 0.2;
	// this.deltaMaxCut = 0.15;

	if(values.chirpLength){
		do
			this.setChirpLength(settings.chirpLength = Math.random());
		while(this.compare(otherBird).circle);
	}
	if(values.chirpDelay){
		do
			this.setChirpDelay(settings.chirpDelay = Math.random());
		while(this.compare(otherBird).circle);
	}
	if(values.chirpFreqRamp){
		do
			this.setChirpFreqRamp(settings.chirpFreqRamp = Math.random());
		while(this.compare(otherBird).square);
	}
	if(values.chirpFreqRange){
		do
			this.setChirpFreqRange(settings.chirpFreqRange = Math.random());
		while(this.compare(otherBird).square);
	}
	if(values.chirpCut){
		do
			this.setChirpCut(settings.chirpCut = Math.random());
		while(this.compare(otherBird).cut);
	}
	if(values.croak == 1){ // nastaví náhodně
		if(Math.random() > 0.5){
			this.setColor(1, 0, 0);
			settings.croak = 1;
		}
		else {
			var c = 0.8;
			this.setColor(0, 1-c, c);
			settings.croak = 0;
		}
	}
	if(values.croak == 2){ // nastaví opak
		if(settings.croak > 0.5){
			var c = 0.8;
			this.setColor(0, 1-c, c);
			settings.croak = 0;
		}
		else {
			this.setColor(1, 0, 0);
			settings.croak = 1;
		}
	}
}

Bird.prototype.randomize = function (values) {
	console.log(values);
	values = values === undefined ? {} : values;
	if(values.chirpLength !== false)
		this.setChirpLength(values.chirpLength = values.chirpLength === undefined ? Math.random() : utils.random(values.chirpLength.min, values.chirpLength.max));
	if(values.chirpDelay !== false)
		this.setChirpDelay(values.chirpDelay = values.chirpDelay === undefined ? Math.random() : utils.random(values.chirpDelay.min, values.chirpDelay.max));
	if(values.chirpFreqRamp !== false)
		this.setChirpFreqRamp(values.chirpFreqRamp = values.chirpFreqRamp === undefined ? Math.random() : utils.random(values.chirpFreqRamp.min, values.chirpFreqRamp.max));
	if(values.chirpFreqRange !== false)
		this.setChirpFreqRange(values.chirpFreqRange = values.chirpFreqRange === undefined ? Math.random() : utils.random(values.chirpFreqRange.min, values.chirpFreqRange.max));

	if(values.chirpCut !== false){
		var cut = Math.random() > 0.7 ? 1 : Math.random();
		this.setChirpCut(values.chirpCut = values.chirpCut === undefined ? cut : utils.random(values.chirpCut.min, values.chirpCut.max));
	}

	if(values.croak === undefined){
		values.color = {};
		if(Math.random() > 0.5){
			this.setColor(1, 0, 0);
			values.croak = 1;
		}
		else {
			var c = 0.8;
			this.setColor(0, 1-c, c);
			values.croak = 0;
		}
	}
	else {
		if(values.croak !== false){
			if(values.croak === 1)
				this.setColor(1, 0, 0);
			else
				this.setColor(0, 0.2, 0.8);
		}
	}

	this.song = [];
	var chirpTotalLength = this.chirpDelay + this.chirpLength*this.chirpCut;
	var songLength = utils.random(2000, 2500) - this.chirpLength;
	var songChirps = utils.randomInt(3, 5);
	// var songChirps = Math.round(songLength/chirpTotalLength);
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

Bird.prototype.singSong = function (song) {
	if(song !== undefined)
		this.song = song;
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
		circle: deltaDelay+deltaLength < this.deltaMaxDelay+this.deltaMaxLength,
		croak: this.squareGain.gain.value == bird.squareGain.gain.value,
		square: deltaRange < this.deltaMaxRange && deltaRamp < this.deltaMaxRamp,
		cut: deltaCut < this.deltaMaxCut
	};
}

Bird.prototype.copySettings = function (bird) {
	this.chirpDelay = bird.chirpDelay;
	this.chirpLength = bird.chirpLength;
	this.chirpFreqRange = bird.chirpFreqRange;
	this.chirpFreqRamp = bird.chirpFreqRamp;
	this.chirpCut = bird.chirpCut;

	this.squareGain.gain.value = bird.squareGain.gain.value;
	this.sawtoothGain.gain.value = bird.sawtoothGain.gain.value;
	this.triangleGain.gain.value = bird.triangleGain.gain.value;
}