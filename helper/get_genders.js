const mongoose = require('mongoose');
const axios = require('axios');
const config = require('../config');

let dbName = config.db;
let db_url = 'mongodb://localhost/' + dbName;
mongoose.connect(db_url);
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

const User = mongoose.model('User', UserSchema);

User.find(
  {
    "first_name": {"$exists": true},
    "extra.gender": {"$exists": false}
  },
  async function (err, users) {
    let n = 0;
    for (let i in users) {
      await sleep(100);
      let urlName = encodeURI(removeEmoji(users[i].first_name))
      axios.get(`https://gender-api.com/get?name=${urlName}&key=${config.gender.apiKey}`)
        .then(function(response){
          User.findOne({'_id': users[i]._id}, function (err, data) {
            if('extra' in data) {
              data.extra['gender'] = response.data;
            } else {
              data.extra = {'gender': response.data}
            }
            console.log(`${data._id} with name ${data.first_name} updated by gender ${response.data.gender} and accuracy ${response.data.accuracy}`);
            let cur_user = new User(data);
            cur_user.save().then(() => {
              n++;
              if(users.length === n) {
                mongoose.disconnect();
              }
            });
          });
        });

    }
  }
).then((users) => {
    if(users.length === 0)
      mongoose.disconnect();
  }
);

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}

function removeEmoji(name) {
  return name.replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, '')
}