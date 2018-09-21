const spawn = require('child_process').spawnSync;
const fs = require('fs');

let showLogs = true;
if (process.argv.length > 2) {
  if (process.argv.findIndex((v) => v === '-q') > -1) {
    showLogs = false;
  }
}

async function runBuild() {
  spawn(
    'node_modules/.bin/webpack',
    ['--config=production_webpack.config.js'],
    { stdio: showLogs ? "inherit" : null, env : { FORCE_COLOR: true } },
  );

  spawn(
    'node_modules/.bin/electron-packager',
    [
      'packaging_scripts/electron_wrapper.js',
      'Eve Fleet Simulator', '--overwrite',
      '--asar', '--platform=all', '--arch=x64',
      '--out=dist/',
    ],
    { stdio: showLogs ? "inherit" : null, env : { FORCE_COLOR: true } },
  );

  const data = fs.readFileSync('dist/web/index.html', 'utf8');
  fs.writeFileSync('dist/cordova/www/index.html', data, 'utf8');
  const data2 = fs.readFileSync('dist/web/testWebpack.js', 'utf8');
  fs.writeFileSync('dist/cordova/www/testWebpack.js', data2, 'utf8');
  const data3 = fs.readFileSync('dist/web/main.css', 'utf8');
  fs.writeFileSync('dist/cordova/www/main.css', data3, 'utf8');

  // Note cordova bugs if the env option is used here, hence no color.
  spawn(
    __dirname + '/node_modules/.bin/cordova',
    ['platform', 'add', 'android'],
    { cwd: __dirname + '/dist/cordova', stdio: showLogs ? "inherit" : null },
  );

  spawn(
    __dirname + '/node_modules/.bin/cordova',
    ['build', 'android', '--release', '--device'],
    { cwd: __dirname + '/dist/cordova', stdio: showLogs ? "inherit" : null },
  );
}
runBuild();
