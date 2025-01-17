import * as winston from "winston";
const LokiTransport = require("winston-loki");
const chalk = require('chalk');

const IS_PRODUCTION = process.env.NODE_ENV === "production";

let winstonLogger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	defaultMeta: {},
	transports: [
		new winston.transports.File({ filename: "error.log", level: "error" }),
		new winston.transports.File({ filename: "combined.log" }),
		new winston.transports.Console({ format: winston.format.combine( winston.format.colorize() , winston.format.printf((info) => {
			const values = Object.keys(info).filter((a) => !["level", "message"].includes(a)).map((a) => info[a]);
			
			return `${info.level}: ${info.message && typeof info.message === "string" ? info.message.replace(/^(\[.+\])/, (x) => {
				return chalk.bold(x);
			}) : info.message} ` + (values && values.length ? JSON.stringify(values) : "");
		})), level: process.env.CRUSHER_DEBUG ? "debug" : "info" }),
	],
});

const consoleMiddleware = (type, message, ...meta) => {
	winstonLogger.log(type, message, meta);
};
// Native console.error
const _error = console.error;
const _log = console.log;

function modifyNativeConsoleFunctions() {
	// console.log = consoleMiddleware.bind(this, "info");
	// console.error = consoleMiddleware.bind(this, "error");
	// console.warn = consoleMiddleware.bind(this, "warn");
	// console.info = consoleMiddleware.bind(this, "info");
	// console.trace = consoleMiddleware.bind(this, "debug");
	// console.debug = consoleMiddleware.bind(this, "debug");
}

modifyNativeConsoleFunctions();

let isSetupComplete = false;
export function setupLogger(componentName: string) {
	if (!componentName) throw new Error("Provide a unique component name for you logger");
	if (isSetupComplete) return;
	if (IS_PRODUCTION) {
		winstonLogger.add(
			new LokiTransport({
				host:
					"https://146225:eyJrIjoiY2I4YTU3ODIxMjY4OTIwNzM5YjkzODQzODllNzNjMWQ4Mjk3YmZmZSIsIm4iOiJtYWluLWxvZyIsImlkIjo1ODQ3OTh9@logs-prod-us-central1.grafana.net",
				json: true,
				basicAuth: "146225:eyJrIjoiY2I4YTU3ODIxMjY4OTIwNzM5YjkzODQzODllNzNjMWQ4Mjk3YmZmZSIsIm4iOiJtYWluLWxvZyIsImlkIjo1ODQ3OTh9",
				labels: { component: componentName },
				onConnectionError: (err) => {
					_error(err);
				},
			}),
		);
	}
}
