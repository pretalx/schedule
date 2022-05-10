<template lang="pug">
.pretalx-schedule(:style="{'--scrollparent-width': scrollParentWidth + 'px', '--schedule-max-width': scheduleMaxWidth + 'px'}", :class="showGrid ? ['grid-schedule'] : ['list-schedule']")
	template(v-if="schedule && sessions")
		.settings
			template(v-if="!inEventTimezone")
				bunt-select(name="timezone", :options="[{id: schedule.timezone, label: schedule.timezone}, {id: userTimezone, label: userTimezone}]", v-model="currentTimezone", @blur="saveTimezone")
			template(v-else)
				div.timezone-label.bunt-tab-header-item(v-html="schedule.timezone")
			bunt-button.fav-toggle(v-if="favs.length", @click="onlyFavs = !onlyFavs", :class="onlyFavs ? ['active'] : []")
				svg#star(viewBox="0 0 24 24")
					polygon(
						:style="{fill: '#FFA000', stroke: '#FFA000'}"
						points="14.43,10 12,2 9.57,10 2,10 8.18,14.41 5.83,22 12,17.31 18.18,22 15.83,14.41 22,10"
					)
				template {{ favs.length }}
		bunt-tabs.days(v-if="days && days.length > 1", :active-tab="currentDay && currentDay.format()", ref="tabs" :class="showGrid? ['grid-tabs'] : ['list-tabs']")
			bunt-tab(v-for="day in days", :id="day.format()", :header="day.format(dateFormat)", @selected="changeDay(day)")
		grid-schedule(v-if="showGrid",
			:sessions="sessions",
			:rooms="schedule.rooms",
			:currentDay="currentDay",
			:now="now",
			:scrollParent="scrollParent",
			:favs="favs",
			@changeDay="currentDay = $event",
			@fav="fav($event)",
			@unfav="unfav($event)")
		linear-schedule(v-else,
			:sessions="sessions",
			:currentDay="currentDay",
			:now="now",
			:scrollParent="scrollParent",
			:favs="favs",
			@changeDay="currentDay = $event",
			@fav="fav($event)",
			@unfav="unfav($event)")
	bunt-progress-circular(v-else, size="huge", :page="true")
</template>
<script>
import Vue from 'vue'
import Buntpapier from 'buntpapier'
import moment from 'moment-timezone'
import LinearSchedule from 'components/LinearSchedule'
import GridSchedule from 'components/GridSchedule'
import { findScrollParent } from 'utils'

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
			scrollParentWidth: Infinity,
			schedule: null,
			userTimezone: null,
			now: moment(),
			currentDay: null,
			currentTimezone: null,
			favs: [],
			onlyFavs: false
		}
	},
	computed: {
		scheduleMaxWidth () {
			return this.schedule ? Math.min(this.scrollParentWidth, 78 + this.schedule.rooms.length * 650) : this.scrollParentWidth
		},
		showGrid () {
			return this.scrollParentWidth > 710 && this.format !== 'list' // if we can't fit two rooms together, switch to list
		},
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
			if (!this.schedule || !this.currentTimezone) return
			const sessions = []
			for (const session of this.schedule.talks) {
				if (this.onlyFavs && !this.favs.includes(session.code)) continue
				sessions.push({
					id: session.code,
					title: session.title,
					abstract: session.abstract,
					start: moment.tz(session.start, this.currentTimezone),
					end: moment.tz(session.end, this.currentTimezone),
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
		inEventTimezone () {
			if (!this.schedule || !this.schedule.talks) return false
			const example = this.schedule.talks[0].start
			return moment.tz(example, this.userTimezone).format('Z') === moment.tz(example, this.schedule.timezone).format('Z')
		},
		dateFormat () {
			// Defaults to dddd DD. MMMM for: all grid schedules with more than two rooms, and all list schedules with less than five days
			// After that, we start to shorten the date string, hoping to reduce unwanted scroll behaviour
			if ((this.showGrid && this.schedule && this.schedule.rooms.length > 2) || !this.days || !this.days.length) return 'dddd DD. MMMM'
			if (this.days && this.days.length <= 5) return 'dddd DD. MMMM'
			if (this.days && this.days.length <= 7) return 'dddd DD. MMM'
			return 'ddd DD. MMM'
		},
		eventSlug () {
			let url = ''
			if (this.eventUrl.startsWith('http')) {
				url = new URL(this.eventUrl)
			} else {
				url = new URL('http://example.org/' + this.eventUrl)
			}
			return url.pathname.replace(/\//g, '')
		}
	},
	async created () {
		moment.locale(this.locale)
		this.userTimezone = moment.tz.guess()
		let version = ''
		if (this.version)
			version = `v/${this.version}/`
		const url = `${this.eventUrl}schedule/${version}widget/v2.json`
		this.schedule = await (await fetch(url)).json()
		this.currentTimezone = localStorage.getItem(`${this.eventSlug}_timezone`)
		this.currentTimezone = [this.schedule.timezone, this.userTimezone].includes(this.currentTimezone) ? this.currentTimezone : this.schedule.timezone
		this.currentDay = this.days[0]
		this.now = moment().tz(this.currentTimezone)
		setInterval(() => this.now = moment().tz(this.currentTimezone), 30000)
		if (!this.scrollParentResizeObserver) {
			await this.$nextTick()
			this.onWindowResize()
		}
		this.favs = this.pruneFavs(this.loadFavs(), this.schedule)

		const fragment = window.location.hash.slice(1)
		if (fragment && fragment.length === 10) {
			const initialDay = moment(fragment, 'YYYY-MM-DD')

			const filteredDays = this.days.filter(d => d.format('YYYYMMDD') === initialDay.format('YYYYMMDD'))
			if (filteredDays.length) {
				this.currentDay = filteredDays[0]
			}
		}
	},
	async mounted () {
		// We block until we have either a regular parent or a shadow DOM parent
		await new Promise((resolve) => {
			const poll = () => {
				if (this.$el.parentElement || this.$el.getRootNode().host) return resolve()
				setTimeout(poll, 100)
			}
			poll()
		})
		this.scrollParent = findScrollParent(this.$el.parentElement || this.$el.getRootNode().host)
		if (this.scrollParent) {
			this.scrollParentResizeObserver = new ResizeObserver(this.onScrollParentResize)
			this.scrollParentResizeObserver.observe(this.scrollParent)
			this.scrollParentWidth = this.scrollParent.offsetWidth
		} else { // scrolling document
			window.addEventListener('resize', this.onWindowResize)
			this.onWindowResize()
		}
	},
	destroyed () {
		// TODO destroy observers
	},
	methods: {
		changeDay (day) {
			if (day.isSame(this.currentDay)) return
			this.currentDay = moment(day, this.currentTimezone).startOf('day')
			window.location.hash = day.format('YYYY-MM-DD')
		},
		onWindowResize () {
			this.scrollParentWidth = document.body.offsetWidth
		},
		saveTimezone () {
			localStorage.setItem(`${this.eventSlug}_timezone`, this.currentTimezone)
		},
		onScrollParentResize (entries) {
			this.scrollParentWidth = entries[0].contentRect.width
		},
		loadFavs () {
			const data = localStorage.getItem(`${this.eventSlug}_favs`)
			if (data) {
				try {
					return JSON.parse(data)
				} catch {
					localStorage.setItem(`${this.eventSlug}_favs`, '[]')
				}
			}
			return []
		},
		pruneFavs (favs, schedule) {
			const talks = schedule.talks || []
			const talkIds = talks.map(e => e.code)
			return favs.filter(e => talkIds.includes(e))
		},
		saveFavs () {
			localStorage.setItem(`${this.eventSlug}_favs`, JSON.stringify(this.favs))
		},
		fav (id) {
			if (!this.favs.includes(id)) {
				this.favs.push(id)
				this.saveFavs()
			}
		},
		unfav (id) {
			this.favs = this.favs.filter(elem => elem !== id)
			this.saveFavs()
			if (!this.favs.length) this.onlyFavs = false
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
	height: 100%
	font-size: 14px
	&.grid-schedule
		min-width: min-content
		max-width: var(--schedule-max-width)
		margin: 0 auto
	&.list-schedule
		min-width: 0
	.settings
		margin-left: 18px
		align-self: flex-start
		display: flex
		align-items: center
		position: sticky
		z-index: 100
		left: 18px
		.fav-toggle
			margin-right: 8px
			display: flex
			&.active
				border: #FFA000 2px solid
			.bunt-button-text
				display: flex
				align-items: center
			svg
				width: 20px
				height: 20px
				margin-right: 6px
		.bunt-select
			max-width: 300px
			padding-right: 8px
		.timezone-label
			cursor: default
			color: $clr-secondary-text-light
	.days
		background-color: $clr-white
		tabs-style(active-color: var(--pretalx-clr-primary), indicator-color: var(--pretalx-clr-primary), background-color: transparent)
		overflow-x: auto
		position: sticky
		top: 0
		left: 0
		margin-bottom: 0
		flex: none
		min-width: 0
		height: 48px
		z-index: 30
		&.grid-tabs
			width: var(--schedule-max-width)
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
