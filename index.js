const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
let bodyParser = require('body-parser');
var mongoose = require('mongoose');
const credentials = require('./credentials');
const difflib = require('difflib');
const twilio = require('twilio');
const gDocs = require("./google_docs_api");

const app = express();

const dbConnectLink = 'mongodb://' + credentials.dbUsername + ':' + credentials.dbPassword + '@ds133796.mlab.com:33796/gymnasticsdb'
mongoose.connect(dbConnectLink);

var db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

var Users = require('./models/users.js');

const accountSid = credentials.twilioSID;
const authToken = credentials.twilioAuthToken;
const twilioClient = require('twilio')(accountSid, authToken);

const HELP_MESSAGE = "Here are some things you can send me:\n\n" +
              "sign up (if you also enter a location after 'sign up' you " +
              "will be signed up for that location instead of your default)\n\n" +
              "cancel (to remove your name from the signup sheet)\n\n" +
              "info (where tonight’s practice is, what time\n\n" +
              "people (who's going tonight)\n\n" +
              "settings (to view and/or change your settings)\n\n" +
              "help me (in case you forget the commands you can use in the future)";

app.use(bodyParser.urlencoded());
app.post('/sms', function(request, response) {
  const inMessage = request.body.Body;
  let outMessage = "";
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
        let choice = parseMessage(inMessage, false);

        switch (choice) {
          case "signUp":

            console.log("message from gDocs ", gDocs.signUp(user));

            outMessage = "You are [not actually] signed up for practice. Pickup is at " +
                "[TIME] from " + user.pickupLocation;

            break;
          case "info":

            outMessage = gDocs.infoLogistics();

            //outMessage = "Practice tonight is at [LOCATION] from [TIME] " +
            //    "until [TIME]. Pickup is at [TIME] from " + user.pickupLocation +
            break;
          case "people":

            outMessage = gDocs.infoPeople();

            break;
          case "cancel":

            // TODO if past the cancel time, tell them they have to text Morgan
            // if (PAST CANCEL TIME){
            //     outMessage = ""
            // }

            outMessage = gDocs.cancel(user);
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

      let twiml = new twilio.twiml.MessagingResponse();
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


function parseMessage(message, type) {
  let WORD_CLOSENESS = .6;
  let MAX_MATCHES = 1;

  choices = [];

  let words = message.split(" ");
  if (type == "getLocation") {
      choices = [
          {"choice": "Hub", "words": ["Hub"]},
          {"choice": "McDonalds", "words": ["McDonalds", "mickey"]},
          {"choice": "Porter Boathouse", "words": ["Porter", "Boathouse", "lakeshore", "boat", "house"]}
      ];
  } else if (type == "settingToChange") {
      choices = [
          {"choice": "name", "words": ["name"]},
          {"choice": "default pickup location", "words": ["default", "pickup", "location", "spot"]}
      ]
  }
  else {
      choices =[
        {"choice": "signUp", "words": ['sign', 'register', 'signup']},
        {"choice": "info", "words": ['info', 'tonight', 'where', 'when', 'time']},
        {"choice": "people", "words": ['whos', 'going', 'who', 'people']}
        {"choice": "cancel", "words": ['cancel']},
        {"choice": "settings", "words": ['settings', 'preferences']}
    ];
  }

  for (let choiceIndex = 0; choiceIndex < choices.length; choiceIndex++) {
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      //if any word in the message is close to one of the wanted words
      if (difflib.getCloseMatches(words[wordIndex], choices[choiceIndex].words, MAX_MATCHES, WORD_CLOSENESS).length > 0) {
        return choices[choiceIndex].choice;
      }
    }
  }

  if (type == "getLocation") {
      return undefined;
  } else if (type == "settingToChange") {
      return undefined;
  } else {
      return "help";
  }
}


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
        outMessage = "Got it, thanks " + name + ".  In the future, where would you like to be picked up? (Hub, McDonalds, Porter Boathouse)"
        const update = { '$set': { name: name, } };
        const options = { new: false };

        Users.findOneAndUpdate(query, update, options, function (err, user) {
            if (err) { console.log(err); }
            else { console.log("added name ", user.name, " to user")};
        });
      }
      // set user's pickup location if none exists
      else if (!user.pickupLocation) {
        // format location to be either McDonalds, Hub, or Porter Boathouse,
        // or return that you want one of those as a response if not close
        let location = parseMessage(inText, "getLocation");
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
      } else {
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
            let location = parseMessage(inMessage, "getLocation");
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
        let settingToChange = parseMessage(inMessage, "settingToChange");
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
