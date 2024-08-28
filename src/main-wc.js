import { createApp, defineCustomElement } from 'vue'
import Buntpapier from 'buntpapier'
import App from '~/App.vue'
import '~/styles/global.styl'

const PretalxSchedule = defineCustomElement(App)
customElements.define('pretalx-schedule', PretalxSchedule)
document.body.appendChild(new PretalxSchedule)
