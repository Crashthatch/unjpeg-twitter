var algorithmia = require("algorithmia");
var fs = require("fs");
var Twitter = require('twitter');
var AWS = require('aws-sdk');

//Load config secrets etc (for development)
require('dotenv').config();

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var s3bucket = new AWS.S3({params: {Bucket: 'unjpeg'}});

function fixImageAndTweet(imageUrl, replyToTweetId, replyToUsername){
  //Send the image to algorithmia for the artefacts to be removed.
  algorithmia(process.env.ALGORITHMIA_API_KEY).algo("algo://chinery/unjpeg/16b50586fa8c67bc09b5a4d6ae43494cb75a920d")
    .pipe(imageUrl)
    .then(function(response) {
      console.log('algorithmia replied for '+imageUrl+' from '+replyToUsername);
      var data = response.get(); //buffer object.
      //Upload the cleaned image to S3.
      //TODO: Set lifecycle on S3 images to delete images after a week / month.
      var filename = Math.random()+".png";
      var params = {Key: filename, Body: data, ContentType: "image/png", ACL: "public-read"};
      s3bucket.upload(params, function(err, data2) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          //Send reply to the tweeter with a link to the UNJPEG'd image.
          var newTweet = {status: "@"+replyToUsername+" Here's your image, cleaned and UnJPEG'd: https://s3.amazonaws.com/unjpeg/"+filename,
            in_reply_to_status_id: replyToTweetId
          };
          twitterClient.post('statuses/update', newTweet, function(error, tweet, reponse){
            if( error ){
              console.error(error);
            }
            else{
              console.log("Successfully tweeted reply back to "+replyToUsername+" about image "+imageUrl+" (Cleaned url: https://s3.amazonaws.com/unjpeg/"+filename+" )");
            }
          })
        }
      });
    });
  console.log('Sent to algorithmia:'+imageUrl+' from '+replyToUsername);
}

exports.handler = function (request) {
  //Check mentions from twitter.
  var params = {screen_name: 'nodejs', tweet_mode: 'extended'};
  twitterClient.get('statuses/mentions_timeline', params, function(error, tweets, response) {
    if (error) {
      console.error(error);
    }
    else{
      tweets.forEach(function(tweet){
        if( new Date(Date.parse(tweet.created_at)) > new Date(new Date().getTime() - 60*1000) ) //TODO: Test if we already saw this tweet and replied - store seen IDs in DynamoDb.
        {
          if( tweet.quoted_status && tweet.quoted_status.entities.media ){ //Eg. user quoted the tweet that had the jpeggy image. (eg. Retweet, then add a message tagging @unjpeg). Majority use case.
            tweet.quoted_status.entities.media.forEach(function(entity){
              if( entity.type == 'photo' && entity.media_url_https.endsWith('jpg') ){
                fixImageAndTweet(entity.media_url_https, tweet.id_str, tweet.user.screen_name);
              }
            });
          }
          else if( tweet.entities.media ){ //User attached an image to his tweet directly.
            tweet.entities.media.forEach(function(entity){
              if( entity.type == 'photo' && entity.media_url_https.endsWith('jpg') ){
                fixImageAndTweet(entity.media_url_https, tweet.id_str, tweet.user.screen_name);
              }
            });
          }
          else if( tweet.in_reply_to_status_id_str != null ){ // user replied to a tweet with image and tags @unjpeg
            //Must do a second request to get the tweet that was replied to since it's not in the initial /statuses/mentions_timeline
            twitterClient.get('statuses/show', {id: tweet.in_reply_to_status_id_str, tweet_mode: 'extended'}, function(newError, inReplyToTweet, newResponse) {
              if (newError) {
                console.error(newError);
              }
              else{
                if( inReplyToTweet.entities.media ){
                  inReplyToTweet.entities.media.forEach(function(entity){
                    if( entity.type == 'photo' && entity.media_url_https.endsWith('jpg') ){
                      // want to send the entity from inReplyToTweet, but reply to tweet
                      fixImageAndTweet(entity.media_url_https, tweet.id_str, tweet.user.screen_name);
                    }
                  });
                }
              }
            });
          }
          else{
            //A tweet we don't know how to handle (eg. no image, not a reply or quote).
            console.log('got a tweet, but could not handle it. '+tweet);
          }
        }
      })

    }
  });


};

//For testing locally, when running "node app.js" from CLI.
exports.handler();