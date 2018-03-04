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
}, { strict: false });


const MessageSchema = mongoose.Schema({
  command: String,
  event_type: String,
  replies: Array,
  code: String,
  trigger_state: String,
}, { strict: false });

class BotController extends Controller {
  init() {
    this.defaults = {
      auth: {
        mode: 'required'
      }
    };
    
    this.post('/get/users/{bot_id}', this.users);

  }
  async users() {

  }
}

module.exports = BotController;
