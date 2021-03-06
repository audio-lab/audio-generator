'use strict';

var Generator = require('./stream');
var Speaker = require('audio-speaker');
var assert = require('assert');
var Sink = require('audio-sink');
var test = require('tst');
var Source = require('./pull');
var pull = require('pull-stream');
// var Through = require('audio-through');
// var util = require('audio-buffer-utils');


test('Panned wave', function (done) {
	var generator = Generator(
		function (time) {
			return [Math.sin(Math.PI * 2 * time * 439), Math.sin(Math.PI * 2 * time * 441)];
		},
		{
			duration: .5
		}
	).on('end', done);

	generator.pipe(Speaker());
});


test('Left channel noise', function (done) {
	var generator = Generator({
		generate: function (time) {
			return Math.random();
		},
		duration: .5
	}).on('end', done);

	var speaker = Speaker();

	generator.pipe(speaker);
});

test('Sin noise', function (done) {
	var generator = Generator({
		generate: function (time) {
			var noise = Math.random() * 2 - 1;
			var f = 400;
			return Math.sin(Math.PI * 2 * time * f) * 0.5 + noise * 0.5;
		},
		duration: .5
	}).on('end', done);

	var speaker = Speaker();

	generator.pipe(speaker);
});

test('Saw', function (done) {
	Generator(function (time, n) {
		return time*100;
	}, { period: 1/100, duration: .5 })
	.on('end', done)
	.pipe(Speaker())
});

test('Pulse', function (done) {
	Generator(function (time, n) {
		return time < 0.00005 ? 1 : 0;
	}, { frequency: 440, duration: 1 })
	.pipe(Speaker());

	setTimeout(done, 1000)
});


test.skip('setFunction', function (done) {
	Generator(function (time) {
		if (time > 0.1) {
			this.period = 1/440;
			this.setFunction(function (time) {
				return time > this.period / 2 ? 1 : -1;
			});
		}

		return Math.sin(Math.PI * 2 * time * 440);
	}, {duration: 1})
	.pipe(Speaker());

	setTimeout(done, 300);
});

test('Errors in processing, throw errors', function (done) {
	Generator(function (time) {
		if (time > 0.0001) {
			throw Error(123);
		}
		if (time > 0.0002) {
			return null;
		}
	})
	.on('error', function (e) {
		assert.equal(e.message, 123);
		// console.error(e);
	})
	.on('end', done)
	.pipe(Sink());
});


test('Pull-stream', function (done) {
	let src = Source(Math.random);
	let count = 0;

	pull(
		src,
		pull.asyncMap((buf, cb) => {
			if (++count >= 5) {
				return src.abort();
			}
			setTimeout(() => {
				cb(null, buf);
			}, 10);
		}),
		pull.drain()
	);

	setTimeout(() => {
		assert.equal(count, 5);
		done();
	}, 200);
});
