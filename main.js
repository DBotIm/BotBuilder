const TeleBot = require('telebot');
const bot = new TeleBot(@@bot_token@@);

// node eval
const nodeEval = require('node-eval');

// connect to mongodb by mongoose
const mongoose = require('mongoose');
var db_url = @@db_url@@ + @@db_name@@;
mongoose.connect(db_url);

// mqtt
var mqtt = require('mqtt')
var client  = mqtt.connect(@@mqtt_path@@)

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
const User = mongoose.model('User', UserSchema);

const MessageSchema = mongoose.Schema({
  command: String,
  event_type: String,
  replies: Array,
  code: String,
  trigger_state: String,
}, { strict: false });
const Message = mongoose.model('Message', MessageSchema);

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('text', (msg) => {
  const chatId = msg.chat.id;

  update_user(msg);

  console.log(msg);

  if(msg.text.charAt(0) == '/'){
    let b_i = msg.text.indexOf(' ');
    let a_i = msg.text.indexOf('@');
    let delimiter = ' ';

    if(a_i > 0 && a_i < b_i || b_i < 0) {
      delimiter = '@'
    }

    parts = msg.text.split(delimiter);
    console.log(parts)

    if(parts.length > 1) {
      command_core(msg, parts[0], parts.slice(1));
    } else {
      command_core(msg, parts[0]);
    }
  } else {
    state_job(msg, 'text')
  }
});

bot.on('photo', (msg) => {
  update_user(msg);
  state_job(msg, 'photo');
});

bot.on('video', (msg) => {
  update_user(msg);
  state_job(msg, 'video');
});

bot.on('document', (msg) => {
  update_user(msg);
  state_job(msg, 'document');
});

bot.on('audio', (msg) => {
  update_user(msg);
  state_job(msg, 'audio');
});

function state_job(msg, msg_type) {
  User.findOne({_id: msg.from.id}, function(err, user){
      try{
        if(!err) {
          let params = {type: msg_type};
          switch (msg_type) {
            case 'text':
                params.text = msg.text;
              break;
            case 'photo':
                params.photo = msg.photo;
              break;
            case 'video':
                params.video = msg.video;
              break;
            case 'audio':
                params.audio = msg.audio;
              break
            case 'document':
                params.document = msg.document;
              break;
            default:

          }
          if('caption' in msg){
            params.caption = msg.caption;
          }
          console.log(params);
          state_core(msg, user.state, params)
        }
    }catch(e) {

    }
  });
}

function update_user(msg) {
  User.findOne({_id: msg.from.id}, function(err, user){
      try{
        if(!err) {
          if(!user) {
            user = msg.from;
            user._id = user.id;
            user.state = 'new';
            user.role = 'normal';

            delete user.id;
          } else {
            for(var key in msg.from) {
              if(key != 'id'){
                user[key] = msg.from[key];
              }
            }
          }
          if(user.extra == undefined) {
            user.extra = {photos: {}}
          }
          let cur_user = new User(user);
          cur_user.save().then();

          bot.getUserProfilePhotos(user.id).then(function(res) {
            console.log(res);
            if(res.ok) {
              user.extra.photos = res.result;
              for(var i = 0; i < user.extra.photos.photos.length; i++){
                let pic_url = 'https://api.telegram.org/file/bot'
                + @@bot_token@@
                + '/' + user.extra.photos.photos[i][user.extra.photos.photos[i].length - 1].file_path;
                user.extra.photos.photos[i][user.extra.photos.photos[i].length - 1].url = pic_url;
              }
              let cur_user = new User(user);
              cur_user.save().then();
            }

          });
        }
    }catch(e) {
      console.log('Adding person:');
      console.log(e);
    }
  });
}

function command_core(msg, command, params = null) {
  Message.findOne({'command': command}, function(err, result) {
    core(msg, null, command, params, err, result);
  });
}

function state_core(msg, state, params = null) {
  Message.findOne({'trigger_state': state}, function(err, result) {
    core(msg, state, null, params, err, result);
  });
}

function core(msg, state, command = null, params = null, err, result){
  try{
    if(!err) {
      if(result == null) return;

      console.log('params');
      console.log(params);
      console.log();

      command = result.command;
      if(result.event_type == "eval") {
        evalCode(result.code, msg, command, params, state)
      }

      var replies = result.replies;

      console.log(replies)

      if(replies == undefined) return;

      for(var i = 0; i < replies.length; i++) {
        reply = replies[i];
        switch (reply.type) {
          case "message":
            send_text_message(msg, reply)
            break;
          case "photo":
            send_photo_message(msg, reply)
            break;
          case "audio":
            send_audio_message(msg, reply)
            break;
          case "document":
            send_document_message(msg, reply)
            break;
          case "video":
            send_video_message(msg, reply)
            break;
          default:

        }
      }

    }
} catch(e) {
  console.log();
  console.log(e);
}
}


function send_text_message(msg, reply){
  var inline_keyboard = reply.inline_keyboard;
  if(inline_keyboard != null) {
    var keyboard_tmp = [];

    for(var j = 0; j < inline_keyboard.length; j++) {
      var row_tmp = [];

      var row = inline_keyboard[j];
      for(var k = 0; k < row.length; k++) {
        var button = row[k]
        row_tmp.push(bot.inlineButton(button.text, button.action))
      }
      keyboard_tmp.push(row_tmp)
    }

    var replyMarkup = bot.inlineKeyboard(keyboard_tmp)
    bot.sendMessage(msg.from.id, reply.text, {replyMarkup})
  } else {
    bot.sendMessage(msg.from.id, reply.text)
  }
}

function send_photo_message(msg, reply){
  var inline_keyboard = reply.inline_keyboard;
  if(inline_keyboard != null) {
    var keyboard_tmp = [];

    for(var j = 0; j < inline_keyboard.length; j++) {
      var row_tmp = [];

      var row = inline_keyboard[j];
      for(var k = 0; k < row.length; k++) {
        var button = row[k]
        row_tmp.push(bot.inlineButton(button.text, button.action))
      }
      keyboard_tmp.push(row_tmp)
    }

    var replyMarkup = bot.inlineKeyboard(keyboard_tmp)
    var caption = reply.caption
    bot.sendPhoto(msg.from.id, reply.path, {caption: reply.caption, replyMarkup: replyMarkup})
  } else {
    bot.sendPhoto(msg.from.id, reply.path, {caption: reply.caption})
  }
}

function send_audio_message(msg, reply){
  var inline_keyboard = reply.inline_keyboard;
  if(inline_keyboard != null) {
    var keyboard_tmp = [];

    for(var j = 0; j < inline_keyboard.length; j++) {
      var row_tmp = [];

      var row = inline_keyboard[j];
      for(var k = 0; k < row.length; k++) {
        var button = row[k]
        row_tmp.push(bot.inlineButton(button.text, button.action))
      }
      keyboard_tmp.push(row_tmp)
    }

    var replyMarkup = bot.inlineKeyboard(keyboard_tmp)
    var caption = reply.caption
    bot.sendAudio(msg.from.id, reply.path, {caption: reply.caption, replyMarkup: replyMarkup})
  } else {
    bot.sendAudio(msg.from.id, reply.path, {caption: reply.caption})
  }
}

function send_document_message(msg, reply){
  var inline_keyboard = reply.inline_keyboard;
  if(inline_keyboard != null) {
    var keyboard_tmp = [];

    for(var j = 0; j < inline_keyboard.length; j++) {
      var row_tmp = [];

      var row = inline_keyboard[j];
      for(var k = 0; k < row.length; k++) {
        var button = row[k]
        row_tmp.push(bot.inlineButton(button.text, button.action))
      }
      keyboard_tmp.push(row_tmp)
    }

    var replyMarkup = bot.inlineKeyboard(keyboard_tmp)
    var caption = reply.caption
    bot.sendDocument(msg.from.id, reply.path, {caption: reply.caption, replyMarkup: replyMarkup})
  } else {
    bot.sendDocument(msg.from.id, reply.path, {caption: reply.caption})
  }
}

function send_video_message(msg, reply){
  var inline_keyboard = reply.inline_keyboard;
  if(inline_keyboard != null) {
    var keyboard_tmp = [];

    for(var j = 0; j < inline_keyboard.length; j++) {
      var row_tmp = [];

      var row = inline_keyboard[j];
      for(var k = 0; k < row.length; k++) {
        var button = row[k]
        row_tmp.push(bot.inlineButton(button.text, button.action))
      }
      keyboard_tmp.push(row_tmp)
    }

    var replyMarkup = bot.inlineKeyboard(keyboard_tmp)
    var caption = reply.caption
    bot.sendVideo(msg.from.id, reply.path, {caption: reply.caption, replyMarkup: replyMarkup})
  } else {
    bot.sendVideo(msg.from.id, reply.path, {caption: reply.caption})
  }
}

bot.on('callbackQuery', msg => {

  let b_i = msg.data.indexOf(' ');
  let a_i = msg.data.indexOf('@');
  let delimiter = ' ';

  if(a_i > 0 && a_i < b_i || b_i < 0) {
    delimiter = '@'
  }

  parts = msg.data.split(delimiter);
  console.log(parts)

  if(parts.length > 1) {
    command_core(msg, parts[0], parts.slice(1));
  } else {
    command_core(msg, parts[0]);
  }
  // core(msg, msg.data)
})

function evalCode(code, msg = null, command = null, params = null, state = null) {
  const context = {
    mongoose: mongoose,
    bot: bot,
    msg: msg,
    command: command,
    state: state,
    params: params,
    User: User,
    Message: Message,
    client: client
  }

  let run_code = 'try {\n\
                  module.exports = mongoose;\n\
                  module.exports = bot;\n\
                  module.exports = msg;\n\
                  module.exports = command;\n\
                  module.exports = state;\n\
                  module.exports = params;\n\
                  module.exports = User;\n\
                  module.exports = Message;\n\
                  module.exports = client;\n';
  run_code += code;
  run_code += '\n} catch(e) {\nconsole.log(e);\n}'
  console.log(run_code)
  console.log('your code running:');
  console.log('--------------------------------');
  nodeEval(run_code,'' ,context);
  console.log('------------------your code ends');
}

bot.start();

client.on('message', function (topic, message) {
  try{
    console.log('mqtt topic')
    console.log(topic)
    // message is Buffer
    if(topic == 'order') {
      message = JSON.parse(message);
      if(message.bot_id == @@bot_id@@){
        evalCode(message.code);
      }
    } else if(topic == 'SKings_order'){
        evalCode(message.code);
    }
  } catch(e) {
    console.log(e);
  }
})
