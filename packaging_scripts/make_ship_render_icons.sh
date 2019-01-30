#!/bin/bash
# Icons are included in the git so this is only needed when creating a new release.
# This is a linux bash script, it also requires imagemagick and GNU find.
cd ../src/eve_icons/renders/Renders
find -maxdepth 1 -iname "*.png" -exec convert -scale 35 {} w35/{} \;
find -maxdepth 1 -iname "*.png" -exec convert -scale 80 {} w80/{} \;
