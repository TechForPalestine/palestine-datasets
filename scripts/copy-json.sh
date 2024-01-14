#!/usr/bin/env bash

#
# copy JSON data files to the built doc site for static file serving as our API
#

builddir=./site/build/data/

mkdir -p "$builddir"
cp ./martyrs.json "$builddir"
cp ./casualties_daily.json "$builddir"

echo "Copied data files to built site data subfolder: $builddir"
