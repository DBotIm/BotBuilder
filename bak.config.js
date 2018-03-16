module.exports = {
  routes: [
    './controllers/bot_manager',
    './controllers/bot',
    './controllers/ui'
  ],

  registrations: ['@bakjs/mongo', '@bakjs/auth', 'inert'],

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
