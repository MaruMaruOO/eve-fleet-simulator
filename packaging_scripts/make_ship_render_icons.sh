cd /home/stock/scripts/semantic_eve_sim/src/eve_icons/renders/Renders
find -maxdepth 1 -iname "*.png" -exec convert -scale 35 {} w35/{} \;
find -maxdepth 1 -iname "*.png" -exec convert -scale 80 {} w80/{} \;
