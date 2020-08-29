const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	transpileDependencies: ['buntpapier'],
	configureWebpack: {
		resolve: {
			symlinks: false, // don't flatten symlinks (for npm link)
			modules: [path.resolve('src'), path.resolve('src/styles'), 'node_modules']
		},
		plugins: [
			new HtmlWebpackPlugin({
				filename: 'demo.html',
				minify: false,
				inject: 'head',
				template: 'public/demo.html'
			})
		]
	},
	chainWebpack (config) {
		if (config.plugins.has('optimize-css')) {
			config.plugin('optimize-css').tap(([options]) => {
				options.cssnanoOptions.preset[1].calc = false
				return [options]
			})
		}
	},
	css: {
		loaderOptions: {
			stylus: {
				use: [require('buntpapier/stylus')({implicit: false})],
				import: ['~buntpapier/buntpapier/index.styl', '~variables']
			}
		}
	},
	lintOnSave: true
}

if (process.env.ANALYZE) {
	console.log('building with bundle analyzer')
	module.exports.configureWebpack.plugins.push(new BundleAnalyzerPlugin({analyzerMode: 'static'}))
}
