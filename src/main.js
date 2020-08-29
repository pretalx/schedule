import Vue from 'vue'
import Buntpapier from 'buntpapier'
import MediaQueries from 'media-queries'
import App from './App.vue'
import 'styles/global.styl'

Vue.config.productionTip = false
Vue.use(Buntpapier)
Vue.use(MediaQueries)
new Vue({
	render: h => h(App, {
		props: {
			eventUrl: 'https://pretalx.com/democon/',
			locale: 'en-ie'
		}
	})
}).$mount('#app')
