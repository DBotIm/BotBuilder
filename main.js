const TeleBot = require('telebot');
const bot = new TeleBot('493487795:AAF656HZVxMLepE3Te3gAyGdiCzQ3PwqHv4');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/pozhi_shop";

var nodeEval = require('node-eval')

bot.on('/start', msg => {
  return do_command(msg, 'start');
})

bot.on('/exit', msg => {
  return do_command(msg, 'exit');
})

bot.on(/^\/exchange (.+)$/, (msg, props) => {
  console.log(props);
  var amount = props.match[1];
  amount = parseFloat(amount)
  if(isNaN(amount)){
    bot.sendMessage(msg.from.id, 'جلوی /exchange میزان لیر را وارد کنید', { replyToMessage: msg.message_id });
  }else{
    return do_command(msg, 'exchange', amount)
  }
  return;
});

function do_command(msg, command, params = null){
  try{
    console.log(command)
    switch (command) {
      case 'start':
        start(msg);
        break;
      case 'exit':
        exit(msg);
        break;
      default:
        core(msg, command , params)
    }
  }catch(e){
    console.log(e)
  }
}

function get_vars() {
  return evalVars;
}

function core(msg, command, params = null) {
  MongoClient.connect(url, function(err, db) {
    try{
      if (err) throw err;
      db.collection('messages').findOne({'command': command}, function(err, result) {
        try{
          if (err) throw err;

          console.log(result)

          if(result == null) return;

          if(result.event_type == "eval") {

            this.bot = bot;
            this.MongoClient = MongoClient;
            this.url = url;

            this.msg = msg;
            this.command = command;
            this.params = params;

            nodeEval(result.code)
          }

          var replies = result.replies;

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

          db.close();
        }catch(e){
          console.log(e)
        }
      });
    }catch(e){
      console.log(e)
    }
  });
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
  do_command(msg, msg.data)
})

function exchange(msg, amount){
  var tooman = amount * 1500;
  bot.sendMessage(msg.from.id, 'تبدیل لیر به تومان :' + ' ' + tooman, { replyToMessage: msg.message_id });
}

function exit(msg){
  MongoClient.connect(url, function(err, db) {
    try{
      if (err) throw err;
      db.collection('customers').findOne({'_id': msg.from.id}, function(err, user) {
        try{
          if (err) throw err;
          if (user != null){
            change_news_status(user, false)
          }
          console.log(user);
          db.close();
        }catch(e){
          console.log(e)
        }
      });
    }catch(e){
      console.log(e)
    }
  });
}

function start(msg){
  MongoClient.connect(url, function(err, db) {
    try{
      if (err){
        console.log(error)
        return
      }
      db.collection('customers').findOne({'_id': msg.from.id}, function(err, user) {
        try{
          if (err){
            console.log(error)
            return;
          }
          if (user != null){
            change_news_status(user, true)
          }else{
            make_user(msg.from)
          }
          console.log(user);
          db.close();
        }catch(e){
          console.log(e)
        }
      });
    }catch(e){
      console.log(e)
    }
  });
}

function make_user(user){
  MongoClient.connect(url, function(err, db) {
    try{
      if (err){
        console.log(error)
        return;
      }
      user.get_news = true;
      user._id = user.id;
      user.role = 'user'
      db.collection('customers').insertOne(user, function(err, result) {
        if (err){
          console.log(error)
          return;
        }
        let replyMarkup = bot.inlineKeyboard([
         [
           bot.inlineButton('راهنمای خرید', {callback: 'buying_help'}),
           bot.inlineButton('لیست سایت ها', {callback: 'sites_list'}),
         ],[
           bot.inlineButton('شروع', {callback: 'start'}),
           bot.inlineButton('خروج از بات', {callback: 'exit'}),
         ], [
           bot.inlineButton('ارتباط با ما', {callback: 'contact_us'})
         ]
         ]);
        let ret_val = 'دوست عزیز ما ' + user.first_name + ' خوش آمدید'
        bot.sendMessage(user.id, ret_val, {replyMarkup})
      });
    }catch(e){
      console.log(e)
    }
  });
}
function change_news_status(user, status){
  MongoClient.connect(url, function(err, db) {
    try{
      if (err){
        console.log(error)
        return;
      }

      var ret_val = '';
      if(status){
        if(user.get_news){
          ret_val = 'شما قبلا در بات عضو شده اید'
        }else{
          ret_val = 'عضویت شما دوباره فعال شد. برای لغو عضویت /exit را وارد نمایید'
        }
      }else{
        ret_val = 'عضویت شما در بات لغو شد. برای فعال سازی عضویت /start را وارد نمایید'
      }
      user.get_news = status;
      user._id = user.id;

      db.collection('customers').updateOne({'_id': user._id}, user, function(err, result) {
        if (err){
          console.log(error)
          return;
        }
        let replyMarkup = bot.inlineKeyboard([
         [
           bot.inlineButton('راهنمای خرید', {callback: 'buying_help'}),
           bot.inlineButton('لیست سایت ها', {callback: 'sites_list'}),
         ],[
           bot.inlineButton('شروع', {callback: 'start'}),
           bot.inlineButton('خروج از بات', {callback: 'exit'}),
         ], [
           bot.inlineButton('ارتباط با ما', {callback: 'contact_us'})
         ]
         ]);


        bot.sendMessage(user.id, ret_val, {replyMarkup})
      });
    }catch(e){
      console.log(e)
    }
  });
}
bot.start();
