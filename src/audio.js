// Ripped from:
// https://brandnewbox.com/inthestacks/

const notes = {
	C: 261.63,
	Db: 277.18,
	D: 293.66,
	Eb: 311.13,
	E: 329.63,
	F: 349.23,
	Gb: 369.99,
	G: 392.00,
	Ab: 415.30,
	A: 440,
	Bb: 466.16,
	B: 493.88,
	// C: 523.25
}

const config = {
	tempo: 140,
	gain: 0.5,
	waveform: 'sine',

	note: {
		attack: 0.3,
		sustain: 0.8,
		release: 0.3,
		length: 0.2,
	},

	vibrato: {
		speed: 10,
		amount: 0
	},

	delayTime: 0.65,
	delayAmount: 0.05,
	feedback: 0.05
}

export class SchedulePlayer {
	constructor (schedule) {
		this.notes = []
		this.timerId = setInterval(
			() => this.tick(),
			60 / config.tempo * 1000
		)
		this.ctx = new AudioContext()

		this.master = this.ctx.createGain()
		this.master.connect(this.ctx.destination)
		this.master.gain.value = config.gain

		this.delay = this.ctx.createDelay()
		this.feedback = this.ctx.createGain()
		this.delayAmount = this.ctx.createGain()

		this.delayAmount.connect(this.delay)
		this.delay.connect(this.feedback)
		this.feedback.connect(this.delay)
		this.delay.connect(this.master)

		this.delay.delayTime.value = config.delayTime
		this.delayAmount.gain.value = config.delayAmount
		this.feedback.gain.value = config.feedback

		this.currentNote = 0

		this.setSchedule(schedule)
	}

	setSchedule (schedule) {
		this.notes = [
			notes.C,
			notes.C,
			notes.D,
			notes.G,
		]
	}

	start () {
		console.debug('SchedulePlayer: start')
	}

	tick () {
		console.log('tock')

		if (this.notes.length === 0) return

		this.currentNote = (this.currentNote + 1) % this.notes.length
		this.playNote(this.notes[this.currentNote])
	}

	stop () {
		console.debug('SchedulePlayer: stop')
		if (this.timerId) clearInterval(this.timerId)
	}

	/** @param {number} frequency */
	playNote (frequency) {
		console.debug('SchedulePlayer: play %d', frequency)

		const { currentTime } = this.ctx
		const { note, vibrato, waveform } = config

		const osc = this.ctx.createOscillator()
		const noteGain = this.ctx.createGain()

		noteGain.gain.setValueAtTime(0, 0)
		noteGain.gain.linearRampToValueAtTime(note.sustain, currentTime + note.length * note.attack)
		noteGain.gain.setValueAtTime(note.sustain, currentTime + note.length - note.length * note.release)
		noteGain.gain.linearRampToValueAtTime(0, currentTime + note.length)

		const lfoGain = this.ctx.createGain()
		lfoGain.gain.setValueAtTime(vibrato.amount, 0)
		lfoGain.connect(osc.frequency)

		const lfo = this.ctx.createOscillator()
		lfo.frequency.setValueAtTime(vibrato.speed, 0)
		lfo.start(0)
		lfo.stop(currentTime + note.length)
		lfo.connect(lfoGain)

		osc.type = waveform
		osc.frequency.setValueAtTime(frequency, 0)
		osc.start(0)
		osc.stop(currentTime + note.length)
		osc.connect(noteGain)

		noteGain.connect(this.master)
		noteGain.connect(this.delay)
	}
}
