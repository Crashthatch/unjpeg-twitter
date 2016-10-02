#UnJPEG Twitter

This is the code for the @unjpeg twitter bot. If you tweet @unjpeg with the URL to an screenshot, or quoting another tweet which contained a screenshot, @unjpeg will tweet back at you with a version of the screenshot where the JPEG artefacts have been removed.
 
Unjpeg twitter bot uses the [UnJPEG Theano neural network](https://github.com/chinery/UnJPEG) created by [@andrewchinery](https://twitter.com/andrewchinery), and hosted on [Algorithmia](https://algorithmia.com/).
  
#Installation
Requirements: node.js (tested with v4.5.0)

Clone this repo & install dependencies:

    git clone git@github.com:Crashthatch/unjpeg-twitter.git

    npm install

Create a Twitter App at https://apps.twitter.com & generate a API Token at: https://apps.twitter.com/app/12916016/keys

Sign up for an algorithmia account and get an API Key.

Put these in a .env file in the root of this repository:

    TWITTER_CONSUMER_KEY=
    TWITTER_CONSUMER_SECRET=
    TWITTER_ACCESS_TOKEN=
    TWITTER_ACCESS_TOKEN_SECRET=
    ALGORITHMIA_API_KEY=

To run locally:

    node app.js
     
To run on AWS Lambda: 

    claudia create --region us-east-1 --handler app.handler --timeout 120 
    
    claudia add-scheduled-event --rate "1 minute" --event empty.json --name "RunEveryMinute"