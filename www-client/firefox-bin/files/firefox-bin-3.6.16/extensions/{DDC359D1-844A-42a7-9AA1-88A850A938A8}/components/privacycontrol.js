/* You may find the license in the LICENSE file */

function include(uri) {
	Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader).loadSubScript(uri);
}
include('chrome://dta/content/common/xpcom.jsm');

var PrivacyControl = {
	initialize : function() {
		// install required observers, so that we may process on shutdown
		const	os = Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);
		os.addObserver(this, 'profile-change-teardown', false);
		os.addObserver(this, 'xpcom-shutdown', false);
	},
	dispose: function() {
		// always remove observers ;)
		const	os = Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);
		os.removeObserver(this, 'profile-change-teardown');
		os.removeObserver(this, 'xpcom-shutdown');
	},
	observe: function(subject, topic, data) {
		switch (topic) {
		case 'xpcom-shutdown':
			this.dispose();
			break;

		case 'profile-change-teardown':
			this.onShutdown();
			break;

		case 'sanitize':
			this.sanitize();
			break;

		case 'clean':
			this.clean();
			break;
		}
	},

	clean: function() {
		debug('clean()');
		
		// Cleaning prefs
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch(
				'extensions.dta.');
		for each (let e in ['directory', 'filter', 'renaming']) {
			try {
				prefs.clearUserPref(e);
			}
			catch (ex) {
				debug("Cannot clear pref: " + e, ex);
			}
		}
		
		// Cleaning files
		try {
			var prof = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties).get("ProfD",
					Components.interfaces.nsIFile);
			for each (let e in ['dta_history.xml', 'dta_log.txt', 'dta_queue.sqlite']) {
				try {
					var file = prof.clone();
					file.append(e);
					if (file.exists()) {
						file.remove(false);
					}
				}
				catch (ex) {
					debug('cannot remove: ' + e, ex);
				}
			}
		}
		catch (oex) {
			debug('failed to clean files: ', oex);
		}
	},

	sanitize : function() {
		debug("sanitize()");
		const prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch('privacy.');
		
		// in case UI should be used the cleaning will be processed there.
		// Furthermore we have to ensure user wants us to sanitize.
		if (!prefs.getBoolPref('sanitize.promptOnSanitize')
			&& prefs.getBoolPref('item.extensions-dta')){
				this.clean(prefs);
			}

	},
	
	get is190() {
		let ai = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo);
		let vc = Cc['@mozilla.org/xpcom/version-comparator;1'].getService(Ci.nsIVersionComparator);
		return vc.compare(ai.platformVersion, '1.9.1') < 0;
	},
	
	onShutdown : function() {
		const prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch('privacy.');
		
		if (this.is190) {
			// has user pref'ed to sanitize on shutdown?
			if (prefs.getBoolPref('sanitize.sanitizeOnShutdown')){
				this.sanitize();
			}
			return;
		}
		
		if (prefs.getBoolPref('sanitize.sanitizeOnShutdown') && prefs.getBoolPref('clearOnShutdown.extensions-dta')){
			this.clean();
		}
	}
};
implementComponent(
	PrivacyControl,
	Components.ID("{db7a8d60-a4c7-11da-a746-0800200c9a66}"),
	"@downthemall.net/privacycontrol;1",
	"DownThemAll! Privacy Control",
	[Ci.nsIObserver]
);
PrivacyControl.initialize();

function NSGetModule(mgr, spec) {
	return new ServiceModule(PrivacyControl, true);
}