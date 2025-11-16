#!/bin/bash

# rdog-rrd-graph.sh
# Graph the data from ReservoirDog
# Paul Bertain paul@bertain.net
# Based on work from: Tue 31 Oct 2018
# Wed 03 Jan 2024

##### CUSTOMIZE HERE #####
RESERVOIRS="$1"
##### END CUSTOMIZATION SECTION #####

##### GLOBAL VARS #####
RESERVOIRDOG_TM="ReservoirDog® `date '+%Y'` ~ `date '+%a %d %b %y - %H:%M'`"
DATE_PRINT=`date '+%b %e - %H:%M %Z'`
RRDBINPATH="/usr/bin/"
RRDIMGPATH="/var/bertain-cdn/reservoirdog/images/rrd"
RRDPATH="/var/bertain-cdn/reservoirdog/rrd-data"
PYTHON3="/usr/bin/python3"
##### GLOBAL VARS #####

for RESERVOIR in ${RESERVOIRS} ; do
    RESERVOIR_LOWER=$(echo -e "${RESERVOIR}" | tr "[:upper:]" "[:lower:]")
    SITE_NAME=${RESERVOIR}

    # RESERVOIR ELEVATION
    ## Day
    ${RRDBINPATH}/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-res-ele-day.png \
        -r \
        -s -24h -e now --step 500 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Reservoir Elevation - Day\n${DATE_PRINT}" \
        --x-grid MINUTE:30:HOUR:1:MINUTE:120:0:%R \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 0 \
        --left-axis-format "%4.0lf" \
        --right-axis 1:0 \
        --right-axis-label "Elevation in Feet" \
        --right-axis-format %4.0lf \
        --upper-limit 1000 -l 0 \
        --vertical-label "Elevation in Feet" \
        --y-grid 50:2 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:res-ele_avg=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:AVERAGE \
        DEF:res-ele_min=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MIN \
        DEF:res-ele_max=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MAX \
        LINE3:res-ele_avg#00FF00:"RES ELEV" \
        GPRINT:res-ele_avg:LAST:"AVG\: %4.2lf ft\n" \
        LINE1:res-ele_min#0000FF:"RES ELEV" \
        GPRINT:res-ele_min:MIN:"MIN\: %4.2lf ft\n" \
        LINE1:res-ele_max#FF0000:"RES ELEV" \
        GPRINT:res-ele_max:MAX:"MAX\: %4.2lf ft\n" ;

    ## Week
    ${RRDBINPATH}/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-res-ele-week.png \
        -r \
        -s -7d -e now --step 3600 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Reservoir Elevation - Week\n${DATE_PRINT}" \
        --x-grid HOUR:12:DAY:1:DAY:1:0:"%a %m/%d" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 0 \
        --left-axis-format "%4.0lf" \
        --right-axis 1:0 \
        --right-axis-label "Elevation in Feet" \
        --right-axis-format %4.0lf \
        --upper-limit 1000 -l 0 \
        --vertical-label "Elevation in Feet" \
        --y-grid 50:2 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:res-ele_avg=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:AVERAGE \
        DEF:res-ele_min=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MIN \
        DEF:res-ele_max=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MAX \
        LINE3:res-ele_avg#00FF00:"RES ELEV" \
        GPRINT:res-ele_avg:LAST:"AVG\: %4.2lf ft\n" \
        LINE1:res-ele_min#0000FF:"RES ELEV" \
        GPRINT:res-ele_min:MIN:"MIN\: %4.2lf ft\n" \
        LINE1:res-ele_max#FF0000:"RES ELEV" \
        GPRINT:res-ele_max:MAX:"MAX\: %4.2lf ft\n" ;

    ## Month
    ${RRDBINPATH}/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-res-ele-month.png \
        -r \
        -s -30d -e now --step 10800 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Reservoir Elevation - Month\n${DATE_PRINT}" \
        --x-grid DAY:1:DAY:7:DAY:7:0:"Week %U" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 0 \
        --left-axis-format "%4.0lf" \
        --right-axis 1:0 \
        --right-axis-label "Elevation in Feet" \
        --right-axis-format %4.0lf \
        --upper-limit 1000 -l 0 \
        --vertical-label "Elevation in Feet" \
        --y-grid 50:2 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:res-ele_avg=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:AVERAGE \
        DEF:res-ele_min=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MIN \
        DEF:res-ele_max=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MAX \
        LINE3:res-ele_avg#00FF00:"RES ELEV" \
        GPRINT:res-ele_avg:LAST:"AVG\: %4.2lf ft\n" \
        LINE1:res-ele_min#0000FF:"RES ELEV" \
        GPRINT:res-ele_min:MIN:"MIN\: %4.2lf ft\n" \
        LINE1:res-ele_max#FF0000:"RES ELEV" \
        GPRINT:res-ele_max:MAX:"MAX\: %4.2lf ft\n" ;

    ## Year
    ${RRDBINPATH}/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-res-ele-year.png \
        -r \
        -s -365d -e now --step 21600 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Reservoir Elevation - Year\n${DATE_PRINT}" \
        --x-grid WEEK:1:MONTH:1:MONTH:2:0:"%b %Y" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 0 \
        --left-axis-format "%4.0lf" \
        --right-axis 1:0 \
        --right-axis-label "Elevation in Feet" \
        --right-axis-format %4.0lf \
        --upper-limit 1000 -l 0 \
        --vertical-label "Elevation in Feet" \
        --y-grid 50:2 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:res-ele_avg=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:AVERAGE \
        DEF:res-ele_min=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MIN \
        DEF:res-ele_max=${RRDPATH}/${RESERVOIR_LOWER}-res-ele.rrd:res-ele:MAX \
        LINE3:res-ele_avg#00FF00:"RES ELEV" \
        GPRINT:res-ele_avg:LAST:"AVG\: %4.2lf ft\n" \
        LINE1:res-ele_min#0000FF:"RES ELEV" \
        GPRINT:res-ele_min:MIN:"MIN\: %4.2lf ft\n" \
        LINE1:res-ele_max#FF0000:"RES ELEV" \
        GPRINT:res-ele_max:MAX:"MAX\: %4.2lf ft\n" ;

  # STORAGE
   ## Days
    $RRDBINPATH/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-storage-day.png \
        -r \
        -s -24h -e now --step 500 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Storage - Day\n${DATE_PRINT}" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 6 \
        --left-axis-format "%5.3lf M" \
        --right-axis 0.000001:0 \
        --right-axis-label 'Acre Feet' \
        --right-axis-format "%5.3lf M" \
        --upper-limit 3000000 -l 1000000 -r \
        --vertical-label 'Acre Feet' \
        --x-grid MINUTE:30:HOUR:1:HOUR:2:0:%R \
        --y-grid 250000:1 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:storage_avg=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:AVERAGE \
        DEF:storage_min=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MIN \
        DEF:storage_max=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MAX \
        LINE3:storage_avg#00FF00:"STORAGE" \
        GPRINT:storage_avg:LAST:"AVG\: %5.3lf%s AF\n" \
        LINE1:storage_min#0000FF:"STORAGE" \
        GPRINT:storage_min:MIN:"MIN\: %5.3lf%s AF\n" \
        LINE1:storage_max#FF0000:"STORAGE" \
        GPRINT:storage_max:MAX:"MAX\: %5.3lf%s AF\n" ;

   ## Weeks
    $RRDBINPATH/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-storage-week.png \
        -r \
        -s -7d -e now --step 3600 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Storage - Week\n${DATE_PRINT}" \
        --x-grid HOUR:12:DAY:1:DAY:1:0:"%a %m/%d" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 6 \
        --left-axis-format "%5.3lf M" \
        --right-axis 0.000001:0 \
        --right-axis-label 'Acre Feet' \
        --right-axis-format "%5.3lf M" \
        --upper-limit 3000000 -l 1000000 -r \
        --vertical-label 'Acre Feet' \
        --y-grid 250000:1 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:storage_avg=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:AVERAGE \
        DEF:storage_min=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MIN \
        DEF:storage_max=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MAX \
        LINE3:storage_avg#00FF00:"STORAGE" \
        GPRINT:storage_avg:LAST:"AVG\: %5.3lf%s AF\n" \
        LINE1:storage_min#0000FF:"STORAGE" \
        GPRINT:storage_min:MIN:"MIN\: %5.3lf%s AF\n" \
        LINE1:storage_max#FF0000:"STORAGE" \
        GPRINT:storage_max:MAX:"MAX\: %5.3lf%s AF\n" ;

   ## Months
    $RRDBINPATH/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-storage-month.png \
        -r \
        -s -30d -e now --step 10800 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Storage - Month\n${DATE_PRINT}" \
        --x-grid DAY:1:DAY:7:DAY:7:0:"Week %U" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 6 \
        --left-axis-format "%5.3lf M" \
        --right-axis 0.000001:0 \
        --right-axis-label 'Acre Feet' \
        --right-axis-format "%5.3lf M" \
        --upper-limit 3000000 -l 1000000 -r \
        --vertical-label 'Acre Feet' \
        --y-grid 250000:1 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:storage_avg=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:AVERAGE \
        DEF:storage_min=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MIN \
        DEF:storage_max=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MAX \
        LINE3:storage_avg#00FF00:"STORAGE" \
        GPRINT:storage_avg:LAST:"AVG\: %5.3lf%s AF\n" \
        LINE1:storage_min#0000FF:"STORAGE" \
        GPRINT:storage_min:MIN:"MIN\: %5.3lf%s AF\n" \
        LINE1:storage_max#FF0000:"STORAGE" \
        GPRINT:storage_max:MAX:"MAX\: %5.3lf%s AF\n" ;

   ## Years
    $RRDBINPATH/rrdtool graph ${RRDIMGPATH}/${RESERVOIR_LOWER}-storage-year.png \
        -r \
        -s -365d -e now --step 21600 --slope-mode \
        -t "${SITE_NAME} [${RESERVOIR}] Storage - Year\n${DATE_PRINT}" \
        --x-grid WEEK:1:MONTH:1:MONTH:2:0:"%b %Y" \
        -w 500 -h 309 \
        -W "${RESERVOIRDOG_TM}" \
        -Y -a PNG \
        --units-exponent 6 \
        --left-axis-format "%5.3lf M" \
        --right-axis 0.000001:0 \
        --right-axis-label 'Acre Feet' \
        --right-axis-format "%5.3lf M" \
        --upper-limit 3000000 -l 1000000 -r \
        --vertical-label 'Acre Feet' \
        --y-grid 250000:1 \
        --color CANVAS#111111 \
        --color BACK#333333 \
        --color FONT#CCCCCC \
        DEF:storage_avg=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:AVERAGE \
        DEF:storage_min=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MIN \
        DEF:storage_max=${RRDPATH}/${RESERVOIR_LOWER}-storage.rrd:storage:MAX \
        LINE3:storage_avg#00FF00:"STORAGE" \
        GPRINT:storage_avg:LAST:"AVG\: %5.3lf%s AF\n" \
        LINE1:storage_min#0000FF:"STORAGE" \
        GPRINT:storage_min:MIN:"MIN\: %5.3lf%s AF\n" \
        LINE1:storage_max#FF0000:"STORAGE" \
        GPRINT:storage_max:MAX:"MAX\: %5.3lf%s AF\n" ;

done

