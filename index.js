var mysql = require('mysql');
var util = require('util');
var Q = require("q");
var MarkovChain = require('markovchain').MarkovChain;
var request = require('request');
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;
var Twitter = require('twitter');
var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var wordlist = "";
var captionsList = [];

//var connection = mysql.createConnection({
//  host     : process.env.CLEARDB_DATABASE_URL,
//  user     : process.env.DB_USER,
//  password : process.env.DB_PASS,
//  database : 'jokes'
//});
var connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL);
//var connection = mysql.createConnection(CLEARDB_DATABASE_URL);
connection.connect();

connection.query("SELECT caption FROM comics WHERE caption not like '%No Data%' ORDER BY RAND() LIMIT 50", function(err, rows, fields) {
  if (err) throw err;
  console.log(rows);
  for (var i=0; i<rows.length; i++) {
    var str = rows[i].caption + "\n";
    //console.log(str);
    writeFile(str);
    //console.log(rows[i].caption);
    captionsList.push(rows[i].caption);
    //console.log(captionsList);
    // Iterates over numeric indexes from 0 to 5, as everyone expects.
  }
  captionsList = captionsList.join().replace("”", "").split(",");
  //console.log(captionsList);
  quotes = new MarkovChain({ files: 'input.txt' });
  quotes
  .start(useUpperCase) //
  .end()
  .process(function(err, s) {
    s = capitalizeFirstLetter(s);
    postToTwitter(s);
  });
  //captionsList = captionsList.replace('"', " ");
});

function postToTwitter(string) {
  console.log(string);
  string = string.replace("”","");
  randomImage()
  .then(function (imageLocation) {
    //var image = fs.readFileSync("tmp/comic000007.jpg", {encoding: 'base64'});
    imageLocation = imageLocation.split('\n')[0];
    twitterClient.post('media/upload', {media_data: fs.readFileSync(imageLocation, { encoding: 'base64' })}, function(err, media, response){
      if (err) console.log('media ' + err);
      //console.log(response);
      //console.log(media);
      twitterClient.post('statuses/update', {status: string, media_ids: media.media_id_string}, function(err, params, res) {
        if (err) console.log('status' + err);
        process.exit();
        //console.log(res);
      });
    });
  });
}

function randomImage() {
  return Q.Promise(function(resolve) {
    rowNumber()
    .then(function (length) {
      //console.log(length);
      //console.log(Math.floor(Math.random() * length) + 1);
      connection.query("SELECT photo_url, joke_id from comics where joke_id = " + (Math.floor(Math.random() * length) + 1), function(err, rows, fields) {
        //console.log(rows[0]);
        downloadImage(rows[0])
        .then(function (imageFile) {
          //console.log(imageFile);
          resolve(imageFile);
        });
      });
    });
  });
}

var fs = require('fs'),
    request = require('request');

function rowNumber() {
  return Q.Promise(function(resolve) {
    connection.query("SELECT count(*) as length FROM comics", function(err, rows, fields) {
      resolve(rows[0].length);
    });
  });
}

function downloadImage(imageData) {
  return Q.Promise(function(resolve) {
    //console.log(imageData.joke_id);
    n = addNumbers(imageData.joke_id);
    //console.log(n);
    var childArgs = [
      path.join(__dirname, 'downloadImage.js'),
      n
    ];
    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
      if(err){
        console.log(err);
      }
      if(stderr){
        console.log(stderr);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function addNumbers(n) {
  n = "000000" + n;
  n = n.substr(n.length-6);
  return n;
}

var useUpperCase = function(wordList) {
  var tmpList = Object.keys(wordList).filter(function(word) { return word[0] >= 'A' && word[0] <= 'Z' });
  return tmpList[~~(Math.random()*tmpList.length)];
};

function writeFile(string) {
  fs.open('input.txt', 'a', 666, function( e, id ) {
    fs.write( id, string, null, 'utf8', function(){
      fs.close(id, function(){
        //console.log('file closed');
      });
    });
  });
}
