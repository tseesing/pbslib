/* You may find the license in the LICENSE file */

var EXPORTED_SYMBOLS = ['confirm', 'confirmOC', 'confirmYN', 'alert'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

// unpack the default button types
for (let x in Components.interfaces.nsIPromptService) {
	let r = new String(x).match(/BUTTON_TITLE_(\w+)$/);
	if (r) {
		this[r[1]] = Components.interfaces.nsIPromptService[x];
		EXPORTED_SYMBOLS.push(r[1]);
	}
}

/**
 * wrapper around confirmEx
 * @param title. Dialog title
 * @param text. Dialog text
 * @param button0. Either null (omit), one of CANCEL/NO/... or a string
 * @param button1. s.a.
 * @param button2. s.a.
 * @param default. Index of the Default button
 * @param check. either null, a boolean, or string specifying the prefs id.
 * @param checkText. The text for the checkbox
 * @return Either the button# or {button: #, checked: bool} if check was a boolean
 * @author Nils
 */
function confirm(aWindow, aTitle, aText, aButton0, aButton1, aButton2, aDefault, aCheck, aCheckText) {
	let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Ci.nsIPromptService);
	
	// Set up the flags/buttons
	let flags = 0;
	[aButton0, aButton1, aButton2].forEach(
		function(button, idx) {
			if (typeof button == 'number') {
				flags += prompts['BUTTON_POS_' + idx] * button;
				button = null;
			}
			else if (typeof button == 'string' || button instanceof String) {
				flags |= prompts['BUTTON_POS_' + idx] * prompts.BUTTON_TITLE_IS_STRING;
			}
			else {
				button = 0;
			}
		},
		this
	);
	if (aDefault == 1) {
		flags += prompts.BUTTON_POS_1_DEFAULT;
	}
	else if (aDefault == 2) {
		flags += prompts.BUTTON_POS_2_DEFAULT;
	}
	
	// Checkmark requested?
	let rv = null;
	let check = {};
	if (aCheckText) {
		if (typeof(aCheck) == 'boolean') {
			rv = {};
			check.value = aCheck;
		}
		else if (typeof(aCheck) == 'string' || aCheck instanceof String) {
			check.value = undefined;
			try {
				check.value = Cc['@mozilla.org/preferences-service;1']
					.getService(Ci.nsIPrefBranch)
					.getBoolPref(aCheck);
			}
			catch (ex) {
				// no-op				
			}
			if (check.value == undefined) {
				check.value = false;
			}
		}
	}
	
	let cr = prompts.confirmEx(
		aWindow,
		aTitle,
		aText,
		flags,
		aButton0,
		aButton1,
		aButton2,
		aCheckText,
		check
	);
	
	// We've got a checkmark request
	if (rv) {
		rv.checked = check.value;
		rv.button = cr;
		return rv;
	}
	
	// Just return as usual
	return cr;
}

/**
 * Shortcut for OK/Cancel Confirmation dialogs
 * @author Nils
 */
function confirmOC(aWindow, aTitle, aText) {
	return confirm(aWindow, aTitle, aText, OK, CANCEL);
}

/**
 * Shortcut for Yes/No Confirmation dialogs
 * @author Nils
 */
function confirmYN(aWindow, aTitle, aText) {
	return confirm(aWindow, aTitle, aText, YES, NO);
}

/**
 * wrapper around alert
 * @author Nils
 */
function alert(aWindow, aTitle, aText) {
	Cc["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Ci.nsIPromptService)
		.alert(aWindow, aTitle, aText);
}