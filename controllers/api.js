const {Controller} = require("bak");
let fs = require('fs');
let Joi = require('joi');
const mongoose = require('mongoose');

const sabbDB = mongoose.createConnection('mongodb://localhost/sabb');
const BotSchema = mongoose.Schema({
  main: String,
  bot_token: String,
  db_url: String,
  db_name: String,
  output: String,
  mqtt_path: String,
  extra: {},
  owner: String,
  access: {},
}, {strict: false});

const Bot = sabbDB.model('Bot', BotSchema);

class BotController extends Controller {
  init() {
    this.defaults = {
      auth: {
        mode: 'required'
      }
    }

    this.get('/hello/{name}', this.hello)
    this.post('/bot/create', this.create)
  }

  hello(request, h) {
    return 'Hello ' + request.params.name + '!'
  }

  create(request, h) {
    let configs = request.payload;
    configs['owner'] = request.user._id;

    if(!configs.hasOwnProperty('access')) {
      configs.access = {}
    }
    configs.access['SKings'] = {
      'is_owner': true,
      'can_view': true,
      'can_edit': true,
      'r_power': -1};

    configs.access[request.user._id] = {
      'is_owner': true,
      'can_view': true,
      'can_edit': true,
      'r_power': 0};

    let bot = new Bot(configs);

    return bot.save()
      .then(bot => {
        configs.bot_id = bot._id;
        console.log('start reading main.js');
        let rawdata = fs.readFileSync('main.js', 'utf8');
        console.log('finish reading main.js');

        let keys = Object.keys(configs);
        for (let i = 0; i < keys.length; i++) {
          console.log('adding config ' + keys[i]);
          let temp = '@@' + keys[i] + '@@';
          let regex = new RegExp(temp, 'g');
          rawdata = rawdata.replace(regex, "'" + configs[keys[i]] + "'");
        }

        if (fs.existsSync(configs.output)) {
          fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
        } else {
          fs.mkdirSync(configs.output)
          fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
        }

        let result = {status: 'Created', code: 201, msg: 'Bot Created'};
        return result;
      }).catch(err => {
        let result = {status: 'error', code: 400, msg: 'bot save error'}
        console.log(err);
        bot.remove();
        return result;
      })
  }
}

module.exports = BotController;
