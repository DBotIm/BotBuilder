module.exports = {
  routes: [
    './controllers/api'
  ],

  registrations: ['@bakjs/mongo'/*, '@bakjs/auth'*/],

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
