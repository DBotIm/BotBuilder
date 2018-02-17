'use strict';

const Hapi = require('hapi');
var fs = require('fs')
var Joi = require('joi');

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 3000
});

// Add the route
server.route({
    method: 'GET',
    path:'/hello',
    handler: function (request, h) {
        return 'hello world';
    }
});


var createBot = function (request, h) {
  let configs = request.payload;

  console.log('start reading main.js');
  let rawdata = fs.readFileSync('main.js', 'utf8');
  console.log('finish reading main.js');

  let keys = Object.keys(configs);
  for (let i = 0; i < keys.length; i++) {
    console.log('adding config ' + keys[i]);
    let temp = '@@'+keys[i]+'@@';
    let regex = new RegExp(temp, 'g');
    rawdata = rawdata.replace(regex, "'" + configs[keys[i]] + "'");
  }

  if(fs.existsSync(configs.output)) {
    fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
  } else {
    fs.mkdirSync(configs.output)
    fs.writeFileSync(configs.output + '/' + configs.main, rawdata, 'utf8')
  }

  let result = {status: 'Created', code:201, msg: 'Bot Created'}
  return result;
}

// Add the route
server.route({
    method: 'POST',
    path:'/create',
    config:{
      handler: createBot,
      validate: {
        payload: {
          main: Joi.string().required(),
          bot_token: Joi.string().required(),
          db_url: Joi.string().required(),
          db_name: Joi.string().required(),
          output: Joi.string().required(),
          bot_id: Joi.string().required(),
          mqtt_path: Joi.string().required(),
          extra_codes: Joi.string().required()
        },
        options: {
          allowUnknown: true
        }
      }
    }
});


// Start the server
async function start() {

    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();
