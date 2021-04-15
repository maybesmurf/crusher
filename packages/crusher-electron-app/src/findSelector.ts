import jsdom from 'jsdom';
import { UniqueSelector } from './uniqueSelector';
const { JSDOM } = jsdom;
const fs = require('fs');

const findSelectors = (selectorXpath: string, html: string, actionId: number) => {
	const dom = new JSDOM(html);
	const el = dom.window.document.evaluate(`${selectorXpath}`, dom.window.document, null, dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	if(el){
		const test = new UniqueSelector({root:dom.window.document.body});
		const selectors = test.getUniqueSelector(el as any);
		if( selectors.mostUniqueSelector) {
			console.log("A selector is: ", selectors.mostUniqueSelector.value);
		}
	} else {
		console.error("No such xpath found", selectorXpath);
		fs.writeFile('twitch.html', html, function (err) {
		})
		}
};

process.on("message", (jsonMessage) => {
	const {type, meta} = JSON.parse(jsonMessage);
	const { selectorXpath, html, actionId} = meta;
	if(type === "PROCESS_SELECTOR"){
		findSelectors(selectorXpath, html, actionId);
	}
})