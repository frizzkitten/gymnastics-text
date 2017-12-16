
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-nasty-text.json';

var raizelname = 'Raizel Lieberman';
var pickupLocation = 'Hub';
var canDrive = true;
var justRideBack = false;

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Drive API.
  authorize(JSON.parse(content), raizelname, true, false, true, gymnasticsCheckStatus);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, name, sign, cancel, driver, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, name, sign, cancel, driver);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Print the location and time of practice for today
 */
function gymnasticsInfoLogistics(auth) {
	let sheets = google.sheets('v4');
	sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
		range: 'C28:D37'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		let rows = response.values;
		if (rows != undefined) {
      let date = new Date();
      let day = date.getDay();
      if (day == 5 || day == 6) {
        return "There is no practice today.";
      }
      let info = rows[day][1] + ', ' + rows[day+1][1];
      return info;
		}
	});
}

/**
 * Print the names and pickup locations of students in hackathon spreadsheet:
 * https://docs.google.com/spreadsheets/d/1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ/edit#gid=0
 */
function gymnasticsInfoPeople(auth) {
	let sheets = google.sheets('v4');
	sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
		range: 'H9:R40'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
		let rows = response.values;
    let people = [];
		if (rows != undefined) {
			for (let rowNum = 0; rowNum < rows.length; rowNum++) {
				let row = rows[rowNum];
				if (row[0] != '' && row[0] != undefined && row[0] != 'McDonalds' && row[0] != 'New Member (not on list)')
					people.push(row[0]);
				if (row[2] != '' && row[2] != undefined && row[2] != 'Hub' && row[2] != 'New Member (not on list)')
					people.push(row[2]);
				if (row[6] != '' && row[6] != undefined && row[6] != 'Porter' && row[6] != 'New Member (not on list)')
					people.push(row[6]);
				if (row[10] != '' && row[10] != undefined && row[10] != "I'll Be There and can drive if needed"
						&& row[10] != "I'll Be there - No ride needed" && row[10] != 'New Member (not on list)')
					people.push(row[10]);
			}
    }
    return people;
	});
}

/*
 * Sign up on the sheet, right now only can do one slot and one name
 * TODO: come up with algorithm to find where a name should be inserted,
 * TODO: connect with database to get information about people
 * TODO: deal with if people sign up for the same spot at the same time
 */
function gymnasticsSignUp(auth, name, driver) {
	let sheets = google.sheets('v4');
  let a1notation;
  sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
		range: 'H9:R40'
	}, function(err, response) {
		  if (err) {
			  console.log('The API returned an error: ' + err);
			  return;
		  }
      let rows = response.values;
      let a1notation;
      let a1notationA;
      let a1notationB;
      let places;
      if (rows != undefined) {
        //find these values from database?
        if (justRideBack) {
          places = [0,1,2,3,4,5,6,7,8];
          for (let i = 0; i < places.length; i++) {
            if (rows[places[i]][10] == undefined || rows[places[i]][10] == '') {
              a1notationA = 'R' + (9+places[i]) + ':R' + (9+places[i]);
              a1notationB = 'S' + (9+places[i]) + ':S' + (9+places[i]);
              break;
            }
          }
          sheets.spreadsheets.values.update({
            spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
            range: a1notationA, // TODO: Update placeholder value.
            valueInputOption: 'RAW',
            resource: {
              values: [[name]]
            },
            auth: auth
          }, function(err, response) {
      	       if (err) {
      	         console.log('The API returned an error: ' + err);
      		       return;
      		     }
          });
          sheets.spreadsheets.values.update({
            spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
            range: a1notationB, // TODO: Update placeholder value.
            valueInputOption: 'RAW',
            resource: {
              values: [[pickupLocation]]
            },
            auth: auth
          }, function(err, response) {
      	       if (err) {
      	         console.log('The API returned an error: ' + err);
      		       return;
      		     }
          });
          return;
        }
        else if (canDrive) {
          places = [10,11,12,13,14,15,16];
          for (let i = 0; i < places.length; i++) {
            if (rows[places[i]][10] == undefined || rows[places[i]][10] == '') {
              a1notationA = 'R' + (9+places[i]) + ':R' + (9+places[i]);
              a1notationB = 'S' + (9+places[i]) + ':S' + (9+places[i]);
              break;
            }
          }
          sheets.spreadsheets.values.update({
            spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
            range: a1notationA, // TODO: Update placeholder value.
            valueInputOption: 'RAW',
            resource: {
              values: [[name]]
            },
            auth: auth
          }, function(err, response) {
      	       if (err) {
      	         console.log('The API returned an error: ' + err);
      		       return;
      		     }
          });
          sheets.spreadsheets.values.update({
            spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
            range: a1notationB, // TODO: Update placeholder value.
            valueInputOption: 'RAW',
            resource: {
              values: [[pickupLocation]]
            },
            auth: auth
          }, function(err, response) {
      	       if (err) {
      	         console.log('The API returned an error: ' + err);
      		       return;
      		     }
          });
          return;
        }
        else if (noRide) {
          places = [18,19,20,21,22,23,24,25,26];
          for (let i = 0; i < places.length; i++) {
            if (rows[places[i]][10] == undefined || rows[places[i]][10] == '') {
              a1notation = 'R' + (9+places[i]) + ':R' + (9+places[i]);
              break;
            }
          }
        }
        else {
          if (pickupLocation == 'McDonalds') {
            if (driver) {
              places = [0,6,12,18];
            }
            else {
              places = [1,2,3,4,7,8,9,10,13,14,15,16,19,20,21,22];
            }
            for (let i = 0; i < places.length; i++) {
              if (rows[places[i]][0] == undefined || rows[places[i]][0] == '') {
                a1notation = 'H' + (9+places[i]) + ':H' + (9+places[i]);
                break;
              }
            }
          }
          if (pickupLocation == 'Hub') {
            if (driver) {
              places = [0,6,12,18];
            }
            else {
              places = [1,2,3,4,7,8,9,10,13,14,15,16,19,20,21,22];
            }
            for (let i = 0; i < places.length; i++) {
              if (rows[places[i]][2] == undefined || rows[places[i]][2] == '') {
                a1notation = 'J' + (9+places[i]) + ':J' + (9+places[i]);
                break;
              }
            }
          }
          if (pickupLocation == 'Porter') {
            if (driver) {
              places = [0,6,12,18];
            }
            else {
              places = [1,2,3,4,7,8,9,10,13,14,15,16,19,20,21,22];
            }
            for (let i = 0; i < places.length; i++) {
              if (rows[places[i]][6] == undefined || rows[places[i]][6] == '') {
                a1notation = 'N' + (9+places[i]) + ':N' + (9+places[i]);
                break;
              }
            }
          }
      }
      sheets.spreadsheets.values.update({
        spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
        range: a1notation, // TODO: Update placeholder value.
        valueInputOption: 'RAW',
        resource: {
          values: [[name]]
        },
        auth: auth
      }, function(err, response) {
  	       if (err) {
  	         console.log('The API returned an error: ' + err);
  		       return;
  		     }
      });
    }
  });
  //call gymnasticsCheckStatus() to make sure signup worked?
}

function gymnasticsCancel(auth, name) {
	let sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
		range: 'H9:R40'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
    let rows = response.values;
    let a1notation = '';
    let realRowNum = 9;
		if (rows != undefined) {
			for (let rowNum = 0; rowNum < rows.length; rowNum++) {
        let row = rows[rowNum];
        if (row[0] == name) {
          a1notation = 'H' + realRowNum + ':' + 'H' + realRowNum;
          break;
        }
        else if (row[2] == name) {
          a1notation = 'J' + realRowNum + ':' + 'J' + realRowNum;
          break;
        }
        else if (row[6] == name) {
          a1notation = 'N' + realRowNum + ':' + 'N' + realRowNum;
          break;
        }
        else if (row[10] == name) {
          a1notation = 'R' + realRowNum + ':' + 'R' + realRowNum;
          break;
        }
        else {
          realRowNum++;
        }
      }
      sheets.spreadsheets.values.update({
        spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
        range: a1notation,
        valueInputOption: 'RAW',
        resource: {
          values: [['']]
        },
        auth: auth
      }, function(err, response) {
      	if (err) {
      		console.log('The API returned an error: ' + err);
      		return;
      	}
      });
    }
  });
  //call gymnasticsCheckStatus() to make sure cancel worked?
}

function gymnasticsCheckStatus(auth, name, sign, cancel, driver) {
  if (sign == true && cancel == true) {
    return;
  }
  let sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
		range: 'H9:R40'
	}, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
    let rows = response.values;
    let status = false;
		if (rows != undefined) {
			for (let rowNum = 0; rowNum < rows.length; rowNum++) {
        let row = rows[rowNum];
        if (row[0] == name) {
          status = true;
          break;
        }
        else if (row[2] == name) {
          status = true;
          break;
        }
        else if (row[6] == name) {
          status = true;
          break;
        }
        else if (row[10] == name) {
          status = true;
          break;
        }
        else {
        }
      }
    }
    if (status) {
      if (sign) {
        console.log("you are already signed up");
        return "You are already signed up.";
      }
      else if (cancel) {
        console.log("cancelling");
        return gymnasticsCancel(auth, name);
      }
      else {
        console.log("true");
        return true;
      }
    }
    else {
      if (sign) {
        console.log("signing up");
        return gymnasticsSignUp(auth, name, driver);
      }
      else if (cancel) {
        console.log("You are not signed up");
        return "You are not signed up.";
      }
      else {
        console.log(false);
        return false;
      }
    }
  });
}
