const path = require("path");
module.exports = {
	mode: "production",
	target: "node",
	entry: {
		app: "./src/app.ts",
	},
	output: {
		path: path.resolve(__dirname, "../../output/crusher-server"),
		chunkFilename: `[name]-[chunkhash:4].js`,
		sourceMapFilename: `[name]-[chunkhash:4].js.map`,
		library: {
			type: "umd",
		}
	},
	plugins: [
	],
	resolve: {
		extensions: [".ts", ".tsx", ".js"]
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				options: {
					transpileOnly: true
				}
			},
		],
	},
};
