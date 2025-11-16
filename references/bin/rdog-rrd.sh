#!/bin/bash

# rdog-rrd.sh
# Looks up data for CA reservoirs and stores the data in an RRD DB
# Paul Bertain paul@bertain.net
# Based on work from: Wed 29 Feb 2012
# Date: Tue 2024-01-02

##### CUSTOMIZE HERE #####
RESERVOIRS="$1"
##### END CUSTOMIZATION SECTION #####

CURRDATE="/bin/date +%s"
RRDPATH="/var/bertain-cdn/reservoirdog/rrd-data"
RESERVOIRS_LOWER=$(echo -e "${RESERVOIRS}" | tr '[:upper:]' '[:lower:]')
BINPATH="/var/bertain-cdn/reservoirdog/bin"
PYTHON="/usr/bin/python3"
RESERVOIR_PICKER="${BINPATH}/rdog_picker.py"
RRDTOOL_BIN="/usr/bin/rrdtool"
RRDUPDATE_BIN="/usr/bin/rrdupdate"
LOGGER_BIN="/usr/bin/logger"

for RESERVOIR in ${RESERVOIRS_LOWER} ; do
    ${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - started ResevoirDog Run for ${RESERVOIR}"
    RES_ELE=`${PYTHON} ${BIN_PATH}/${RESERVOIR_PICKER} -m res_ele -s ${RESERVOIR}`
    #${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - gathered data for RES_ELE [${RES_ELE}] for ${RESERVOIR}"
    STORAGE=`${PYTHON} ${BIN_PATH}/${RESERVOIR_PICKER} -m storage -s ${RESERVOIR}`
    #${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - gathered data for STORAGE [${STORAGE}] for ${RESERVOIR}"

    ${RRDUPDATE_BIN} ${RRDPATH}/${RESERVOIR}-res-ele.rrd -t res-ele N:${RES_ELE}
    #${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - stored RES_ELE [${RES_ELE}] for ${RESERVOIR}"
    ${RRDUPDATE_BIN} ${RRDPATH}/${RESERVOIR}-storage.rrd -t storage N:${STORAGE}
    #${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - stored STORAGE [${STORAGE}] for ${RESERVOIR}"
    ${LOGGER_BIN} -t rdog_logs "`date '+%b %e %H:%M:%S %Z %U-%j'` - finished ResevoirDog Run for ${RESERVOIR}"
done
