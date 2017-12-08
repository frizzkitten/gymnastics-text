var mongoose = require('mongoose');
var credentials = require('./credentials')

const dbConnectLink = 'mongodb://' + credentials.dbUsername + ':' + credentials.dbPassword + '@ds125146.mlab.com:25146/testmoonshot'
mongoose.connect(dbConnectLink);

mongodb://<dbuser>:<dbpassword>@ds133796.mlab.com:33796/gymnasticsdb

var db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

var Users = require('./models/users.js');
