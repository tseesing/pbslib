/* You may find the license in the LICENSE file */
 
// See chrome/locale/filters.properties
pref("extensions.dta.filters.deffilter-all.label", "All files");
pref("extensions.dta.filters.deffilter-all.test", "/.*/i");
pref("extensions.dta.filters.deffilter-all.active", false);
pref("extensions.dta.filters.deffilter-all.type", 3);

pref("extensions.dta.filters.deffilter-arch.label", "Archives)");
pref("extensions.dta.filters.deffilter-arch.test", "/\\.(?:z(?:ip|[0-9]{2})|r(?:ar|[0-9]{2})|jar|bz2|gz|tar|rpm)$/i");
pref("extensions.dta.filters.deffilter-arch.active", false);
pref("extensions.dta.filters.deffilter-arch.type", 1);

pref("extensions.dta.filters.deffilter-vid.label", "Videos");
pref("extensions.dta.filters.deffilter-vid.test", "/\\.(?:mpeg|ra?m|avi|mp(?:g|e|4)|mov|divx|asf|qt|wmv|m\dv|rv|vob|asx|ogm)$/i");
pref("extensions.dta.filters.deffilter-vid.active", true);
pref("extensions.dta.filters.deffilter-vid.type", 3);

pref("extensions.dta.filters.deffilter-aud.label", "Audio");
pref("extensions.dta.filters.deffilter-aud.test", "/\\.(?:mp3|wav|og(?:g|a)|flac|midi?|rm|aac|wma|mka|ape)$/i");
pref("extensions.dta.filters.deffilter-aud.active", true);
pref("extensions.dta.filters.deffilter-aud.type", 1);

pref("extensions.dta.filters.deffilter-img.label", "Images");
pref("extensions.dta.filters.deffilter-img.test", "/\\.(?:jp(?:e?g|e|2)|gif|png|tiff?|bmp|ico)$/i");
pref("extensions.dta.filters.deffilter-img.active", true);
pref("extensions.dta.filters.deffilter-img.type", 3);

pref("extensions.dta.filters.deffilter-bin.label", "Software");
pref("extensions.dta.filters.deffilter-bin.test", "/\\.(?:exe|msi|dmg|bin|xpi|iso)$/i");
pref("extensions.dta.filters.deffilter-bin.active", true);
pref("extensions.dta.filters.deffilter-bin.type", 1);

pref("extensions.dta.filters.deffilter-imgjpg.label", "JPEG");
pref("extensions.dta.filters.deffilter-imgjpg.test", "/\\.jp(e?g|e|2)$/i");
pref("extensions.dta.filters.deffilter-imgjpg.active", false);
pref("extensions.dta.filters.deffilter-imgjpg.type", 3);

pref("extensions.dta.filters.deffilter-imggif.label", "GIF");
pref("extensions.dta.filters.deffilter-imggif.test", "/\\.gif$/i");
pref("extensions.dta.filters.deffilter-imggif.active", false);
pref("extensions.dta.filters.deffilter-imggif.type", 2);

pref("extensions.dta.filters.deffilter-imgpng.label", "PNG");
pref("extensions.dta.filters.deffilter-imgpng.test", "/\\.png$/i");
pref("extensions.dta.filters.deffilter-imgpng.active", false);
pref("extensions.dta.filters.deffilter-imgpng.type", 2);