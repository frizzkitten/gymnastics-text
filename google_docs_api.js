
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

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Drive API.
  authorize(JSON.parse(content), gymnasticsCancel);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
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
      callback(oauth2Client);
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
      //print info for just today
      let date = new Date();
      let day = date.getDay();
      console.log('%s, %s', rows[day][1], rows[day+1][1])

      //print info for every day of the week
      /*
      let rowNum = 0;
			while (rowNum < rows.length)
			{
				console.log('%s: %s, %s', rows[rowNum][0], rows[rowNum][1], rows[rowNum+1][1]);
				rowNum += 2;
			}
      */
		}
	});
	return true;
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
		if (rows != undefined) {
			for (let rowNum = 0; rowNum < rows.length; rowNum++) {
				let row = rows[rowNum];
				if (row[0] != '' && row[0] != undefined && row[0] != 'McDonalds' && row[0] != 'New Member (not on list)')
					console.log('%s', row[0]);
				if (row[2] != '' && row[2] != undefined && row[2] != 'Hub' && row[2] != 'New Member (not on list)')
					console.log('%s', row[2]);
				if (row[6] != '' && row[6] != undefined && row[6] != 'Porter' && row[6] != 'New Member (not on list)')
					console.log('%s', row[6]);
				if (row[10] != '' && row[10] != undefined && row[10] != "I'll Be There and can drive if needed"
						&& row[10] != "I'll Be there - No ride needed" && row[10] != 'New Member (not on list)')
					console.log('%s', row[10]);
			}
    }
	});
}

/*
 * Sign up on the sheet, right now only can do one slot and one name
 * TODO: come up with algorithm to find where a name should be inserted,
 * TODO: connect with database to get information about people
 * TODO: deal with if people sign up for the same spot at the same time
 */
function gymnasticsSignUp(auth) {
	let sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
    range: 'J21:J21', // TODO: Update placeholder value.
    valueInputOption: 'RAW',
    resource: {
      values: [[raizelname]]
    },
    auth: auth
  }, function(err, response) {
		if (err) {
			console.log('The API returned an error: ' + err);
			return;
		}
  });
}

function gymnasticsCancel(auth) {
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
        if (row[0] == raizelname) {
          a1notation = 'H' + realRowNum + ':' + 'H' + realRowNum;
          break;
        }
        else if (row[2] == raizelname) {
          a1notation = 'J' + realRowNum + ':' + 'J' + realRowNum;
          break;
        }
        else if (row[6] == raizelname) {
          a1notation = 'N' + realRowNum + ':' + 'N' + realRowNum;
          break;
        }
        else if (row[10] == raizelname) {
          a1notation = 'R' + realRowNum + ':' + 'R' + realRowNum;
          break;
        }
        else {
          realRowNum++;
        }
      }
      sheets.spreadsheets.values.update({
        spreadsheetId: '1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ',
        range: a1notation, // TODO: Update placeholder value.
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
}
