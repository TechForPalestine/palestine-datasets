#!/usr/bin/env bash

#
# copy JSON data files to the built doc site for static file serving as our API
#

build_dir=./site/build
build_data="$build_dir/data"

mkdir -p "$build_data"
cp ./martyrs.json "$build_data"
cp ./casualties_daily.json "$build_data"

echo "Copied data files to built site data subfolder: $build_data"

#
# add custom domain CNAME file for Github Pages deploy
#

echo "palidata.swj.io" > "$build_dir/CNAME"
echo "Set Github Pages custom CNAME"
