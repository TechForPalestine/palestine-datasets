#!/usr/bin/env bash

#
# docusaurus uses svgr in the webpack pipeline with svgo turned on, which mangles all svg attributes
# and turns rects to paths, etc.. which makes manipulating svgs hard
#
# this patch turns off svgo
#
sed -i -e 's/svgo: true,/svgo: false,/g' node_modules/@docusaurus/utils/lib/webpackUtils.js
