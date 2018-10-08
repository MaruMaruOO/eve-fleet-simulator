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

  const data = fs.readFileSync('dist/web/index.html', 'utf8');
  const data2 = fs.readFileSync('dist/web/efs.js', 'utf8');
  const data3 = fs.readFileSync('dist/web/main.css', 'utf8');
  const data4 = fs.readFileSync('src/eve_icons/page_icon.png', 'latin1');

  fs.writeFileSync('dist/electron_content/index.html', data, 'utf8');
  fs.writeFileSync('dist/electron_content/efs.js', data2, 'utf8');
  fs.writeFileSync('dist/electron_content/main.css', data3, 'utf8');
  fs.writeFileSync('dist/electron_content/page_icon.png', data4, 'latin1');

  spawn(
    'node_modules/.bin/electron-packager',
    [
      'dist/electron_content/',
      'Eve Fleet Simulator', '--overwrite',
      '--asar', '--platform=all', '--arch=x64',
      '--out=dist/', '--icon=src/eve_icons/page_icon',
    ],
    { stdio: showLogs ? "inherit" : null, env : { FORCE_COLOR: true } },
  );

  // Ignore mobile for now as it's just the website anyway.
  // It may be worth considering react native builds in the future.
  const BUILD_MOBILE = false;
  if (BUILD_MOBILE) {
    fs.writeFileSync('dist/cordova/www/index.html', data, 'utf8');
    fs.writeFileSync('dist/cordova/www/efs.js', data2, 'utf8');
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
}
runBuild();
