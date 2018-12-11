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
  function (err, users) {
    let n = 0;
    for (let i in users) {
      axios.get(`https://gender-api.com/get?name=${encodeURI(users[i].first_name)}&key=${config.gender.apiKey}`)
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