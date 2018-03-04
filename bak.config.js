module.exports = {
  routes: [
    './controllers/bot_manager',
    './controllers/bot'
  ],

  registrations: ['@bakjs/mongo', '@bakjs/auth'],

  mongo: {
    connections: {
      default: {
        uri: 'mongodb://localhost/sabb'
      }
    }
  },

  auth: {
    secret: 'this is secret'
  }

}
