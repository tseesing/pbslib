/* You may find the license in the LICENSE file */

const EXPORTED_SYMBOLS = ['LoggedPrompter'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const module = Cu.import;
const Exception = Components.Exception;

module("resource://gre/modules/XPCOMUtils.jsm");
module("resource://dta/utils.jsm");

function setNewGetter(aObject, aName, aLambda) {
	if (aName in aObject) {
		throw new Exception(aName + " is already defined in context " + aObject);
	}
	try {
		aObject.__defineGetter__(aName, function() {
			delete aObject[aName];
			return aObject[aName] = aLambda.apply(aObject);
		});

	}
	catch (ex) {
		log(aName);
		log(ex);
	}
}

function ServiceGetter(context, name, contract, iface) {
	if (!iface) {
		iface = Ci.nsISupports;
	}
	else if (typeof iface == "string") {
		iface = Ci[iface];
	}
	setNewGetter(
		context,
		name,
		function() {
			try {
				return Cc[contract].getService(iface);
			}
			catch (ex) {
				log(ex);
				log(contract);
				log(iface);
				throw ex;
			}
		}
	);	
}

ServiceGetter(this, "WindowWatcherService", "@mozilla.org/embedcomp/window-watcher;1", "nsIWindowWatcher");
ServiceGetter(this, "Debug", "@downthemall.net/debug-service;1", "dtaIDebugService");

function LoggedPrompter(window) {
	setNewGetter(
		this,
		'authPrompter',
		function() {
			return WindowWatcherService
				.getNewAuthPrompter(window)
				.QueryInterface(Ci.nsIAuthPrompt);
		}
	);

	setNewGetter(
		this,
		'prompter',
		function() {
			let _p = WindowWatcherService
				.getNewPrompter(window)
				.QueryInterface(Ci.nsIPrompt);		
			let _dp = {
				QueryInterface: XPCOMUtils.generateQI([Ci.nsIPrompt]),
				alert: function(title, text) Debug.log(text, title),
				alertCheck: function(title, text, cm, cv) Debug.log(text, title),
				confirm: function(title, text) _p.confirm(title, text),
				confirmCheck: function(title, text, cm, cv) _p.confirmCheck(title, text, cm, cv),
				confirmEx: function(title, text, bflags, bt0, bt1, bt2, cm, cv) _p.confirmEx(title, text, bflags, bt0, bt1, bt2, cm, cv),
				prompt: function(title, text, value, cm, cv) _p.prompt(title, text, value, cm, cv),
				promptPassword: function(title, text, password, cm, cv) _p.promptPassword(title, text, password, cm, cv),
				promptUsernameAndPassword: function(title, text, un, pw, cm, cv) _p.promptUsernameAndPassword(title, text, un, pw, cm, cv),
				select: function(title, text, count, list, selection) _p.select(title, text, count, list, selection)
			}
			return _dp;
		}
	);	
}