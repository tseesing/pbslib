/* You may find the license in the LICENSE file */

const EXPORTED_SYMBOLS = [
	'getMostRecent',
	'getMostRecentByUrl',
	'getAllByType',
	'openExternal',
	'openUrl',
	'showNotice',
];
	
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const Exception = Components.Exception;

const mediator = 	Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
const ioservice = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
const protoservice = Cc['@mozilla.org/uriloader/external-protocol-service;1'].getService(Ci.nsIExternalProtocolService);
const logger = Cc['@downthemall.net/debug-service;1'].getService(Ci.dtaIDebugService);
const windowwatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);


function objToString(obj) {
	if (obj == null || obj == undefined) {
		return obj;
	}
	if (
		typeof obj == 'string'
		|| obj instanceof String
	) {
		return obj.toString();
	}
	if (
		obj instanceof Ci.nsIURL
		|| obj instanceof Ci.nsIURI
	) {
		return obj.spec;
	}
	if (obj.url) {
		return objToString(obj.url);
	}
	throw new Exception("Not a valid type");
}
function objToUri(obj) {
	if (obj == null || obj == undefined) {
		return null;
	}
	if (obj instanceof Ci.nsIURL || obj instanceof Ci.nsIURI) {
		return obj;
	}
	if (typeof obj == 'string' || obj instanceof String) {
		return ioservice.newURI(obj.toString(), null, null);
	}
	if (obj.url) {
		return objToUri(obj.url);
	}	
	throw new Exception("Not a valid type");
}

/**
 * Gets the most recent window
 * @param type Either a string or an array of string specifying the type of the window
 */
function getMostRecent(type) {
	if (type instanceof Array) {
		for each (t in type) {
			let rv = getMostRecent(t);
			if (rv) {
				return rv;
			}
		}
	}
	return mediator.getMostRecentWindow(type.toString());
}

/**
 * Gets the most recent window by url instead of type 
 */
function getMostRecentByUrl(url) {
	if (!url) {
		return null;
	}
	url = objToString(url);

	let enumerator = mediator.getEnumerator(null);
	while (enumerator.hasMoreElements()) {
		var win = enumerator.getNext();
		if (win.location == url) {
			return win;
		}
	}
	return null;	
}

function getAllByType(type) {
	let rv = [];
	let enumerator = mediator.getEnumerator(type);
	while (enumerator.hasMoreElements()) {
		rv.push(enumerator.getNext());
	}
	return rv;	
}

function openExternal(link) {
	logger.logString("Mediator: Using external handler for " + link);
	protoservice.loadUrl(objToUri(link));
}
function openUrl(window, link, ref) {
	logger.logString("Mediator: Request to open " + link);
	try {
		let win = getMostRecent('navigator:browser');
		if (win) {
			// browser
			if ('delayedOpenTab' in win) {
				win.delayedOpenTab(objToString(link), objToUri(ref));
				return;
			}
			win.getBrowser().addTab(objToString(link), objToString(ref));
			return;
		}
		win = getMostRecent('Songbird:Main');
		if (win) {
			// Songbird
			let tb = win.document.getElementById('content');
			if (tb) {
				tb.loadOneTab(objToString(link), objToUri(ref), null, null, null);
				return;
			}
		}
	}
	catch (ex) {
		logger.log('Mediator: Failed to open tab', ex);
	}
	try {
		window.open(objToString(link));
	}
	catch (ex) {
		logger.log('Mediator: Failed to open window', ex);
		openExternal(link);
	}
}

function showNotice(window, params) {
	windowwatcher.openWindow(
		window,
		'chrome://dta/content/about/notice.xul',
		'_blank',
		'chrome,centerscreen,all,dialog,modal',
		params
		);
}