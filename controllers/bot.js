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

    this.post('/bot/message/add/{bot_id}', this.add_message);
    this.get('/bot/message/get/{bot_id}/{msg_id}', this.get_message);
    this.get('/bot/message/delete/{bot_id}/{msg_id}', this.delete_message);
    this.post('/bot/message/update/{bot_id}/{msg_id}', this.update_message);

  }

  async get_users(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    if (bot.access[request.user._id].can_view) {
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
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async get_messages(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }
    if (bot.access[request.user._id].can_view) {
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
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async add_message(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    let message_params = request.payload;
    let permit = false;

    if (message_params.event_type === 'eval' && bot.access[request.user._id].can_code) {
      permit = true;
    } else if (message_params.event_type !== 'eval' && bot.access[request.user._id].can_edit) {
      permit = true;
    }

    if (permit) {
      const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
      const Message = botDB.model('Message', MessageSchema);

      let message = new Message(message_params);
      await message.save();

      botDB.close();

      return h.response(message).code(200);
    }
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async get_message(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
    const Message = botDB.model('Message', MessageSchema);

    let message = await Message.findById(request.params.msg_id);
    if (message == null) {
      let result = {msg: 'Message not found'};
      return h.response(result).code(404);
    }

    let permit = false;

    if (message.event_type === 'eval' && bot.access[request.user._id].can_code) {
      permit = true;
    } else if (message.event_type !== 'eval' && bot.access[request.user._id].can_view) {
      permit = true;
    }

    if (permit) {
      botDB.close();
      return h.response(message).code(200);
    }

    botDB.close();
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async delete_message(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
    const Message = botDB.model('Message', MessageSchema);

    let message = await Message.findById(request.params.msg_id);
    if (message == null) {
      let result = {msg: 'Message not found'};
      return h.response(result).code(404);
    }

    let permit = false;

    if (message.event_type === 'eval' && bot.access[request.user._id].can_code) {
      permit = true;
    } else if (message.event_type !== 'eval' && bot.access[request.user._id].can_edit) {
      permit = true;
    }

    if (permit) {
      await message.remove();
      botDB.close();
      return h.response(message).code(200);
    }

    botDB.close();
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }

  async update_message(request, h) {
    const bot = await Bot.findById(request.params.bot_id);

    if (bot == null) {
      let result = {msg: 'Bot not found'};
      return h.response(result).code(404);
    }

    let message_params = request.payload;
    delete message_params._id;

    const botDB = mongoose.createConnection(bot.db_url + bot.db_name);
    const Message = botDB.model('Message', MessageSchema);

    let message = await Message.findById(request.params.msg_id);
    if (message == null) {
      let result = {msg: 'Message not found'};
      return h.response(result).code(404);
    }

    let permit = false;

    if (message.event_type === 'eval' && bot.access[request.user._id].can_code) {
      permit = true;
    } else if (message.event_type !== 'eval' && bot.access[request.user._id].can_edit) {
      permit = true;
    }

    if (permit) {
      await Message.findOneAndUpdate(
        {_id: request.params.msg_id},
        message_params,
        {upsert: true});
      botDB.close();

      message_params._id = request.params.msg_id;
      return h.response(message_params).code(200);
    }

    botDB.close();
    let result = {msg: 'Forbidden'};
    return h.response(result).code(403);
  }
}

module.exports = BotController;
