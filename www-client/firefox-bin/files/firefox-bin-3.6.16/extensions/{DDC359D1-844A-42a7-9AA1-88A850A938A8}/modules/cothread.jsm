/* You may find the license in the LICENSE file */

const EXPORTED_SYMBOLS = ['CoThread', 'CoThreadListWalker'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const TYPE_REPEATING_SLACK = Ci.nsITimer.TYPE_REPEATING_SLACK;
const Timer = Components.Constructor('@mozilla.org/timer;1', 'nsITimer', 'initWithCallback');

// "Abstract" base c'tor
function CoThreadBase(func, yieldEvery, thisCtx) {
	this._thisCtx = thisCtx ? thisCtx : this;
	
	// default to 1
	this._yieldEvery = typeof yieldEvery == 'number' ? Math.floor(yieldEvery) : 1;
	if (yieldEvery < 1) {
		throw Cr.NS_ERROR_INVALID_ARG;
	}
	
	if (typeof func != 'function' && !(func instanceof Function)) {
		throw Cr.NS_ERROR_INVALID_ARG;
	} 
	this._func = func;
}

/**
 * Constructs a new CoThread (aka. pseudo-thread).
 * A CoThread will repeatedly call a specified function, but "breaking"
 * the operation temporarily after a certain ammount of calls,
 * so that the main thread gets a chance to process any outstanding
 * events.
 * 
 * Example:
 *        Components.utils.import('resource://dta/cothread.jsm');
 *        new CoThread(
 *        	// What to do with each item?
 *          // Print it!
 *          function(count) document.write(count + "<br>") || (count < 30000),
 *          // When to turn over Control?
 *          // Each 1000 items
 *          1000
 *        ).run();
 *   
 * @param {Function} func Function to be called. Is passed call count as argument. Returning false will cancel the operation. 
 * @param {Number} yieldEvery Optional. After how many items control should be turned over to the main thread
 * @param {Object} thisCtx Optional. The function will be called in the scope of this object (or if omitted in the scope of the CoThread instance)
 */
function CoThread(func, yieldEvery, thisCtx) {
	CoThreadBase.call(this, func, yieldEvery, thisCtx);
	
	// fake generator so we may use a common implementation. ;)
	this._generator = (function() { for(;;) { yield null }; })();
}

CoThread.prototype = {
	
	_idx: 0,
	_ran: false,
	_finishFunc: null,
	
	run: function CoThread_run() {
		if (this._ran) {
			throw new Error("You cannot run a CoThread/CoThreadListWalker instance more than once.");
		}
		this._ran = true;
		
		this._timer = new Timer(this, 10, TYPE_REPEATING_SLACK);		
	},
	
	QueryInterface: function CoThread_QueryInterface(iid) {
		if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsITimerCallback)) {
			return this;
		}
		throw Cr.NS_ERROR_NO_INTERFACE;
	},
	
	notify: function CoThread_notify() {
		let y = this._yieldEvery;
		let g = this._generator;
		let f = this._func;
		let ctx = this._thisCtx;
		let callf = this._callf;
		try {		
			for (let i = 0; i < y; ++i) {
				if (!callf(ctx, g.next(), this._idx++, f)) {
					throw 'complete';
				}
			}
		}
		catch (ex) {
			this.cancel();
		}
	},
	
	cancel: function CoThread_cancel() {
		this._timer.cancel();
		if (this._finishFunc) {
			this._finishFunc.call(this._thisCtx);
		}		
	},
	
	_callf: function CoThread__callf(ctx, item, idx, func) {
		return func.call(ctx, idx);
	}
}

/**
 * Constructs a new CoThreadListWalker (aka. pseudo-thread).
 * A CoThreadListWalker will walk a specified list and call a specified function
 * on each item, but "breaking" the operation temporarily after a
 * certain ammount of processed items, so that the main thread may
 * process any outstanding events.
 * 
 * Example:
 *        Components.utils.import('resource://dta/cothread.jsm');
 *        new CoThreadListWalker(
 *        	// What to do with each item?
 *          // Print it!
 *          function(item, idx) document.write(item + "/" + idx + "<br>") || true,
 *          // What items?
 *          // 0 - 29999
 *          (function() { for (let i = 0; i < 30000; ++i) yield i; })(),
 *          // When to turn over Control?
 *          // Each 1000 items
 *          1000,
 *          null,
 *          function() alert('done')
 *        ).run();
 *   
 * @param {Function} func Function to be called on each item. Is passed item and index as arguments. Returning false will cancel the operation. 
 * @param {Array/Generator} arrayOrGenerator Array or Generator object to be used as the input list 
 * @param {Number} yieldEvery Optional. After how many items control should be turned over to the main thread
 * @param {Object} thisCtx Optional. The function will be called in the scope of this object (or if omitted in the scope of the CoThread instance)
 * @param {Function} finishFunc Optional. This function will be called once the operation finishes or is cancelled.
 */
function CoThreadListWalker(func, arrayOrGenerator, yieldEvery, thisCtx, finishFunc) {
	CoThreadBase.call(this, func, yieldEvery, thisCtx);
	
	if (arrayOrGenerator instanceof Array) {
		// make a generator
		this._generator = (i for each (i in arrayOrGenerator));
	}
	else if (typeof arrayOrGenerator != 'function' && !(arrayOrGenerator instanceof Function)) {
		this._generator = arrayOrGenerator;
	}
	else {
		throw Cr.NS_ERROR_INVALID_ARG;
	}
	
	this._finishFunc = finishFunc;
	if (this._lastFunc && (typeof func != 'function' && !(func instanceof Function))) {
		throw Cr.NS_ERROR_INVALID_ARG;
	} 
}

// not just b.prototype = a.prototype, because we wouldn't then be allowed to override methods 
for (x in CoThread.prototype) {
	CoThreadListWalker.prototype[x] = CoThread.prototype[x];
}
CoThreadListWalker.prototype._callf = function CoThreadListWalker__callf(ctx, item, idx, func) {
	return func.call(ctx, item, idx);
}
