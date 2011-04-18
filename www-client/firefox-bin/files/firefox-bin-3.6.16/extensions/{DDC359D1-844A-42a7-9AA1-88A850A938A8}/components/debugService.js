/* You may find the license in the LICENSE file */
 
function include(uri) {
	Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader)
		.loadSubScript(uri);
}
include('chrome://dta/content/common/xpcom.jsm');

const FileStream = new Components.Constructor('@mozilla.org/network/file-output-stream;1', 'nsIFileOutputStream', 'init');
const ScriptError = new Components.Constructor('@mozilla.org/scripterror;1', 'nsIScriptError', 'init');

var DebugService = {
	// nsIObserver
	observe: function DS_observe(subject, topic, prefName) {
		this._setEnabled(this._pb.getBoolPref('extensions.dta.logging'));	
	},
	
	init: function DS_init() {
		this._cs = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
		this._pb = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch2);
		this._pb.addObserver('extensions.dta.logging', this, true);
		this._setEnabled(this._pb.getBoolPref('extensions.dta.logging'));
		
		this._file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsILocalFile);
		this._file.append('dta_log.txt');
		
		try {
			if (this._file.fileSize > (200 * 1024)) {
				this.remove();
			}
		}
		catch(ex) {
			// No-Op
		}
		delete this.init;
	},
	get file() {
		return this._file;
	},
	get enabled() {
		return this._enabled;
	},
	_setEnabled: function DS_setEnabled(nv) {
		this._enabled = nv;
		if (nv) {
			this.logString = this.log = this._log;
		}
		else {
			this.logString = this.log = this._logDisabled;
		}
	},
	_formatTimeDate: function DS_formatTimeDate(value) {
		return String(value).replace(/\b(\d)\b/g, "0$1");
	},
	_log: function DS__log(msg, exception) {
		try {
			if (!msg || (msg == "" && typeof(exception) != "object")) {
				return;
			}
			if (!(msg instanceof String) && typeof(msg) != 'string') {
				for (var i = 0; i < 10 && msg.wrappedJSObject; ++i) {
					msg = msg.wrappedJSObject;
				}
				msg = msg.toSource();
			}
			let time = new Date();
			let text = this._formatTimeDate(time.getHours())
				+ ":" + this._formatTimeDate(time.getMinutes())
				+ ":" + this._formatTimeDate(time.getSeconds())
				+ ":" + time.getMilliseconds()
				+ "\n";

			if (msg != "") {
				text += msg.replace(/\n/g, "\n\t") + " ";
			}
			if (exception) {
				text += "\tError: " + exception;
			}
			text += "\r\n";
			let stack = null;
			let lineNumber = 0;
			let fileName = null;
			if (Components.stack) {
				stack = Components.stack.caller.caller;
			}
			if (exception && exception.stack) {
				lineNumber = exception.lineNumber;
				fileName = exception.fileName;
				let initialLine = "Frame :: " + fileName;
				if (exception.location) {
					initialLine += " :: " + exception.location;
				}
				else if (stack && stack.name) {
					initialLine += " :: " + stack.name;
				}
				initialLine += " :: line: " + lineNumber;
				text += "\t> " + initialLine + "\n";
			}
			else if (stack) {
				text += "\t> " + stack.toString() + "\n";
				lineNumber = stack.lineNumber;
				fileName = stack.fileName;
				
			}
			
			if (stack) {
				let s = stack.caller;
				for (let i = 0; i < 4 && s; ++i) {
					text += "\t> " + s.toString() + "\n";
					s = s.caller;
				}
				if (stack && exception) {
					this._cs.logMessage(new ScriptError(text, fileName, null, lineNumber, 0, 0x2, 'component javascript'));
					 
				} 
				else {
					this._cs.logStringMessage(text);
				}
			}
			else {
				this._cs.logStringMessage(text);
			}
			
			var f = new FileStream(this.file, 0x04 | 0x08 | 0x10, 0664, 0);
			f.write(text, text.length);
			f.close();
		}
		catch(ex) {
			error(ex);
		}	
	
	},
	_logDisabled: function DS__dumpDisabled() {
		// no-op;
	},
	log: this._log,
	logString: this._log,
		
	remove: function DS_remove() {
		try {
			this._file.remove(false);
		}
		catch (ex) {
			throw Cr.NS_ERROR_FAILURE;
		}
	}
};
implementComponent(
	DebugService,
	Components.ID("{0B82FEBB-59A1-41d7-B31D-D5A686E11A69}"),
	"@downthemall.net/debug-service;1",
	"DownThemAll! Debug Service",
	[Ci.nsIObserver, Ci.dtaIDebugService]
);

// entrypoint
function NSGetModule(compMgr, fileSpec) {
	return new ServiceModule(DebugService, false);
}