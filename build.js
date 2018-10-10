const spawn = require('child_process').spawnSync;

spawn(
  'node_modules/.bin/webpack',
  [],
  { stdio: "inherit", env : { FORCE_COLOR: true } }
);
