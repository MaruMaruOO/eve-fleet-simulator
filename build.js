const { execSync } = require('child_process');

try {
  execSync('node node_modules/.bin/webpack');
} catch(e) {
  // This is expected to occur on inital builds
  execSync('node node_modules/.bin/webpack');
}
