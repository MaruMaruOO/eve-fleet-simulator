const { execSync } = require('child_process');
const fs = require('fs');

try {
  execSync('node node_modules/.bin/webpack --config production_webpack.config.js');
} catch(e) {
} finally {
  // Always run twice for production builds to make sure they reflect style changes.
  execSync('node node_modules/.bin/webpack --config production_webpack.config.js');
}
var data = fs.readFileSync('lib/index.html', 'utf8');
fs.writeFileSync('dist/web/index.html', data, 'utf8');

try {
  execSync(
    'node_modules/.bin/electron-packager packaging_scripts/electron_wrapper.js "Eve Fleet Simulator" --overwrite --asar --platform=all' +
      ' --arch=x64' +
      ' --out=dist/'
  );
} catch(e) {
  console.log(e.error);
}

let envSettings = '';
if (process.argv.length > 2 && process.argv[2] === '--use-custom-env') {
  envSettings = `export ANDROID_STD=$\{HOME\}/scripts/android-studio-ide-173.4907809-linux/android-studio
export ANDROID_HOME=$\{HOME\}/Android/Sdk
export JAVA_HOME=$ANDROID_STD/jre
export PATH=$\{PATH\}:$ANDROID_STD/gradle/gradle-4.4/bin
export PATH=$\{PATH\}:$ANDROID_STD/jre/bin
export PATH=$\{PATH\}:$ANDROID_HOME/Sdk/tools/bin
export PATH=$\{PATH\}:$ANDROID_HOME/Sdk/tools
export PATH=$\{PATH\}:$ANDROID_HOME/Sdk/build-tools/28.0.2
`;
}
try {
  execSync(
    `${envSettings} ./../../node_modules/.bin/cordova platform add android`,
    { cwd: __dirname + '/dist/cordova', stdio: 'pipe' }
  );
} catch(e) {
  console.log(e.error);
}

execSync(
  `${envSettings}
./../../node_modules/.bin/cordova build android --release --device`, { cwd: __dirname + '/dist/cordova' });
