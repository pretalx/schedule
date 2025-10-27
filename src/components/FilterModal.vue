<template lang="pug">
dialog.pretalx-modal#filter-modal(ref="modal", @click.stop="close()")
	.dialog-inner(@click.stop="")
		button.close-button(@click="close()") ✕
		template(v-if="tracks.length > 1")
			h3 Tracks
			.checkbox-line.tracks(v-for="track in tracks", :key="track.id", :style="{'--track-color': track.color}")
				bunt-checkbox(type="checkbox", :label="getLocalizedString(track.name)", :name="track.id + '-checkbox'", v-model="trackSelections[track.id]", @input="onTrackToggle(track.id)")
				.track-description(v-if="getLocalizedString(track.description).length") {{ getLocalizedString(track.description) }}
		template(v-if="languages.length > 1")
			h3 Languages
			.checkbox-line(v-for="language in languages", :key="language")
				bunt-checkbox(type="checkbox", :label="getLanguageName(language)", :name="language + '-checkbox'", v-model="languageSelections[language]", @input="onLanguageToggle(language)")
</template>

<script>
import { getLocalizedString } from '~/utils'

export default {
	name: 'FilterModal',
	props: {
		tracks: {
			type: Array,
			default: () => []
		},
		selectedTrackIds: {
			type: Array,
			default: () => []
		},
		languages: {
			type: Array,
			default: () => []
		},
		selectedLanguageCodes: {
			type: Array,
			default: () => []
		}
	},
	emits: ['trackToggled', 'languageToggled'],
	data () {
		return {
			getLocalizedString,
			localSelectedTrackIds: [...this.selectedTrackIds],
			localSelectedLanguageCodes: [...this.selectedLanguageCodes]
		}
	},
	watch: {
		selectedTrackIds: {
			handler(newVal) {
				this.localSelectedTrackIds = [...newVal]
			},
			immediate: true
		},
		selectedLanguageCodes: {
			handler(newVal) {
				this.localSelectedLanguageCodes = [...newVal]
			},
			immediate: true
		}
	},
	computed: {
		trackSelections() {
			const selections = {}
			this.tracks.forEach(track => {
				selections[track.id] = this.localSelectedTrackIds.includes(track.id)
			})
			return selections
		},
		languageSelections() {
			const selections = {}
			this.languages.forEach(language => {
				selections[language] = this.localSelectedLanguageCodes.includes(language)
			})
			return selections
		}
	},
	methods: {
		showModal () {
			this.$refs.modal?.showModal()
		},
		close () {
			this.$refs.modal?.close()
		},
		onTrackToggle (trackId) {
			// Update local state immediately for UI responsiveness
			if (this.localSelectedTrackIds.includes(trackId)) {
				this.localSelectedTrackIds = this.localSelectedTrackIds.filter(id => id !== trackId)
			} else {
				this.localSelectedTrackIds.push(trackId)
			}

			this.$emit('trackToggled', trackId)
		},
		onLanguageToggle (languageCode) {
			// Update local state immediately for UI responsiveness
			if (this.localSelectedLanguageCodes.includes(languageCode)) {
				this.localSelectedLanguageCodes = this.localSelectedLanguageCodes.filter(code => code !== languageCode)
			} else {
				this.localSelectedLanguageCodes.push(languageCode)
			}

			this.$emit('languageToggled', languageCode)
		},
		getLanguageName (code) {
			// Use Intl.DisplayNames to get language names in the current locale if available
			try {
				const languageNames = new Intl.DisplayNames([document.querySelector('html').lang || 'en'], { type: 'language' })
				return languageNames.of(code) || code
			} catch {
				return code
			}
		}
	}
}
</script>

<style lang="stylus">
#filter-modal
	.checkbox-line
		margin: 16px 8px
		.bunt-checkbox.checked .bunt-checkbox-box
			background-color: var(--pretalx-clr-primary)
			border-color: var(--pretalx-clr-primary)
		&.tracks
			.bunt-checkbox.checked .bunt-checkbox-box
				background-color: var(--track-color)
				border-color: var(--track-color)
			.track-description
				color: $clr-grey-600
				margin-left: 32px
</style>
