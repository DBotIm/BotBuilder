module.exports = {
  routes: [
    './controllers/bot_manage'
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
