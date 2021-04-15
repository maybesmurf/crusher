const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld(
	'electron',
	{
		processSelector: (xpath, currentHTML, id) => 	ipcRenderer.send('process-selector', xpath, currentHTML, id)
	}
)