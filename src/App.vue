<template lang="pug">
.pretalx-schedule
	template(v-if="schedule")
		bunt-tabs.days(v-if="days && days.length > 1", :active-tab="currentDay.toISOString()", ref="tabs")
			bunt-tab(v-for="day in days", :id="day.toISOString()", :header="moment(day).format('dddd DD. MMMM')", @selected="changeDay(day)")
		grid-schedule(v-if="containerWidth > 992 && format !== 'list'",
			:schedule="schedule",
			:sessions="sessions",
			:currentDay="currentDay",
			:now="now",
			@changeDay="currentDay = $event")
		linear-schedule(v-else,
			:schedule="schedule",
			:sessions="sessions",
			:currentDay="currentDay",
			:now="now",
			@changeDay="changeDayByScroll")
	bunt-progress-circular(v-else, size="huge", :page="true")
</template>
<script>
import Vue from 'vue'
import Buntpapier from 'buntpapier'
import moment from 'moment'
import LinearSchedule from 'components/LinearSchedule'
import GridSchedule from 'components/GridSchedule'

Vue.use(Buntpapier)

export default {
	name: 'PretalxSchedule',
	components: { LinearSchedule, GridSchedule },
	props: {
		eventUrl: String,
		locale: String,
		format: {
			type: String,
			default: 'grid'
		},
		version: {
			type: String,
			default: ''
		}
	},
	provide () {
		return {
			eventUrl: this.eventUrl
		}
	},
	data () {
		return {
			moment,
			containerWidth: Infinity,
			schedule: null,
			now: moment(),
			currentDay: moment().startOf('day')
		}
	},
	computed: {
		roomsLookup () {
			if (!this.schedule) return {}
			return this.schedule.rooms.reduce((acc, room) => { acc[room.id] = room; return acc }, {})
		},
		tracksLookup () {
			if (!this.schedule) return {}
			return this.schedule.tracks.reduce((acc, t) => { acc[t.id] = t; return acc }, {})
		},
		speakersLookup () {
			if (!this.schedule) return {}
			return this.schedule.speakers.reduce((acc, s) => { acc[s.code] = s; return acc }, {})
		},
		sessions () {
			if (!this.schedule) return
			const sessions = []
			for (const session of this.schedule.talks) {
				sessions.push({
					id: session.code,
					title: session.title,
					abstract: session.abstract,
					start: moment(session.start),
					end: moment(session.end),
					speakers: session.speakers?.map(s => this.speakersLookup[s]),
					track: this.tracksLookup[session.track],
					room: this.roomsLookup[session.room]
				})
			}
			sessions.sort((a, b) => a.start.diff(b.start))
			return sessions
		},
		days () {
			if (!this.sessions) return
			const days = []
			for (const session of this.sessions) {
				if (days[days.length - 1] && days[days.length - 1].isSame(session.start, 'day')) continue
				days.push(session.start.clone().startOf('day'))
			}
			return days
		},
	},
	async created () {
		moment.locale(this.locale)
		setInterval(() => this.now = moment(), 30000)
		let url = `${this.eventUrl}schedule/widget/v2.json`
		if (this.version)
			url += `?v=${this.version}`
		this.schedule = await (await fetch(url)).json()
	},
	mounted () {
		this.resizeObserver = new ResizeObserver(this.onResize)
		this.resizeObserver.observe(this.$el)
		this.containerWidth = this.$el.offsetWidth
	},
	methods: {
		changeDay (day) {
			if (day.isSame(this.currentDay)) return
			this.currentDay = day
		},
		changeDayByScroll (day) {
			this.currentDay = day
			const tabEl = this.$refs.tabs.$refs.tabElements.find(el => el.id === day.toISOString())
			// TODO smooth scroll, seems to not work with chrome {behavior: 'smooth', block: 'center', inline: 'center'}
			tabEl?.$el.scrollIntoView()
		},
		onResize (entries) {
			this.containerWidth = entries[0].contentRect.width
		}
	}
}
</script>
<style lang="stylus">
@import 'styles/global.styl'
.pretalx-schedule
	display: flex
	flex-direction: column
	min-height: 0
	min-width: 0
	height: 100%
	font-size: 14px
	.days
		background-color: $clr-white
		tabs-style(active-color: var(--pretalx-clr-primary), indicator-color: var(--pretalx-clr-primary), background-color: transparent)

		position: sticky
		top: 0

		margin-bottom: 0
		flex: none
		min-width: 0
		height: 48px
		z-index: 30
		.bunt-tabs-header
			min-width: min-content
		.bunt-tabs-header-items
			justify-content: center
			min-width: min-content
			.bunt-tab-header-item
				min-width: min-content
			.bunt-tab-header-item-text
				white-space: nowrap
</style>
