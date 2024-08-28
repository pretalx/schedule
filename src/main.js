import { createApp } from 'vue'
import Buntpapier from 'buntpapier'
import App from '~/App.vue'
import '~/styles/global.styl'

createApp(
	App,
	{
		eventUrl: 'https://pretalx.com/democon/',
		locale: 'en-ie'
	}
).use(Buntpapier).mount('#app')
