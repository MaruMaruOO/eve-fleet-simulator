import { shipBaseJSON } from './../src/base_derived_stats';
//const shipBaseJSON = require('./../src/shipBaseJSON.js');
//const fs = require('../fs');
const fs = __non_webpack_require__('fs');
//import fs from 'fs';
const baseShips = JSON.parse(shipBaseJSON);

const resizedWidths = ['src', '35', '80'];
for (const widthBase of resizedWidths) {
  const width = widthBase === 'src' ? '' : 'w' + widthBase;
  const widthDir = widthBase === 'src' ? '' : 'w' + widthBase + '/';
  fs.open(`./../src/eve_icons/renders/renderIcons${width.toUpperCase()}.js`, 'w', (err, fd) => {
    let exportRef = '';
    for (const ship of baseShips) {
      const id = ship.typeID.toString();
      const impStr = `import i${id}${width} from './Renders/${widthDir}${id}.png';
`;
      fs.writeSync(fd, impStr);
    }
    const objName = `renderIcons${width.toUpperCase()}`;
    exportRef += `${objName}`;
    fs.writeSync(fd, `const ${objName} = { `);
    for (const ship of baseShips) {
      const id = ship.typeID.toString();
      const impStr = `'i${id}': i${id}${width}, `;
      fs.writeSync(fd, impStr);
    }
    fs.writeSync(fd, `};
`);
    fs.writeSync(fd, `export default ${exportRef};`);
  });
}
let i = 0;
for (const ship of baseShips) {
  // console.log(`./../Renders/${ship.typeID.toString()}.png`, i);
  i++;
}
