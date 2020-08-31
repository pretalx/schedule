<template lang="pug">
.c-linear-schedule(v-scrollbar.y="")
	.bucket(v-for="({date, sessions}, index) of sessionBuckets")
		.bucket-label(:ref="getBucketName(date)", :data-date="date.toISOString()")
			.day(v-if="index > 0 && date.clone().startOf('day').diff(sessionBuckets[index - 1].date.clone().startOf('day'), 'day') > 0")  {{ date.format('dddd DD. MMMM') }}
			.time {{ date.format('LT') }}
		session(v-for="session of sessions", :session="session")
</template>
<script>
import moment from 'moment'
import Session from './Session'

export default {
	components: { Session },
	props: {
		sessions: Array,
		currentDay: Object,
		now: Object,
		scrollParent: Element
	},
	data () {
		return {
			moment,
			scrolledDay: null
		}
	},
	computed: {
		sessionBuckets () {
			const buckets = {}
			for (const session of this.sessions.filter(s => s.id)) {
				const key = session.start.toISOString()
				if (!buckets[key]) {
					buckets[key] = []
				}
				buckets[key].push(session)
			}
			return Object.entries(buckets).map(([date, sessions]) => ({date: moment(date), sessions}))
		}
	},
	watch: {
		currentDay: 'changeDay'
	},
	async mounted () {
		await this.$nextTick()
		this.observer = new IntersectionObserver(this.onIntersect, {
			root: this.scrollParent,
			rootMargin: '-45% 0px'
		})
		let lastBucket
		for (const [ref, el] of Object.entries(this.$refs)) {
			if (!ref.startsWith('bucket')) continue
			const date = moment(el[0].dataset.date)
			if (lastBucket) {
				if (lastBucket.isSame(date, 'date')) continue
			}
			lastBucket = date
			this.observer.observe(el[0])
		}
		// scroll to now
		const nowIndex = this.sessionBuckets.findIndex(bucket => this.now.isBefore(bucket.date))
		if (nowIndex < 0) return
		const nowBucket = this.sessionBuckets[Math.max(0, nowIndex - 1)]
		const scrollTop = this.$refs[this.getBucketName(nowBucket.date)]?.[0]?.offsetTop - 90
		if (this.scrollParent) {
			this.scrollParent.scrollTop = scrollTop
		} else {
			window.scroll({top: scrollTop})
		}
	},
	methods: {
		getBucketName (date) {
			return `bucket-${date.format('YYYY-MM-DD-HH-mm')}`
		},
		changeDay (day) {
			if (this.scrolledDay === day) return
			const dayBucket = this.sessionBuckets.find(bucket => day.isSame(bucket.date, 'day'))
			if (!dayBucket) return
			const el = this.$refs[this.getBucketName(dayBucket.date)]?.[0]
			if (!el) return
			const scrollTop = el.offsetTop - 8
			if (this.scrollParent) {
				this.scrollParent.scrollTop = scrollTop
			} else {
				window.scroll({top: scrollTop})
			}
		},
		onIntersect (results) {
			const intersection = results[0]
			const day = moment(intersection.target.dataset.date).startOf('day')
			if (intersection.isIntersecting) {
				this.scrolledDay = day
				this.$emit('changeDay', this.scrolledDay)
			} else if ((intersection.boundingClientRect.y - intersection.rootBounds.y) > 0) {
				this.scrolledDay = day.subtract(1, 'day')
				this.$emit('changeDay', this.scrolledDay)
			}
		}
	}
}
</script>
<style lang="stylus">
.c-linear-schedule
	display: flex
	flex-direction: column
	min-height: 0
	.bucket
		padding-top: 8px
		.bucket-label
			font-size: 14px
			font-weight: 500
			color: $clr-secondary-text-light
			padding-left: 16px
</style>
