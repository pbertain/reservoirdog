#!/bin/bash

# rdog-rrd-web-create-img-link.sh
# Paul Bertain paul@bertain.net
# From: Wed 04 Nov 2017
# Sat 06 Dec 2024

##### CUSTOMIZE HERE #####
RESERVOIRS="$1"
##### END CUSTOMIZATION SECTION #####

RESERVOIRS_LOWER_NOSPACE=$(echo -e "${RESERVOIRS_LOWER}" | tr -d "[:space:]")
FILEPATH="/var/bertain-cdn/reservoirdog/html/rrdweb/img-link"
W_COAST_TIME=`TZ="America/Los_Angeles" date +"%a %b %-d %-H:%M%Z"`
E_COAST_TIME=`TZ="America/New_York" date +"%a %b %-d %-H:%M%Z"`
ZULU_TIMEZONE=`date -u +"%a %b %-d %-H:%M%Z"`
GET_SITE_NAME="/var/bertain-cdn/reservoirdog/bin/rdog-get-res-site-name.py"
PYTHON3="/usr/bin/python3"
HTML_IMG_PATH="/rrdweb/img-link"

for RESERVOIR in ${RESERVOIRS} ; do
    RESERVOIR_LOWER=$(echo -e "${RESERVOIR}" | tr "[:upper:]" "[:lower:]")
    SITE_NAME=`${PYTHON3} ${GET_SITE_NAME} ${RESERVOIR_LOWER}`
    for METRIC in res-ele storage ; do
        for TIMERANGE in day week month year ; do
            PRODFILE="${FILEPATH}/${RESERVOIR_LOWER}-${METRIC}-${TIMERANGE}-rrd.html"
            DAYFILE="${HTML_IMG_PATH}/${RESERVOIR_LOWER}-${METRIC}-day-rrd.html"
            WEEKFILE="${HTML_IMG_PATH}/${RESERVOIR_LOWER}-${METRIC}-week-rrd.html"
            MONTHFILE="${HTML_IMG_PATH}/${RESERVOIR_LOWER}-${METRIC}-month-rrd.html"
            YEARFILE="${HTML_IMG_PATH}/${RESERVOIR_LOWER}-${METRIC}-year-rrd.html"
            TEMPFILE="${PRODFILE}.temp"

            cat /dev/null > ${TEMPFILE}

            echo "<html>" > ${TEMPFILE}
            echo "<head>" >> ${TEMPFILE}
            echo "<meta http-equiv=\"refresh\" content=\"900\">" >> ${TEMPFILE}
            echo "<title>ReservoirDog - ${RESERVOIR} - ${METRIC^} - ${TIMERANGE^}</title>" >> ${TEMPFILE}
            echo "</head>" >> ${TEMPFILE}
            echo "<body bgcolor=\"#333333\" link=\"#CCAAAA\" alink=\"#CCAAAA\" vlink=\"#CCAAAA\">" >> ${TEMPFILE}

            echo '<table>' >> ${TEMPFILE}
            echo '<tr>' >> ${TEMPFILE}
            echo '    <td class="td_titles" rowspan="3" vertical-align="center"><a href="https://www.reservoirdog.us/index.html"><img width="100" height="81" src="/images/rdog-logo.png"></a></td>' >> ${TEMPFILE}
            echo "    <td><font color=\"yellow\" face=\"Tahoma\" size=2>" >> ${TEMPFILE}
            echo "<p><em><h2>${SITE_NAME} Historical Weather Data <font color=\"white\">- <font color=\"#d16aff\">${METRIC^} over the last ${TIMERANGE^}</h2></em></p>" >> ${TEMPFILE}
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
            echo "<tr>" >> ${TEMPFILE}
            echo "    <td><center><b><a href="/rrdweb/${RESERVOIR_LOWER}-rrd.html">All metrics for ${RESERVOIR}</a></b></center></td>" >> ${TEMPFILE}
            echo "</tr>" >> ${TEMPFILE}
            echo "<tr>" >> ${TEMPFILE}
            echo "  <td>" >> ${TEMPFILE}
            echo "  <center>" >> ${TEMPFILE}
            echo "  [ <a href="${DAYFILE}">day</a> ]" >> ${TEMPFILE}
            echo "  [ <a href="${WEEKFILE}">week</a> ]" >> ${TEMPFILE}
            echo "  [ <a href="${MONTHFILE}">month</a> ]" >> ${TEMPFILE}
            echo "  [ <a href="${YEARFILE}">year</a> ]" >> ${TEMPFILE}
            echo "  </center>" >> ${TEMPFILE}
            echo "  </td>" >> ${TEMPFILE}
            echo "</tr>" >> ${TEMPFILE}
            echo "<tr>" >> ${TEMPFILE}
            echo "  <td><center><b>${TIMERANGE^}</b></center></td>" >> ${TEMPFILE}
            echo "</tr>" >> ${TEMPFILE}
            echo "<tr>" >> ${TEMPFILE}
            echo "  <center>" >> ${TEMPFILE}
            echo "  <td><img src=\"/images/rrd/${RESERVOIR_LOWER}-${METRIC}-${TIMERANGE}.png\"></a></td>" >> ${TEMPFILE}
            echo "  </center>" >> ${TEMPFILE}
            echo "</tr>" >> ${TEMPFILE}
            echo >> ${TEMPFILE}
            echo "<td colspan=1><font color=\"#444444\"><center>${HOSTNAME}</center></font>" >> ${TEMPFILE}
            echo "</table>" >> ${TEMPFILE}
            echo "</body>" >> ${TEMPFILE}
            echo "</html>" >> ${TEMPFILE}
            mv -f ${TEMPFILE} ${PRODFILE}
        done
        sleep 1
    done
done

