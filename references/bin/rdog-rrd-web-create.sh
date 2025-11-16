#!/bin/bash

# rdog-rrd-web-create.sh
# Paul Bertain paul@bertain.net
# From: Wed 02 Nov 2017
# Wed 03 Jan 2024

##### CUSTOMIZE HERE #####
RESERVOIRS="$1"
##### END CUSTOMIZATION SECTION #####

RESERVOIRS_LOWER_NOSPACE=$(echo -e "${RESERVOIRS_LOWER}" | tr -d "[:space:]")
FILEPATH="/var/bertain-cdn/reservoirdog/html/rrdweb"
W_COAST_TIME=`TZ="America/Los_Angeles" date +"%a %b %-d %-H:%M%Z"`
E_COAST_TIME=`TZ="America/New_York" date +"%a %b %-d %-H:%M%Z"`
ZULU_TIMEZONE=`date -u +"%a %b %-d %-H:%M%Z"`
GET_SITE_NAME="/var/bertain-cdn/reservoirdog/bin/rdog-get-res-site-name.py"
PYTHON3="/usr/bin/python3"

for RESERVOIR in ${RESERVOIRS} ; do
    RESERVOIR_LOWER=$(echo -e "${RESERVOIR}" | tr "[:upper:]" "[:lower:]")
    PRODFILE="${FILEPATH}/${RESERVOIR_LOWER}-rrd.html"
    TEMPFILE="${PRODFILE}.temp"
    SITE_NAME=`${PYTHON3} ${GET_SITE_NAME} ${RESERVOIR_LOWER}`

    cat /dev/null > ${TEMPFILE}

    echo "<html>" > ${TEMPFILE}
    echo "<head>" >> ${TEMPFILE}
    echo "<meta http-equiv="refresh" content="900">" >> ${TEMPFILE}
    echo "<title>ReservoirDog - ${SITE_NAME} [${RESERVOIR}] Historical Data</title>" >> ${TEMPFILE}
    echo "</head>" >> ${TEMPFILE}
    echo "<body bgcolor="#333333" link="#CCAAAA" alink="#CCAAAA" vlink="#CCAAAA">" >> ${TEMPFILE}

    echo "<font color="yellow" face="Tahoma" size=2>" >> ${TEMPFILE}

    echo '<table>' >> ${TEMPFILE}
    echo '<tr>' >> ${TEMPFILE}
    echo '    <td class="td_titles" rowspan="3" vertical-align="center"><a href="https://www.reservoirdog.us/index.html"><img width="100"  height="81" src="/images/rdog-logo.png"></a></td>' >> ${TEMPFILE}
    echo "    <td><font color="yellow" face="Tahoma" size=2>" >> ${TEMPFILE}
    echo "<p><em><h><font face=+3>${RESERVOIR} Historical Weather Data</font></h2></em></p>" >> ${TEMPFILE}
    echo '    </td>' >> ${TEMPFILE}
    echo '</tr>' >> ${TEMPFILE}

    echo '<tr>' >> ${TEMPFILE}
    echo "    <td><p><em><h3><font color="orange" face="Tahoma" size=4>Site name: ${SITE_NAME}</h3></em></p></td>" >> ${TEMPFILE}
    echo '</tr>' >> ${TEMPFILE}

    echo '<tr>' >> ${TEMPFILE}
    echo '    <td>' >> ${TEMPFILE}
    echo "        <font face="Courier" size=3>" >> ${TEMPFILE}
    echo "        <font color="cornflowerblue">${ZULU_TIMEZONE}" >> ${TEMPFILE}
    echo "        <font color="lightgreen">${W_COAST_TIME}" >> ${TEMPFILE}
    echo "        <font color="pink">${E_COAST_TIME}" >> ${TEMPFILE}
    echo '    </td>' >> ${TEMPFILE}
    echo '</tr>' >> ${TEMPFILE}
    echo '</table>' >> ${TEMPFILE}

    echo '<table style="color:#cccccc; font-family: Tahoma; font-size: 10px">' >> ${TEMPFILE}
    echo "<tr><th></th><th>RES ELEVATION</th><th>STORAGE</th></tr>" >> ${TEMPFILE}
    echo "<tr>" >> ${TEMPFILE}
    for TIMERANGE in day week month year ; do
        echo "  <td>${TIMERANGE^}</td>" >> ${TEMPFILE}
        for METRIC in res-ele storage ; do
            echo "  <td><a href="/rrdweb/img-link/${RESERVOIR_LOWER}-${METRIC}-${TIMERANGE}-rrd.html"><img src="/images/rrd/${RESERVOIR_LOWER}-${METRIC}-${TIMERANGE}.png" width="150" height="75"></a></td>" >> ${TEMPFILE}
        done
        echo "</tr>" >> ${TEMPFILE}
    done
    echo >> ${TEMPFILE}
    echo "<td colspan=4><font color=\"#444444\"><center>${HOSTNAME}</center></font>" >> ${TEMPFILE}
    echo "</table>" >> ${TEMPFILE}
    echo "</body>" >> ${TEMPFILE}
    echo "</html>" >> ${TEMPFILE}

    mv -f ${TEMPFILE} ${PRODFILE}
    sleep 1
done

