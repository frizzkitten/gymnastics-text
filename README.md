# gymnastics-text

An easy way for UW gymnasts to sign up for the carpools for practice via text! The club usually signs up using [this spreadsheet](https://docs.google.com/spreadsheets/u/2/d/1niCVuzqPHgCGvwGQxsMrPzF_uEfAtNdcbe92oswm920/edit?usp=sharing), but sign up is much easier if you can just text in to say you're going that day. Works by interacting with the spreadsheet, which can also be used to sign up, so the two will always be in sync.

## Getting Started

You will need to do a few things in order to get this project running.

### To Run Locally

#### 1. Get mlab.com credentials

The database used for the users is stored by mlab.com. There is a main account (madisonGymnastics). Get an admin to create a user account for you by having them go to mlab.com, selecting "Users" (next to "Collections") and clicking "Add database user."

#### 2. Get Twilio info

Two options here. 
1. Get the password, account SID, and auth token for the main number, using ameyer24@wisc.edu's account (contact Austin Meyer about that)
2. Make your own Twilio account. Buy a phone number through Twilio.

### Prerequisites

Clone this repository.
Create a file called credentials.js which looks like this:

```
module.exports = {
    dbUsername: "YOUR MLAB USERNAME",
    dbPassword: "YOUR MLAB PASSWORD",
    twilioSID: "YOUR TWILIO SID",
    twilioAuthToken: "YOUR TWILIO AUTH TOKEN"
}

```
### Run Script
```
kevin@kevinlaptop:~/work/gymnastics-text$ ./run-local.sh -h
Running GymnasticsText + Ngrok
_______________________________
run-local.sh [-h] [-b]
-h, for help message
-b, add build argument to docker-compose
```
Script starts node app and then brings up ngrok as well, to 
make setup  as simple as `./run-local.sh`.  Script checks (in order)
if docker-compose, docker, or neither are installed and 
runs the appropriate command.  
For ngrok, it checks first in your path then the local directory.  
If docker-compose is installed, you can skip the image building stage
of the installation instructions by passing the `-b` flag.

### Docker usage (installation alternative)
The Dockerfile handles npm setup work inside the image, 
and building requires running:
```
docker build -t gymnasticstext_node-app .
```
so the only thing left to do is start up the container with 
the current directory as a volume and run npm start.  

To do so interactively, run:
```
docker run --rm -it -v "$(pwd)":/app -p 1337:1337 gymnasticstext_node-app /bin/bash
root@8f537bea9e65:/app# npm start
```
Otherwise the run-local script will start it as a daemon.  

### Installing

Install all dependencies from package.json:

```
npm install
```

Install and run ngrok

```
npm install -g ngrok
ngrok http 1337
```

Once ngrok is running you will see two lines that start with "Forwarding".

Take the https://#########.ngrok.io from the second one and append /sms

Go to your Twilio account, find the number you will be using, click on it. Scroll down until you see "Messaging."

In the box next to "A message comes in" paste your version of https://#########.ngrok.io/sms

Ensure that to the left it says Webhook and to the right it says HTTP POST.

Run npm start and you're done!

## Testing
Currently tests on the app are run from a Python script in `tests/`.
see the `README` in the directory for details.

## Deployment

Haven't deployed yet, still have to run on our own machines.

## Authors

* **Austin Meyer** - *All the phone stuff* - [frizzkitten](https://github.com/frizzkitten)
* **Raizel Lieberman** - *All the spreadsheet stuff* - [rlieberman2](https://github.com/rlieberman2)
* **Kevin Quinn** - *Mentor and inspiration to us all* - [i-dont-remember](https://github.com/i-dont-remember)

See also the list of [contributors](https://github.com/frizzkitten/gymnastics-text/contributors) who participated in this project.

## Acknowledgments

* Thank you to the forward-thinking leadership of the Wisconsin Gymnastics Club for allowing us to try this out.
