#!/bin/sh
#
. /etc/profile.d/jdk.sh
. /etc/profile.d/jre.sh

echo Running 'java antlr.Tool $*' with /usr/share/java/antlr.jar appended to the CLASSPATH variable
export CLASSPATH

CLASSPATH=$CLASSPATH:/usr/share/java/antlr.jar
java antlr.Tool $*
