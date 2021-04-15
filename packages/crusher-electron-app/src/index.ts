import {app, BrowserWindow, session} from 'electron';
import * as path from 'path';
const { fork } = require('child_process');


const IS_DEBUG = process.env.NODE_ENV === "development";

const { ipcMain } = require('electron')
const child = fork(__dirname + '/findSelector');

ipcMain.on('process-selector', (event, selectorXpath: string, html: string, actionId: number) => {
	child.send(JSON.stringify({type: 'PROCESS_SELECTOR', meta: {selectorXpath, html, actionId}}));
	event.reply('asynchronous-reply', 'pong')
})

function createWindow () {
	app.commandLine.appendSwitch('disable-site-isolation-trials')
	const mainWindow = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, "../renderer.js"),
			nativeWindowOpen: true,
			nodeIntegrationInSubFrames: true
		}
	});

	// Load new popups in the device iframe except crusher related urls
	mainWindow.webContents.on('new-window', function(event, popupUrl) {
		if(mainWindow.webContents.getURL().startsWith("chrome-extension")) {
			if(!popupUrl.includes("localhost:8000") && !popupUrl.includes("192.168.0.2") && !popupUrl.includes("crusher.dev")) {
				event.preventDefault();
				mainWindow.webContents.executeJavaScript(`document.querySelector('#device_browser').src = "${popupUrl}"`);
			}
		}
	});

	mainWindow.webContents.session.clearStorageData({
		storages: [
			"cookies",
			"serviceworkers",
			"cachestorage",
			"websql",
			"shadercache",
			"filesystem",
			"indexdb",
			"appcache"
		]
	});

	mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: [ "*://*/*" ] },
		(responseDetails, updateCallback)=>{
			Object.keys(responseDetails.responseHeaders).map(headers => {
				if(["x-frame-options", "content-security-policy", "frame-options"].includes(headers.toString().toLowerCase())) {
					delete responseDetails.responseHeaders[headers];
				}
			});

			updateCallback({cancel: false, responseHeaders: responseDetails.responseHeaders});
		}
	);

	mainWindow.maximize();

	session.defaultSession.loadExtension(path.resolve(__dirname, IS_DEBUG ? '../../crusher-extension/build/' : "../build/extension/")).then(({ id: extensionId }) => {
		mainWindow.loadURL(`chrome-extension://${extensionId}/test_recorder.html`);
	});
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})