#!/bin/bash
#

i=0
log="/tmp/ycenter_restart_daemon.log"
>$log

while true; do
	[ $i -eq 15 ] && break

	for j in ycenter ylmfos-software-center ylmfcenter2; do
		if pidof ${j} >$log; then
			if pkill ypkgserviced; then  
				echo "* pkill ypkgserviced sucessfully." >>$log
			else
				pkill -9 ypkgservied && echo "* pkill -9 ypkgserviced sucessfully." >>$log
			fi	
			break
		fi
	done

	sleep 1
	let i=$i+1
done

