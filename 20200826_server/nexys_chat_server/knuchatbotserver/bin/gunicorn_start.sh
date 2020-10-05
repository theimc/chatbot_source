#!/bin/bash

NAME="chat_bot_server"                                  # Name of the application
DJANGODIR=/usr/local/nexys_chat_server/knuchatbotserver/
HOST=localhost:8000
SOCKFILE=/usr/local/nexys_chat_server/knuchatbotserver/run/gunicorn.sock
USER=abr                                        # the user to run as
NUM_WORKERS=5                                     # how many worker processes should Gunicorn spawn
DJANGO_SETTINGS_MODULE=chat_bot_server.settings             # which settings file should Django use
DJANGO_WSGI_MODULE=chat_bot_server.wsgi                     # WSGI module name

echo "Starting $NAME as `whoami`" 

# Activate the virtual environment
#cd $DJANGODIR
#source ../bin/activate
export DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE
export PYTHONPATH=$DJANGODIR:$PYTHONPATH

# Create the run directory if it doesn't exist
RUNDIR=$(dirname $SOCKFILE)
test -d $RUNDIR || mkdir -p $RUNDIR

# Start your Django Unicorn
# Programs meant to be run under supervisor should not daemonize themselves (do not use --daemon)
exec /usr/local/bin/gunicorn ${DJANGO_WSGI_MODULE}:application \
  --name $NAME \
  --workers $NUM_WORKERS \
  --user=$USER \
  --bind=HOST \
  --log-level=debug \
  --log-file=-

