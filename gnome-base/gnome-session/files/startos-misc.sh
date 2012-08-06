#!/bin/bash
#

#
if [ -f /etc/yget.conf ]; then
	. /etc/yget.conf
	if [ ! -h $HOME/Apps ] && [ -d $YPPATH_PKGDEST ]; then
		ln -sf $YPPATH_PKGDEST $HOME/Apps
	fi
fi
#
if [ -f $HOME/.config/user-dirs.dirs ] && [ ! -f $HOME/.flag ]; then
	. $HOME/.config/user-dirs.dirs
	for i in chromium.desktop webqq-web.desktop softwarecenter.desktop; do
		cp /usr/share/applications/${i}	$XDG_DESKTOP_DIR
	done
	touch $HOME/.flag
fi

exit 0
