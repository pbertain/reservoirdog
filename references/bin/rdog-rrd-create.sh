#!/bin/bash
# Check out: https://apfelboymchen.net/gnu/rrd/create/

# Which reservoir is this data for?
RESERVOIR=$1
RESERVOIR_LOWER=$(echo -e "${RESERVOIR}" | tr '[:upper:]' '[:lower:]')

# where to store data. relative to current directory, MUST EXIST
STOREPATH="/var/bertain-cdn/reservoirdog/rrd-data"

# at which interval do we feed new data to rrd
STEP="300"

### 1 DAY
# 1*300s = 5 min (avg)
# 5min*288 = 1 day (duration)
DAYAVG="1"
DAYSTEPS="288"

### 7 DAYS (1 week)
# 3*300s = 15 min (avg)
# 15min*672 = 7 days (duration)
WEEKAVG="3"
WEEKSTEPS="672"

### 30 DAYS (~1 month)
# 6*300s = 30 min (avg)
# 30min*1440 = 30 days (duration)
MONAVG="6"
MONSTEPS="1440"

### 3650 DAYS (~10 years)
# 12*300s = 60 min (avg)
# 60min*87600 = 3650 days (duration)
YEARAVG="12"
YEARSTEPS="87600"

rrdcreate ${STOREPATH}/${RESERVOIR_LOWER}-res-ele.rrd \
  --no-overwrite --start now --step $STEP \
  DS:res-ele:GAUGE:3600:0:U \
  RRA:AVERAGE:0.5:$DAYAVG:$DAYSTEPS \
  RRA:AVERAGE:0.5:$WEEKAVG:$WEEKSTEPS \
  RRA:AVERAGE:0.5:$MONAVG:$MONSTEPS \
  RRA:AVERAGE:0.5:$YEARAVG:$YEARSTEPS

rrdcreate ${STOREPATH}/${RESERVOIR_LOWER}-storage.rrd \
  --no-overwrite --start now --step $STEP \
  DS:storage:GAUGE:3600:0:U \
  RRA:AVERAGE:0.5:$DAYAVG:$DAYSTEPS \
  RRA:AVERAGE:0.5:$WEEKAVG:$WEEKSTEPS \
  RRA:AVERAGE:0.5:$MONAVG:$MONSTEPS \
  RRA:AVERAGE:0.5:$YEARAVG:$YEARSTEPS

