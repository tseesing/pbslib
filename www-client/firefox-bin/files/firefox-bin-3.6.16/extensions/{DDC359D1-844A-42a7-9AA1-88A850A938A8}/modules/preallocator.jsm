/* You may find the license in the LICENSE file */

const EXPORTED_SYMBOLS = [
	'prealloc'
];
	
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const Exception = Components.Exception;

const FileOutputStream = Components.Constructor('@mozilla.org/network/file-output-stream;1', 'nsIFileOutputStream', 'init');
const File = Components.Constructor('@mozilla.org/file/local;1', 'nsILocalFile', 'initWithPath');

const log = (function() {
	let logger = Cc['@downthemall.net/debug-service;1'].getService(Ci.dtaIDebugService);
	return function pa_log(msg, ex) {
		if (ex) {
			return logger.log(msg, ex);
		}
		return logger.logString(msg);
	}
})();

const SIZE_MIN = 20 * 1024 * 1024; // will not prealloc below
const SIZE_STEP = 10 * 1024 * 1024; // prealloc will NOT use threads up to this size

Components.utils.import('resource://dta/cothread.jsm');

function prealloc(file, size, perms, callback, tp) {
	tp = !!tp ? tp : {};
	if (size <= SIZE_MIN || !isFinite(size)) {
		if (callback) {
			callback.call(tp, false);
		}
		return null;
	}
	
	//new WorkerJob(file.path, size, perms, callback, tp);
	let rv = new CoThreadListWalker(function() true, realPrealloc(file.clone(), size, perms, callback, tp), 1)
	rv.run();
	return rv;
}

function realPrealloc(file, size, perms, callback, tp) {
	let rv = true;
	try {
		for (let ok = true; ok;) {
			let stream = new FileOutputStream(file, 0x02 | 0x08, perms, 0);
			try {
				let seekable = stream.QueryInterface(Ci.nsISeekableStream);
				seekable.seek(0x02, 0);
				let i = Math.min((size - seekable.tell()) - 1, SIZE_STEP);
				if (i <= 0) {
					stream.close();
					break;
				}
				seekable.seek(0x01, i);
				// XXX: This will force the OS to write the file out to this position
				// However I'm not quite sure yet if this may overwrite already received data
				// I guess it might (on a very fast connection)
				// On the other hand, at the moment all IO is running on the main thread
				// and event execution cannot be "suspended", so we should be safe
				// "a" is used to avoid sparse file "optimizations"
				stream.write("a", 1);
				cont = true;
			}
			catch (ex) {
				log("prealloc: failed", ex);
				rv = ok = false;
			}
			stream.close();
			yield true;
		}
	}
	catch (ex) {
		rv = false;
		log("prealloc: Failed to run prealloc worker", ex);
	}
	if (callback) {
		callback.call(tp, rv);
	}
}

/*
 * The following code is not in use. Threading will reproducible (but not always) crash the app 
 * 
function WorkerJob(path, size, perms, callback, tp) {
	this.path = path;
	this.size = size;
	this.perms = perms;
	this.callback = callback;
	this.tp = tp;
	
	let tm = Cc['@mozilla.org/thread-manager;1'].getService(Ci.nsIThreadManager);
	this.thread = tm.newThread(0);
	this.main = tm.mainThread;
	this.thread.dispatch(this, this.thread.DISPATCH_NORMAL);
}

WorkerJob.prototype = {
	QueryInterface: function worker_QueryInterface(iid) {
		if (iid.equals(Ci.nsISupports) || iid.equals(iid.nsIRunnable)) {
			return this;
		}
		throw Cr.NS_ERROR_NO_INTERFACE;
	},
	run: function worker_run() {
		let rv = false;
		try {
			let file = new File(this.path);
			let stream = new FileOutputStream(file, 0x02 | 0x08, this.perms, 0);
			let seekable = stream.QueryInterface(Ci.nsISeekableStream);
			seekable.seek(0x02, 0);
			let i = seekable.tell() + SIZE_STEP;
			for (i = Math.min(this.size - 1, i); i < this.size - 1; i = Math.min(this.size - 1, i + SIZE_STEP)) {
				seekable.seek(0x00, i);
				stream.write("a", 1);
			}
			
			//seekable.setEOF();
			stream.close();
			rv = true;
		}
		catch (ex) {
			log("prealloc: Failed to run prealloc worker", ex);
		}
		this.main.dispatch(new MainJob(this.thread, this.callback, this.tp, rv), this.main.DISPATCH_NORMAL);		
	}
};

function MainJob(thread, callback, tp, result) {
	this.thread = thread;
	this.callback = callback;
	this.tp = tp;
	this.result = result;
}
MainJob.prototype = {
	QueryInterface: WorkerJob.prototype.QueryInterface,
	
	run: function main_run() {
		this.thread.shutdown();
		if (this.callback) {
			try {
				this.callback.call(this.tp, this.result);
				log("Prealloc done");
			}
			catch (ex) {
				log("Callback throw", ex);
			}
		}
	}
};
*/