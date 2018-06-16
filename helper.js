const difflib = require('difflib');

exports.parseMessage = function parseMessage(message, type) {
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
          {"choice": "people", "words": ['whos', 'going', 'who', 'people']},
          {"choice": "cancel", "words": ['cancel', 'drop']},
          {"choice": "settings", "words": ['settings', 'preferences']}
      ];
    }
  
    for (let choiceIndex = 0; choiceIndex < choices.length; choiceIndex++) {
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        //if any word in the message is close to one of the wanted words
        if (difflib.getCloseMatches(words[wordIndex], choices[choiceIndex].words, MAX_MATCHES, WORD_CLOSENESS).length > 0) {
          console.log("choice is " + choices[choiceIndex].choice)
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