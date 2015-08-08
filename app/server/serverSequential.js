var app = require('express')();
var http = require('http').Server(app);
var   io = require('socket.io')(http);
var    q = require('q');

var   h = require('htmlstrip-native');
var   o = { include_script: false, include_style: false, compact_whitespace: true };

io.on('connection', function(socket) {
  socket.on('comms', function(data) { incomingMessage(socket, data); } );
  socket.on('readArticles', function(loadFeedObj) { readArticles(socket, loadFeedObj); });
});


var incomingMessage = function(socket, data) { console.log('incoming message: %s', data.msg); };

var readArticles = function(socket, loadFeedObj) {
  try {
    var pA = [];
    
    loadFeedObj.feed.entries.forEach(function(e, i, a) { 
      // strip out news.google.com link redirect
      a[i].link = gup('url', a[i].link); 
      // add to promise array
      pA.push({article: a[i], socket: socket});
    });
    // create array and prep it for promise mapping
    var lP = pA.reduce(function(p, d) {
      return p.then(
        function() {
          readArticle(d).then(
            function(result) {
              
            },
            function(err) {
              
            }
          );
        }
      );
    }, q.resolve());
    
    lP.then(
      function(result) {
      
      }, 
      function(err) {
        
      }
    );
    
  } catch(ex) { console.log(ex); socket.emit('comms', {msg: "readArticles() exception " + ex}); }
};

var readArticle = function(data) {
  var socket = data.socket;
  var article = data.article;
};

var strip = function(text) {
  console.log('server.ass.strip()');
  try       { return h.html_strip(text,o);   } 
  catch(ex) { console.log('\tstrip() ex:',ex); }
};

var gup = function( name, link ) {
  name        = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS  = "[\\?&]"+name+"=([^&#]*)";
  var regex   = new RegExp( regexS );
  var results = regex.exec( link );
  if(results === null) return null;
  else                 return results[1];
};


http.listen(1518, function() { console.log('listening on port 1518')});
