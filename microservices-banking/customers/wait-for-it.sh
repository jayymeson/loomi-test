#!/usr/bin/env bash
# Use this script to test if a given TCP host/port are available

set -e

TIMEOUT=15
QUIET=0
HOST=""
PORT=""

echoerr() {
  if [[ $QUIET -ne 1 ]]; then
    echo "$@" 1>&2
  fi
}

usage() {
  cat << USAGE >&2
Usage:
  $0 host:port [-t timeout] [-- command args]
  -q | --quiet                        Do not output any status messages
  -t TIMEOUT | --timeout=timeout      Timeout in seconds, zero for no timeout
  -- COMMAND ARGS                     Execute command with args after the test finishes
USAGE
  exit 1
}

wait_for() {
  if [[ $TIMEOUT -gt 0 ]]; then
    echoerr "$0: waiting $TIMEOUT seconds for $HOST:$PORT"
  else
    echoerr "$0: waiting for $HOST:$PORT without a timeout"
  fi

  start_ts=$(date +%s)
  while :
  do
    if [[ $QUIET -eq 0 ]]; then
      echoerr "$0: checking $HOST:$PORT..."
    fi
    nc -z "$HOST" "$PORT" && break
    sleep 1
  done
}

wait_for_wrapper() {
  # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
  if [[ $QUIET -eq 1 ]]; then
    timeout $TIMEOUT $0 -q -t 0 -- "$@" &
  else
    timeout $TIMEOUT $0 -t 0 -- "$@" &
  fi
  PID=$!
  trap "kill -INT -$PID" INT
  wait $PID
  trap - INT
  EXIT_CODE=$?
  if [[ $EXIT_CODE -ne 0 ]]; then
    echoerr "$0: timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
  fi
  return $EXIT_CODE
}

while [[ $# -gt 0 ]]
do
  case "$1" in
    *:* )
    HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
    PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
    shift 1
    ;;
    -q | --quiet)
    QUIET=1
    shift 1
    ;;
    -t)
    TIMEOUT="$2"
    if [[ $TIMEOUT == "" ]]; then break; fi
    shift 2
    ;;
    --timeout=*)
    TIMEOUT="${1#*=}"
    shift 1
    ;;
    --)
    shift
    break
    ;;
    -*)
    echoerr "Unknown flag: $1"
    usage
    ;;
    *)
    break
    ;;
  esac
done

if [[ "$HOST" == "" || "$PORT" == "" ]]; then
  echoerr "Error: you need to provide a host and port to test."
  usage
fi

wait_for_wrapper "$@"
