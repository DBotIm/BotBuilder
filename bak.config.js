module.exports = {
  routes: [
    './controllers/bot_manager',
    './controllers/bot',
  ],

  registrations: ['@bakjs/mongo', '@bakjs/auth', 'inert'],

  mongo: {
    connections: {
      default: {
        uri: 'mongodb://127.0.0.1/sabb'
      }
    }
  },

  auth: {
    secret: 'this is secret'
  }

}
