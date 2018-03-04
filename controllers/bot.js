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

const UserSchema = mongoose.Schema({
  _id: String,
  state: String,
  role: String,
  first_name: String,
  last_name: String,
  username: String,
  is_bot: Boolean,
  language_code: String,
  extra: {},
}, {strict: false});


const MessageSchema = mongoose.Schema({
  command: String,
  event_type: String,
  replies: Array,
  code: String,
  trigger_state: String,
}, {strict: false});

class BotController extends Controller {
  init() {
    this.defaults = {
      auth: {
        mode: 'required'
      }
    };

    this.post('/bot/get/users/{bot_id}', this.get_users);
    this.post('/bot/get/messages/{bot_id}', this.get_messages);

  }

  async get_users(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
    const User = botDB.model('User', UserSchema);

    let users;

    if (request.payload.hasOwnProperty('page') && request.payload.hasOwnProperty('limit')) {
      let skip = request.payload.page * request.payload.limit;
      users = await User.find().skip(skip).limit(parseInt(request.payload.limit));
    } else {
      users = await User.find();
    }

    botDB.close();

    return h.response(users).code(200);
  }

  async get_messages(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
    const Message = botDB.model('Message', MessageSchema);

    let messages;

    if (request.payload.hasOwnProperty('page') && request.payload.hasOwnProperty('limit')) {
      let skip = request.payload.page * request.payload.limit;
      messages = await Message.find().skip(skip).limit(parseInt(request.payload.limit));
    } else {
      messages = await Message.find();
    }

    botDB.close();

    return h.response(messages).code(200);
  }

  // todo add message
  // todo get message
  // todo delete message
  // todo update message
}

module.exports = BotController;
