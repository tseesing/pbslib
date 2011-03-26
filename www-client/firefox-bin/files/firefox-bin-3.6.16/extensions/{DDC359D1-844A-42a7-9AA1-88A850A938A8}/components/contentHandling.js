/* You may find the license in the LICENSE file */

function include(uri) {
	Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader)
		.loadSubScript(uri);
}
include('chrome://dta/content/common/xpcom.jsm');

const NS_ERROR_NO_INTERFACE = Cr.NS_ERROR_NO_INTERFACE;
const NS_ERROR_FAILURE = Cr.NS_ERROR_FAILURE;
const NS_ERROR_NO_AGGREGATION = Cr.NS_ERROR_NO_AGGREGATION;
const NS_ERROR_INVALID_ARG = Cr.NS_ERROR_INVALID_ARG;

const ScriptableInputStream = new Components.Constructor('@mozilla.org/scriptableinputstream;1', 'nsIScriptableInputStream', 'init');

var ContentHandling = {
	_init: function() {
		var obs = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		obs.addObserver(this, 'http-on-modify-request', true);
	},
	observe: function(subject, topic, data) {
		if (
			!(subject instanceof Ci.nsIHttpChannel)
			|| !(subject instanceof Ci.nsIUploadChannel)
		) {
			return;
		}
		var channel = subject.QueryInterface(Ci.nsIHttpChannel);
		if (channel.requestMethod != 'POST') {
			return;
		}
				
		var post;
    
		try {
			var us = subject.QueryInterface(Ci.nsIUploadChannel).uploadStream;
			if (!us) {
				return;
			}
			try {
				us.QueryInterface(Ci.nsIMultiplexInputStream);
				debug("ignoring multiplex stream");
				return;
			}
			catch (ex) {
				// no op
			}
				
			let ss = us.QueryInterface(Ci.nsISeekableStream);
			if (!ss) {
				return;
			}
			let op = ss.tell();
		
			ss.seek(0, 0);
			
			let is = new ScriptableInputStream(us);
			
			// we'll read max 64k
			let available = Math.min(is.available(), 1 << 16);
			if (available) {
				post = is.read(available);
			}
			ss.seek(0, op);
			
			if (post) {
				this._registerData(channel.URI, post);
			}
		}
		catch (ex) {
			debug("cannot get post-data", ex);
		}
  },
  _dataDict: {},
  _dataArray: [],
  _registerData: function(uri, data) {
  	uri = uri.spec;

  	if (!(uri in this._dataDict)) {
  		if (this._dataArray.length > 5) {
  			delete this._dataDict[this._dataArray.pop()];
  		}
  		this._dataArray.push(uri);
  	}
  	
  	this._dataDict[uri] = data;  	
  },
  getPostDataFor: function(uri) {
  	if (uri instanceof Ci.nsIURI) {
  		uri = uri.spec;
  	}
  	if (!(uri in this._dataDict)) {
  		return '';
  	}
  	return this._dataDict[uri];
  }  	
};
implementComponent(
	ContentHandling,
	Components.ID("{47C53284-E2D1-49af-9524-4D42D70D1279}"),
	"@downthemall.net/contenthandling;1",
	"DownThemAll! Content Handling",
	[Ci.nsIObserver, Ci.nsiURIContentListener, Ci.dtaIContentHandling]
);	
ContentHandling._init();


// entrypoint
function NSGetModule(compMgr, fileSpec) {
	return new ServiceModule(ContentHandling, true);
}