import { shipBaseJSON } from './../src/base_derived_stats';
const fs = __non_webpack_require__('fs');
const process = __non_webpack_require__('process');
const baseShips = shipBaseJSON;

if (process.argv.length > 2) {
  if (process.versions.node < '8.5.0' && Number(process.versions.node.split('.')[0]) < 9) {
    throw `node 8.5.0+ required to run this script, found ${process.versions.node}`;
  }
  let renderSrc = process.argv[2];
  if (!renderSrc.endsWith('/')) {
    renderSrc += '/';
  }
  let coveredIds = {};
  for (const ship of baseShips) {
    if (!coveredIds[ship.typeID]) {
      coveredIds[ship.typeID] = 1;
      const fileName = ship.typeID.toString() + '.png';
      fs.copyFileSync(renderSrc + fileName, './../src/eve_icons/renders/Renders/' + fileName);
    }
  }
}
if (fs.readdirSync('./../src/eve_icons/renders/Renders/').length < 100) {
  console.log(fs.readdirSync('./../src/eve_icons/renders/Renders/'));
  console.error(`Could not find render icons at ./../src/eve_icons/renders/Renders/
Please supply a render source so the required renders can be copied across.
(eg node icon_select.js $SOME_PATH/Into_The_Abyss_1.0_Renders/Renders/`);
  throw 1;
}

const resizedWidths = ['src', '35', '80'];
for (const widthBase of resizedWidths) {
  const width = widthBase === 'src' ? '' : 'w' + widthBase;
  const widthDir = widthBase === 'src' ? '' : 'w' + widthBase + '/';
  fs.open(`./../src/eve_icons/renders/renderIcons${width.toUpperCase()}.js`, 'w', (err, fd) => {
    fs.writeSync(fd, `// @flow
`);
    let exportRef = '';
    let coveredIds = {};
    for (const ship of baseShips) {
      if (!coveredIds[ship.typeID]) {
        coveredIds[ship.typeID] = 1;
        const id = ship.typeID.toString();
        const impStr = `import i${id}${width} from './Renders/${widthDir}${id}.png';
`;
        fs.writeSync(fd, impStr);
      }
    }
    const objName = `renderIcons${width.toUpperCase()}`;
    exportRef += `${objName}`;
    fs.writeSync(fd, `const ${objName} = { `);
    coveredIds = {};
    for (const ship of baseShips) {
      if (!coveredIds[ship.typeID]) {
        coveredIds[ship.typeID] = 1;
        const id = ship.typeID.toString();
        const impStr = `'i${id}': i${id}${width}, `;
        fs.writeSync(fd, impStr);
      }
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
