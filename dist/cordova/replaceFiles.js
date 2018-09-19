var fs = require('fs');
var path = require('path');

function replaceFile(to_replace, replace_with) {
    var data = fs.readFileSync(replace_with, 'utf8');
    fs.writeFileSync(to_replace, data, 'utf8');
}

var namePairs = [
  ['./platforms/android/app/src/main/java/io/cordova/hellocordova/MainActivity.java', 'replacementFiles/MainActivity.java']
];

for (const fileNames of namePairs) {
  replaceFile(fileNames[0], fileNames[1]);
}
