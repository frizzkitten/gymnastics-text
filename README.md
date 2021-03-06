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

#### 3. Setup to Run
The developer can use a normal Javascript development workflow using `npm start` or if they have the `nanobox` cli installed they can use the powerful tools in that for local development, dry-runs, and easy deployment.

### Prerequisites
Clone this repository.
There are several environment variables necessary for sensitive information:

```
    DBUSERNAME=YOUR_MLAB_USERNAME
    DBPASSWORD=YOUR_MLAB_PASSWORD
    TWILIOSID=YOUR TWILIO_SID
    TWILIOAUTHTOKEN=YOUR_TWILIO_AUTH_TOKEN

```
You will also need the `client-secret.json` file provided for use with Google Sheets.  On the first access of the Sheet, Google has to ask
for the user to create a token through their browser and insert it into the command line where the server was started.  When deploying the 
app that input option is inaccessible, so we have converted the script to allow the file to be generated locally and deployed with the 
rest of the code.  How to:
  1. Run the server with `npm start`
  2. Use Postman, Curl, or any other tool to send a legitimate request to the application (Making the body to be "people" will work)
  3. Follow the given url and paste the code into the waiting application
  4. You should now have a generated `.credentials/` folder in your app directory

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
The first deployment of the app uses Nanobox with Digital Ocean as the VPS provider https://nanobox.io/.  
To use Nanobox, you must first follow their installation instructions for their CLI tool and create an account.  
You must also have an account with one of the many VPS providers like Digital Ocean, AWS, Azure, etc.  
Then for developing & setting up the app, follow the Express app documentation on their website, and env variables will have to be added using the nanobox tool.  
The only thing I found to be not necessary (which is probably from our lack of experience) is the step about `bin/www`, didn't end up knowing how to use it and wasn't needed.  
For deployment, follow the instructions given in your Nanobox dashboard.

## Authors

* **Austin Meyer** - *All the phone stuff* - [frizzkitten](https://github.com/frizzkitten)
* **Raizel Lieberman** - *All the spreadsheet stuff* - [rlieberman2](https://github.com/rlieberman2)
* **Kevin Quinn** - *Mentor and inspiration to us all* - [i-dont-remember](https://github.com/i-dont-remember)

See also the list of [contributors](https://github.com/frizzkitten/gymnastics-text/contributors) who participated in this project.

## Acknowledgments

* Thank you to the forward-thinking leadership of the Wisconsin Gymnastics Club for allowing us to try this out.
