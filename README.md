#UnJPEG Twitter

This is the code for the @unjpeg twitter bot. If you tweet @unjpeg with the URL to an screenshot, or quoting another tweet which contained a screenshot, @unjpeg will tweet back at you with a version of the screenshot where the JPEG artefacts have been removed.
 
Unjpeg twitter bot uses the [UnJPEG Theano neural network](https://github.com/chinery/UnJPEG) created by [@andrewchinery](https://twitter.com/andrewchinery), and hosted on [Algorithmia](https://algorithmia.com/).
  
#Installation
Create a Twitter App at https://apps.twitter.com & generate a API Token at: https://apps.twitter.com/app/12916016/keys
Put these in a .env file in the root of this repository.

To run locally:

    node app.js
     
To run on AWS Lambda: 

    claudia create --region us-east-1 --handler app.handler --timeout 120