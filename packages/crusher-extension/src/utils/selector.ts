// import * as uniqueSelector2 from "unique-selector";
import { iSelectorInfo } from "../../../crusher-shared/types/selectorInfo";
//
// const _uniqueSelector2 = new uniqueSelector2.default({});
//
function getXpathTo(elm: HTMLElement): string | null {
	const allNodes = document.getElementsByTagName("*");
	let segs;
	for (segs = []; elm && elm.nodeType == 1; elm = elm.parentNode as any) {
		if (elm.hasAttribute("id")) {
			let uniqueIdCount = 0;
			for (let n = 0; n < allNodes.length; n++) {
				if (allNodes[n].hasAttribute("id") && allNodes[n].id == elm.id)
					uniqueIdCount++;
				if (uniqueIdCount > 1) break;
			}
			if (uniqueIdCount == 1) {
				segs.unshift(`id("${elm.getAttribute("id")}")`);
				return segs.join("/");
			} else {
				segs.unshift(
					elm.localName.toLowerCase() + `"[@id="${elm.getAttribute("id")}"]"`,
				);
			}
		} else if (elm.hasAttribute("class")) {
			segs.unshift(
				elm.localName.toLowerCase() + `[@class="${elm.getAttribute("class")}"]`,
			);
		} else {
			let i, sib;
			for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
				if ((sib as any).localName == elm.localName) i++;
			}
			segs.unshift(elm.localName.toLowerCase() + "[" + i + "]");
		}
	}
	return segs.length ? "/" + segs.join("/") : null;
}

export function getSelectors(elementNode: HTMLElement): Array<iSelectorInfo> {
	// const selectors = _uniqueSelector2.getUniqueSelector(elementNode);
	const xPathSelector = getXpathTo(elementNode);

	const out = [];
	// out.push(...(selectors.list as Array<iSelectorInfo>));
	if (xPathSelector) {
		out.push({
			type: "xpath",
			value: xPathSelector as string,
			uniquenessScore: 1,
		});
	}

	return out;
}
