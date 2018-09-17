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

class BotManageController extends Controller {
  init() {
    this.defaults = {
      auth: {
        mode: 'required'
      }
    };

    this.post('/bot/create', this.create);
    this.post('/bot/build/{bot_id}', this.build);
    this.post('/bot/get/bots', this.get_bots);
    this.get('/bot/delete/{bot_id}', this.delete);
    this.get('/bot/{bot_id}', this.read);
    this.post('/bot/share/{bot_id}/{user_id}', this.share_bot);
    this.get('/bot/revoke/{bot_id}/{user_id}', this.revoke_bot);
  }

  create(request, h) {
    let configs = request.payload;
    configs['owner'] = request.user._id;

    if (!configs.hasOwnProperty('access')) {
      configs.access = {}
    }
    configs.access['SKings'] = {
      'is_owner': true,
      'can_view': true,
      'can_edit': true,
      'can_delete': true,
      'can_code': true,
      'can_share': true,
      'r_power': -1
    };

    configs.access[request.user._id] = {
      'is_owner': true,
      'can_view': true,
      'can_edit': true,
      'can_delete': true,
      'can_code': true,
      'can_share': true,
      'r_power': 0
    };

    let bot = new Bot(configs);

    return bot.save()
      .then(bot => {
        configs.bot_id = bot._id;
        console.log('start reading main.js');
        let rawdata = fs.readFileSync('main.js', 'utf8');
        console.log('finish reading main.js');

        let keys = Object.keys(configs);

        keys.forEach(key => {
          const value = configs[key];
          console.log('adding config ' + key);
          let temp = '@@' + key + '@@';
          let regex = new RegExp(temp, 'g');
          rawdata = rawdata.replace(regex, "'" + value + "'");
        });

        if (fs.existsSync(configs.output)) {
          fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
        } else {
          fs.mkdirSync(configs.output);
          fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
        }

        let result = {msg: 'Bot Created', bot_id: bot._id};
        return h.response(result).code(201);
      }).catch(err => {
        let result = {msg: 'bot save error'};
        console.log(err);
        bot.remove();

        let path = configs.output + '/' + configs.main;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }

        return h.response(result).code(400);
      })
  }

  async build(request, h) {
    console.log('here')
    let bot = await Bot.findById(request.params.bot_id);

    let configs = {};
    if(request.payload !== null) {
      configs = request.payload;
    }

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    console.log(bot);
    if (bot.access.hasOwnProperty(request.user._id)) {
      if (bot.access[request.user._id].can_edit) {
        let path = bot.output + '/' + bot.main;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      } else {
        let result = {msg: 'Forbidden'};
        return h.response(result).code(403);
      }
    }


    let keys = Object.keys(configs);
    keys.forEach(key => {
      if (key !== '_id' && key !== 'owner' && key !== 'access') {
        bot[key] = configs[key];
      }
    });

    return bot.save()
      .then(bot => {
        console.log('start reading main.js');
        let rawdata = fs.readFileSync('main.js', 'utf8');
        console.log('finish reading main.js');

        let keys = Object.keys(bot);

        keys.forEach(key => {
          const value = bot[key];
          console.log('adding config ' + key);
          let temp = '@@' + key + '@@';
          let regex = new RegExp(temp, 'g');
          rawdata = rawdata.replace(regex, "'" + value + "'");
        });

        if (fs.existsSync(bot.output)) {
          fs.writeFileSync(bot.output + '/' + bot.main, rawdata, 'utf8')
        } else {
          fs.mkdirSync(bot.output);
          fs.writeFileSync(bot.output + '/' + bot.main, rawdata, 'utf8')
        }

        let result = {msg: 'Bot Build', bot_id: bot._id};
        return h.response(result).code(200);
      }).catch(err => {
        let result = {msg: 'bot save error'};
        console.log(err);
        bot.remove();

        let path = bot.output + '/' + bot.main;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }

        return h.response(result).code(400);
      })
  }

  async delete(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    let path = bot.output + '/' + bot.main;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }

    if (bot.access.hasOwnProperty(request.user._id)) {
      if (bot.access[request.user._id].can_delete) {
        bot.remove();
        let result = {msg: 'Bot Deleted'};
        return h.response(result).code(200);
      }
    }

    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async read(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    if (bot.access.hasOwnProperty(request.user._id)) {
      if (bot.access[request.user._id].can_view) {
        return h.response(bot).code(200);
      }
    }

    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async get_bots(request, h) {
    let bots;
    let query = {};
    query['access.' + request.user._id + '.can_view'] = true;
    if (request.payload.hasOwnProperty('page') && request.payload.hasOwnProperty('limit')) {
      let skip = request.payload.page * request.payload.limit;
      if (request.user.r_power >= 0) {
        bots = await Bot.find(query).skip(skip).limit(parseInt(request.payload.limit));
      } else {
        bots = await Bot.find().skip(skip).limit(parseInt(request.payload.limit));
      }
    } else {
      if (request.user.r_power >= 0) {
        bots = await Bot.find(query);
      } else {
        bots = await Bot.find();
      }
    }
    return h.response(bots).code(200);
  }

  async share_bot(request, h) {
    let bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    let user = await sabbDB.model('User').findById(request.params.user_id);

    if (user == null) {
      let result = {msg: 'User not found'};
      return h.response(result).code(404);
    }

    if (bot.access.hasOwnProperty(request.user._id)) {
      if (bot.access[request.user._id].can_share) {
        if (!bot.access.hasOwnProperty(request.params.user_id)) {
          let acc = request.payload;
          acc.is_owner = false;
          acc.r_power = bot.access[request.user._id].r_power + 1;
          bot.access[request.params.user_id] = acc;
          await Bot.findByIdAndUpdate(request.params.bot_id, bot, {upsert: true});
          return h.response(acc).code(200);
        } else {
          let result = {msg: 'Already exist'};
          return h.response(result).code(409);
        }
      }
    }

    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  // todo see who have access
  // todo update access

  async revoke_bot(request, h) {
    let bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    let user = await sabbDB.model('User').findById(request.params.user_id);

    if (user == null) {
      let result = {msg: 'User not found'};
      return h.response(result).code(404);
    }

    if (bot.access.hasOwnProperty(request.user._id)) {
      if (bot.access[request.user._id].can_share) {
        if (bot.access.hasOwnProperty(request.params.user_id)) {

          if (bot.access[request.user._id].r_power < bot.access[request.params.user_id].r_power) {
            delete bot.access[request.params.user_id];
            await Bot.findByIdAndUpdate(request.params.bot_id, bot, {upsert: true});
            let result = {msg: 'Access revoke'};
            return h.response(result).code(200);
          } else {
            let result = {msg: 'You don`t have permission to revoke user access'};
            return h.response(result).code(403);
          }
        } else {
          let result = {msg: 'User had not access'};
          return h.response(result).code(200);
        }
      }
    }

    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }
}

module.exports = BotManageController;
