<template lang="pug">
.pretalx-schedule(:style="{'--scrollparent-width': scrollParentWidth + 'px', '--schedule-max-width': scheduleMaxWidth + 'px', '--pretalx-sticky-date-offset': days && days.length > 1 ? '48px' : '0px'}", :class="showGrid ? ['grid-schedule'] : ['list-schedule']")
	template(v-if="scheduleError")
		.schedule-error
			.error-message An error occurred while loading the schedule. Please try again later.
	template(v-else-if="schedule && sessions.length")
		.modal-overlay(v-if="showFilterModal", @click.stop="showFilterModal = false")
			.modal-box(@click.stop="")
				h3 Tracks
				.checkbox-line(v-for="track in allTracks", :key="track.value", :style="{'--track-color': track.color}")
					bunt-checkbox(type="checkbox", :label="track.label", :name="track.value + track.label", v-model="track.selected", :value="track.value", @input="onlyFavs = false")
					.track-description(v-if="getLocalizedString(track.description).length") {{ getLocalizedString(track.description) }}
		.settings
			bunt-button.filter-tracks(v-if="this.schedule.tracks.length", @click="showFilterModal=true")
				svg#filter(viewBox="0 0 752 752")
					path(d="m401.57 264.71h-174.75c-6.6289 0-11.84 5.2109-11.84 11.84 0 6.6289 5.2109 11.84 11.84 11.84h174.75c5.2109 17.523 21.312 30.309 40.727 30.309 18.941 0 35.52-12.785 40.254-30.309h43.098c6.6289 0 11.84-5.2109 11.84-11.84 0-6.6289-5.2109-11.84-11.84-11.84h-43.098c-5.2109-17.523-21.312-30.309-40.254-30.309-19.414 0-35.516 12.785-40.727 30.309zm58.723 11.84c0 10.418-8.5234 18.469-18.469 18.469s-18.469-8.0508-18.469-18.469 8.5234-18.469 18.469-18.469c9.4727-0.003906 18.469 8.0469 18.469 18.469z")
					path(d="m259.5 359.43h-32.676c-6.6289 0-11.84 5.2109-11.84 11.84s5.2109 11.84 11.84 11.84h32.676c5.2109 17.523 21.312 30.309 40.727 30.309 18.941 0 35.52-12.785 40.254-30.309h185.17c6.6289 0 11.84-5.2109 11.84-11.84s-5.2109-11.84-11.84-11.84h-185.17c-5.2109-17.523-21.312-30.309-40.254-30.309-19.418 0-35.52 12.785-40.73 30.309zm58.723 11.84c0 10.418-8.5234 18.469-18.469 18.469-9.9453 0-18.469-8.0508-18.469-18.469s8.5234-18.469 18.469-18.469c9.9453 0 18.469 8.0508 18.469 18.469z")
					path(d="m344.75 463.61h-117.92c-6.6289 0-11.84 5.2109-11.84 11.84s5.2109 11.84 11.84 11.84h117.92c5.2109 17.523 21.312 30.309 40.727 30.309 18.941 0 35.52-12.785 40.254-30.309h99.926c6.6289 0 11.84-5.2109 11.84-11.84s-5.2109-11.84-11.84-11.84h-99.926c-5.2109-17.523-21.312-30.309-40.254-30.309-19.418 0-35.52 12.785-40.727 30.309zm58.723 11.84c0 10.418-8.5234 18.469-18.469 18.469s-18.469-8.0508-18.469-18.469 8.5234-18.469 18.469-18.469 18.469 8.0508 18.469 18.469z")
				template Filter
				template(v-if="filteredTracks.length") ({{ filteredTracks.length }})
			bunt-button.fav-toggle(v-if="favs.length", @click="onlyFavs = !onlyFavs; if (onlyFavs) resetFilteredTracks()", :class="onlyFavs ? ['active'] : []")
				svg#star(viewBox="0 0 24 24")
					polygon(
						:style="{fill: '#FFA000', stroke: '#FFA000'}"
						points="14.43,10 12,2 9.57,10 2,10 8.18,14.41 5.83,22 12,17.31 18.18,22 15.83,14.41 22,10"
					)
				template {{ favs.length }}
			template(v-if="!inEventTimezone")
				bunt-select.timezone-item(name="timezone", :options="[{id: schedule.timezone, label: schedule.timezone}, {id: userTimezone, label: userTimezone}]", v-model="currentTimezone", @blur="saveTimezone")
			template(v-else)
				div.timezone-label.timezone-item.bunt-tab-header-item {{ schedule.timezone }}
		bunt-tabs.days(v-if="days && days.length > 1", :active-tab="currentDay && currentDay.format()", ref="tabs" :class="showGrid? ['grid-tabs'] : ['list-tabs']")
			bunt-tab(v-for="day in days", :id="day.format()", :header="day.format(dateFormat)", @selected="changeDay(day)")
		grid-schedule(v-if="showGrid",
			:sessions="sessions",
			:rooms="rooms",
			:currentDay="currentDay",
			:now="now",
			:scrollParent="scrollParent",
			:favs="favs",
			@changeDay="currentDay = $event",
			@fav="fav($event)",
			@unfav="unfav($event)")
		linear-schedule(v-else,
			:sessions="sessions",
			:rooms="rooms",
			:currentDay="currentDay",
			:now="now",
			:scrollParent="scrollParent",
			:favs="favs",
			@changeDay="currentDay = $event",
			@fav="fav($event)",
			@unfav="unfav($event)")
	bunt-progress-circular(v-else, size="huge", :page="true")
	.error-messages(v-if="errorMessages.length")
		.error-message(v-for="message in errorMessages", :key="message")
			.btn.btn-danger(@click="errorMessages = errorMessages.filter(m => m !== message)") x
			div.message {{ message }}
</template>
<script>
import Vue from 'vue'
import Buntpapier from 'buntpapier'
import moment from 'moment-timezone'
import LinearSchedule from 'components/LinearSchedule'
import GridSchedule from 'components/GridSchedule'
import { findScrollParent, getLocalizedString } from 'utils'

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
			getLocalizedString,
			scrollParentWidth: Infinity,
			schedule: null,
			userTimezone: null,
			now: moment(),
			currentDay: null,
			currentTimezone: null,
			showFilterModal: false,
			favs: [],
			allTracks: [],
			onlyFavs: false,
			scheduleError: false,
			onHomeServer: false,
			loggedIn: false,
			apiUrl: null,
			translationMessages: {},
			errorMessages: [],
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
		filteredTracks () {
			return this.allTracks.filter(t => t.selected)
		},
		speakersLookup () {
			if (!this.schedule) return {}
			return this.schedule.speakers.reduce((acc, s) => { acc[s.code] = s; return acc }, {})
		},
		sessions () {
			if (!this.schedule || !this.currentTimezone) return
			const sessions = []
			for (const session of this.schedule.talks.filter(s => s.start)) {
				if (this.onlyFavs && !this.favs.includes(session.code)) continue
				if (this.filteredTracks && this.filteredTracks.length && !this.filteredTracks.find(t => t.id === session.track)) continue
				sessions.push({
					id: session.code,
					title: session.title,
					abstract: session.abstract,
					do_not_record: session.do_not_record,
					start: moment.tz(session.start, this.currentTimezone),
					end: moment.tz(session.end, this.currentTimezone),
					speakers: session.speakers?.map(s => this.speakersLookup[s]),
					track: this.tracksLookup[session.track],
					room: this.roomsLookup[session.room],
					tags: session.tags
				})
			}
			sessions.sort((a, b) => a.start.diff(b.start))
			return sessions
		},
		rooms () {
			return this.schedule.rooms.filter(r => this.sessions.some(s => s.room === r))
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
			if (!this.schedule?.talks?.length) return false
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
		const url = `${this.eventUrl}schedule/${version}widgets/schedule.json`
		const legacyUrl = `${this.eventUrl}schedule/${version}widget/v2.json`
		// fetch from url, but fall back to legacyUrl if url fails
		try {
			this.schedule = await (await fetch(url)).json()
		} catch (e) {
			try {
				this.schedule = await (await fetch(legacyUrl)).json()
			} catch (e) {
				this.scheduleError = true
				return
			}
		}
		if (!this.schedule.talks.length) {
			this.scheduleError = true
			return
		}
		this.currentTimezone = localStorage.getItem(`${this.eventSlug}_timezone`)
		this.currentTimezone = [this.schedule.timezone, this.userTimezone].includes(this.currentTimezone) ? this.currentTimezone : this.schedule.timezone
		this.currentDay = this.days[0]
		this.now = moment().tz(this.currentTimezone)
		setInterval(() => this.now = moment().tz(this.currentTimezone), 30000)
		if (!this.scrollParentResizeObserver) {
			await this.$nextTick()
			this.onWindowResize()
		}
		this.schedule.tracks.forEach(t => { t.value = t.id; t.label = getLocalizedString(t.name); this.allTracks.push(t) })

		// set API URL before loading favs
		this.apiUrl = window.location.origin + '/api/events/' + this.eventSlug + '/'
		this.favs = this.pruneFavs(await this.loadFavs(), this.schedule)

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
		/* global PRETALX_MESSAGES */
		if (typeof PRETALX_MESSAGES !== 'undefined') {
			this.translationMessages = PRETALX_MESSAGES
			// this variable being present indicates that we're running on our home instance rather than as an embedded widget elsewhere
			this.onHomeServer = true
			if (document.querySelector('#pretalx-messages')?.dataset.loggedIn === 'true') {
				this.loggedIn = true
			}
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
		async apiRequest (path, method, data) {
			const url = `${this.apiUrl}${path}`
			const headers = new Headers()
			headers.append('Content-Type', 'application/json')
			if (method === 'POST' || method === 'DELETE') headers.append('X-CSRFToken', document.cookie.split('pretalx_csrftoken=').pop().split(';').shift())
			const response = await fetch(url, {
				method,
				headers,
				body: JSON.stringify(data),
				credentials: 'same-origin'
			})
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			return response.json()
		},
		async loadFavs () {
			const data = localStorage.getItem(`${this.eventSlug}_favs`)
			let favs = []
			if (data) {
				try {
					favs = JSON.parse(data) || []
				} catch {
					localStorage.setItem(`${this.eventSlug}_favs`, '[]')
				}
			}
			if (this.loggedIn) {
				try {
					favs = await this.apiRequest('submissions/favourites/', 'GET').then(data => {
						const toFav = favs.filter(e => !data.includes(e))
						toFav.forEach(e => this.apiRequest(`submissions/${e}/favourite/`, 'POST').catch())
						return data
					}).catch(e => {
						this.pushErrorMessage(this.translationMessages.favs_not_loaded || this.translationMessages.not_loaded)
					})
				} catch (e) {
					this.pushErrorMessage(this.translationMessages.favs_not_loaded || this.translationMessages.not_loaded)
				}
			}
			return favs
		},
		pushErrorMessage (message) {
			if (!message || !message.length) return
			if (this.errorMessages.includes(message)) return
			this.errorMessages.push(message)
		},
		pruneFavs (favs, schedule) {
			const talks = schedule.talks || []
			const talkIds = talks.map(e => e.code)
			// we're not pushing the changed list to the server, as if a talk vanished but will appear again,
			// we want it to still be faved
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
			if (this.loggedIn) {
				this.apiRequest(`submissions/${id}/favourite/`, 'POST').catch(e => {
					this.pushErrorMessage(this.translationMessages.favs_not_saved || this.translationMessages.not_saved)
				})
			} else {
				this.pushErrorMessage(this.translationMessages.favs_not_logged_in || this.translationMessages.not_logged_in)
			}
		},
		unfav (id) {
			this.favs = this.favs.filter(elem => elem !== id)
			this.saveFavs()
			if (this.loggedIn) {
				this.apiRequest(`submissions/${id}/favourite/`, 'DELETE').catch(e => {
					this.pushErrorMessage(this.translationMessages.favs_not_saved || this.translationMessages.not_saved)
				})
			} else {
				this.pushErrorMessage(this.translationMessages.favs_not_logged_in || this.translationMessages.not_logged_in)
			}
			if (!this.favs.length) this.onlyFavs = false
		},
		resetFilteredTracks () {
			this.allTracks.forEach(t => t.selected = false)
		}
	}
}
</script>
<style lang="stylus">
@import 'styles/global.styl'
.schedule-error
	color: $clr-error
	font-size: 18px
	text-align: center
	padding: 32px
	.error-message
		margin-top: 16px
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
	.modal-overlay
		position: fixed
		z-index: 1000
		top: 0
		left: 0
		width: 100%
		height: 100%
		background-color: rgba(0,0,0,0.4)
		.modal-box
			width: 600px
			max-width: calc(95% - 64px)
			border-radius: 32px
			padding: 4px 32px
			margin-top: 32px
			background: white
			margin-left: auto
			margin-right: auto
			.checkbox-line
				margin: 16px 8px
				.bunt-checkbox.checked .bunt-checkbox-box
					background-color: var(--track-color)
					border-color: var(--track-color)
				.track-description
					color: $clr-grey-600
					margin-left: 32px
	.settings
		margin-left: 18px
		align-self: flex-start
		display: flex
		align-items: center
		position: sticky
		z-index: 100
		left: 18px
		width: calc(100% - 36px)
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
		.filter-tracks
			margin-right: 8px
			display: flex
			.bunt-button-text
				display: flex
				align-items: center
				padding-right: 8px
			svg
				width: 36px
				height: 36px
				margin-right: 6px
		.bunt-select
			max-width: 300px
			padding-right: 8px
		.timezone-label
			cursor: default
			color: $clr-secondary-text-light
		.timezone-item
			margin-left: auto
	.days
		background-color: $clr-white
		tabs-style(active-color: var(--pretalx-clr-primary), indicator-color: var(--pretalx-clr-primary), background-color: transparent)
		overflow-x: auto
		position: sticky
		top: var(--pretalx-sticky-top-offset, 0px)
		left: 0
		margin-bottom: 0
		flex: none
		min-width: 0
		max-width: var(--schedule-max-width)
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
.error-messages
	position: fixed
	width: 250px
	bottom: 0
	right: 0
	padding: 12px
	z-index: 1000
	.error-message
		padding: 8px
		color: $clr-danger
		background-color: $clr-white
		border: 2px solid $clr-danger
		border-radius: 6px
		box-shadow: 0 2px 4px rgba(0,0,0,0.2)
		margin-top: 8px
		position: relative
		.btn
			border: 1px solid $clr-danger
			border-radius: 2px
			box-shadow: 1px 1px 2px rgba(0,0,0,0.2)
			width: 18px
			height: 18px
			position: absolute
			top: 4px
			right: 4px
			display: flex
			justify-content: center
			align-items: center
			cursor: pointer
		.message
			margin-right: 22px
</style>
