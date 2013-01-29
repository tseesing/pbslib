
if [ -e /usr/share/terminfo/x/xterm-256color ]; then
	TERM='xterm-256color'
else    
	TERM='xterm-color'
fi

export TERM

