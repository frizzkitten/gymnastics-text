const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
let bodyParser = require('body-parser');
var mongoose = require('mongoose');
const difflib = require('difflib');
const twilio = require('twilio');
const gDocs = require("./google_docs_api");
const helper = require('./helper');

const app = express();

const dbConnectLink = 'mongodb://' + process.env.DBUSERNAME + ':' + process.env.DBPASSWORD + '@ds133796.mlab.com:33796/gymnasticsdb'
mongoose.connect(dbConnectLink);

var db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

var Users = require('./models/users.js');

const accountSid = process.env.TWILIOSID;
const authToken = process.env.TWILIOAUTHTOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

const HELP_MESSAGE = "Here are some things you can send me:\n\n" +
              "sign up (if you also enter a location after 'sign up' you " +
              "will be signed up for that location instead of your default)\n\n" +
              "drop (to remove your name from the signup sheet)\n\n" +
              "time (where tonight’s practice is, what time)\n\n" +
              "people (who's going tonight)\n\n" +
              "settings (to view and/or change your settings)\n\n" +
              "help me (in case you forget the commands you can use in the future)";


app.use(bodyParser.urlencoded());
app.post('/sms', function(request, response) {
  const inMessage = request.body.Body;
  let outMessage = "";
  let twiml = new twilio.twiml.MessagingResponse();
  const number = request.body.From;
  const query = { number: number };
  const options = { new: false }

  newbCheck = checkIfNewbie(inMessage, number, function(isNewb, msg, user) {
      if (isNewb) {
        outMessage = msg;
      }

      // if user is in the process of changing settings, change them
      else if (user.changingSettings) {
          outMessage = changeSettings(user, inMessage, query, options);
      }

      // this means the person has an account and is not changing settings
      else {
        // parse to figure out which command the person wants to perform
        let choice = helper.parseMessage(inMessage, false);

        switch (choice) {
          case "signUp":

            gDocs.signUp(user, function(msg) {
              console.log(msg);
              twiml.message(msg);
              response.writeHead(200, {'Content-Type': 'text/xml'});
              response.end(twiml.toString());
            });
            return;
            break;
          case "info":

            gDocs.infoLogistics(function(msg) {
              twiml.message(msg);
              response.writeHead(200, {'Content-Type': 'text/xml'});
              response.end(twiml.toString());
            });

            //outMessage = "Practice tonight is at [LOCATION] from [TIME] " +
            //    "until [TIME]. Pickup is at [TIME] from " + user.pickupLocation +
            return;
            break;
          case "people":

            gDocs.infoPeople(function(msg) {
              twiml.message(msg);
              response.writeHead(200, {'Content-Type': 'text/xml'});
              response.end(twiml.toString());
            });

            return;
            break;
          case "cancel":

            // TODO if past the cancel time, tell them they have to text Morgan
            // if (PAST CANCEL TIME){
            //     outMessage = ""
            // }

            gDocs.cancel(user, function(msg) {
              twiml.message(msg);
              response.writeHead(200, {'Content-Type': 'text/xml'});
              response.end(twiml.toString());
            });

            return;
            break;
          case "settings":
            outMessage = "Would you like to change your name or default pickup location?";
            const update = { changingSettings: true };
            Users.findOneAndUpdate(query, update, options, function (err, user) {
                if (err) { console.log(err); }
            });
            break;
          default:
            outMessage = HELP_MESSAGE;
        }
      }

      twiml.message(outMessage);
      response.writeHead(200, {'Content-Type': 'text/xml'});
      response.end(twiml.toString());
  });
});

app.use(express.static('public'))
app.use(bodyParser.json())
function createUser(number, name, location) {
  store
    .createUser({
      number: number,
      name: name,
      location: location
    });
};

function checkIfNewbie(inText, number, callback) {
  let outMessage = "";
  let newbie = true;
  const query = {number: number};

  Users.findOne(query, function(err, user) {
      // if user has never texted the service before
      if (user === null) {
        outMessage = "Welcome to NastyText! Texting this number will sign you up for practice. What is your first and last name as shown on the signup spreadsheet?";
        // make database with the phone number as the key
        Users.create({
            number:number
        });
      }
      // add name to user if this is the second time ever texting
      else if (!user.name) {
        let name = inText;
        //TODO DB with this phone # is given name as a name
        outMessage = "Got it, thanks " + name + ". Do you want to default to being a driver?"
        const update = { '$set': { name: name, } };
        const options = { new: false };

        Users.findOneAndUpdate(query, update, options, function (err, user) {
            if (err) { console.log(err); }
            else { console.log("added name ", user.name, " to user")};
        });
      }

      // set user's driving status
      else if (user.isDriver == undefined) {
        // user said they want to default to being a driver
        let driver = false;
        outMessage = "Got it, you are not a driver. Where would you like to be picked up? (Hub, McDonalds, Porter Boathouse)"
        if (inText.toLowerCase().indexOf('y') > -1) {
          driver = true;
          outMessage = "You will be marked as a driver when you sign up. Where will you pick people up? (Hub, McDonalds, Porter Boathouse)";
        }
        const update = { '$set': { isDriver: driver } };
        const options = { new: false };
        Users.findOneAndUpdate(query, update, options, function (err, user) {
            if (err) { console.log(err); }
            else { console.log("set driving to ", driver)};
        });
      }

      // set user's pickup location if none exists
      else if (!user.pickupLocation) {
        // format location to be either McDonalds, Hub, or Porter Boathouse,
        // or return that you want one of those as a response if not close
        let location = helper.parseMessage(inText, "getLocation");
        if (!location) {
            outMessage = "Sorry, I couldn't understand that. Would you like to be picked up at the Hub, McDonalds, or Porter Boathouse."
            callback(newbie, outMessage, user);
        }

        // DB with this # is given formatted location as default location
        const update = { '$set': { pickupLocation: location } };
        const options = { new: false };
        Users.findOneAndUpdate(query, update, options, function (err, user) {
            if (err) { console.log(err); }
            else { console.log("added location ", user.pickupLocation, " to user ", user.name)};
        });

        outMessage = "Great, your default pickup location will be " + location +
                      ". You are not yet signed up for practice. " + HELP_MESSAGE;
      }

      else {
        newbie = false;
      }
      callback(newbie, outMessage, user);
  })
}

// either set the setting to change or change the actual setting, then return
// an outMessage
function changeSettings(user, inMessage, query, options) {
    if (user.settingToChange) {
        let updated = { settingToChange: undefined, changingSettings: undefined }
        if (user.settingToChange == "name") {
            updated.name = inMessage;
            outMessage = "Your name has been changed name to " + inMessage;
        } else if (user.settingToChange == "default pickup location") {
            let location = helper.parseMessage(inMessage, "getLocation");
            if (!location) {
                outMessage = "Sorry, that isn't a location I recognize. Not changing settings.";
            } else {
                updated.pickupLocation = location;
                outMessage = "Your default pickup location is now " + location + ".";
            }
        }

        const update = {'$set': updated};
        Users.findOneAndUpdate(query, update, options, function (err, user) {
            if (err) { console.log(err); }
        });
    }

    // user is entering which setting they want to change
    else {
        let settingToChange = helper.parseMessage(inMessage, "settingToChange");
        // user didn't enter 'name' or 'default pickup location', exit settings mode
        if (!settingToChange) {
            outMessage = "I didn't understand that, sorry! Not changing any settings.";
            const update = {'$set': { changingSettings:false } };
            Users.findOneAndUpdate(query, update, options, function (err, user) {
                if (err) { console.log(err); }
            });
        }
        // user correctly entered setting to change, tell DB we will change that setting
        else {
            //const locations = ""
            outMessage = "What would you like to change your " + settingToChange + " to?";
            if (settingToChange == "default pickup location") {
                outMessage = outMessage + " (Hub, McDonald's, or Porter Boathouse)"
            }
            const update = { settingToChange: settingToChange };
            Users.findOneAndUpdate(query, update, options, function (err, user) {
                if (err) { console.log(err); }
            });
        }
    }

    return outMessage;
}


http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});