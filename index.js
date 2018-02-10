var fs = require('fs');

console.log('start reading configs');
let rawdata = fs.readFileSync('bot_package.json');
let configs = JSON.parse(rawdata, 'utf8');
console.log('finish reading configs');

console.log('start reading main.js');
rawdata = fs.readFileSync(configs.main, 'utf8');
console.log('finish reading main.js');

let keys = Object.keys(configs);
for (let i = 0; i < keys.length; i++) {
  console.log('adding config ' + keys[i]);
  let temp = '@@'+keys[i]+'@@';
  let regex = new RegExp(temp, 'g');
  rawdata = rawdata.replace(regex, "'"+configs[keys[i]]+"'");
}

if(fs.existsSync(configs.output)) {
  fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
} else {
  fs.mkdirSync(configs.output)
  fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
}
