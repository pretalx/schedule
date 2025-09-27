<template lang="pug">
dialog.pretalx-modal#filter-modal(ref="modal", @click.stop="close()")
	.dialog-inner(@click.stop="")
		button.close-button(@click="close()") ✕
		h3 Tracks
		.checkbox-line(v-for="track in tracks", :key="track.id", :style="{'--track-color': track.color}")
			bunt-checkbox(type="checkbox", :label="getLocalizedString(track.name)", :name="track.id + '-checkbox'", v-model="trackSelections[track.id]", @input="onTrackToggle(track.id)")
			.track-description(v-if="getLocalizedString(track.description).length") {{ getLocalizedString(track.description) }}
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
		}
	},
	emits: ['trackToggled'],
	data () {
		return {
			getLocalizedString,
			localSelectedTrackIds: [...this.selectedTrackIds]
		}
	},
	watch: {
		selectedTrackIds: {
			handler(newVal) {
				this.localSelectedTrackIds = [...newVal]
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
		}
	}
}
</script>

<style lang="stylus">
#filter-modal
	.checkbox-line
		margin: 16px 8px
		.bunt-checkbox.checked .bunt-checkbox-box
			background-color: var(--track-color)
			border-color: var(--track-color)
		.track-description
			color: $clr-grey-600
			margin-left: 32px
</style>
