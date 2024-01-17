#!/usr/bin/env bash

#
# copy JSON data files to the built doc site for static file serving as our API
#

bun run scripts/build/assemble-api-resources.ts

