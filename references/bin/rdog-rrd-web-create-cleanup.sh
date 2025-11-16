#!/bin/bash

CLEANUP_DIRS="rrdweb rrdweb/img-link"

for DIR in ${CLEANUP_DIRS} ; do
    cd /var/www/vhosts/reservoirdog/html/${DIR}
    for FILE in `ls -1 | grep temp` ; do
        NAME=`echo ${FILE} | sed -e 's/.temp//'`
        mv -f ${FILE} ${NAME}
    done
done
