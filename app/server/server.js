var app = require('express')();
var http = require('http').Server(app);
var   io = require('socket.io')(http);
var    q = require('q');
var   nr = require('node-readability');
var   h = require('htmlstrip-native');
var  fs = require('fs');
var   o = { include_script: false, include_style: false, compact_whitespace: true };
var  sh = require('sanitize-html');
var  tm = require('text-miner');
var  nl = require('newline-remove');
var   e = require('html-entities').AllHtmlEntities;
var entities = new e();



io.on('connection', function(socket) {
  console.log('connection detected...');
  socket.emit('serverStatus', { msg: 'connection detected..' });
  try {
    socket.on('readArticle', function(data) {
      readability(data.link).then(
        function(article) {
          console.log('io.onConnect.onReadArticle.success');
          console.log(typeof article);
          console.log('end of article....');
          article.success = true;
          socket.emit('articleRead', article);
          socket.emit('serverStatus', { msg: 'emitting article' });
          console.log('article emitted..');
        }, function(failure) { socket.emit('articleRead', { success: false, msg: failure }); }
      );
      
    });
  } catch(ex) { console.log('io.onConnection exception: %s', ex); }
});

var readability = function(link) {
  var d = q.defer();
  try {
    nr(link, function(err, article, meta) {
      if(err) { d.reject( { reason:  err, data: err } ); }
      else if(article.content === false) { d.reject({ reason: 'readability returned false', data: {} });  }
      else {
        // create text by stripping html and replacing html entities from article.content
        article.text = strip(article.content);
        article.title = article.title = strip(article.title).trim();
        article.link = link;
        d.resolve(article);
        // create paragraphs
        
        // getParagraphs(article).then(
        //     function(finishedArticle) { d.resolve({ article: finishedArticle }); },
        //     function(err)             { d.reject(err); }
        //   );
        
        
      }
    });
  } catch(ex)  { d.reject();}
  return d.promise;
};

var getParagraphs = function(objReadability) {
  console.log('server.ass.getParagraphs()...');
  var d = q.defer();
  try {
    console.log('getting paragraphs for %s', objReadability.title.trim());
    
    objReadability.para = sh(objReadability.content, {allowedTags: ['p']});
    objReadability.para = nl(objReadability.para);
    objReadability.para = entities.decode(objReadability.para);

    var open = "<p>";
    var clse = "</p>";
    var iB = 0; var iE = 0; var iI = 0;

    var pArray = [];

    while((iI = objReadability.para.indexOf(open,iI)) > -1) {
      iB = iI;
      if((iE = objReadability.para.indexOf(clse, iB)) > -1) {
        var p = objReadability.para.substring((iB + open.length), iE).trim();
        if(p !== '')
          pArray.push(p.trim());
      }
      iI = iE;
    }
    
    objReadability.paragraphs = pArray;
    console.log('getParagraphs().resolving objReadability with paragraphs added..');
    d.resolve(objReadability);
  } catch(ex) { console.log('\tserver.ass.getParagraphs() ex', ex); }
  return d.promise;
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


http.listen(1518, function() { console.log('listening on port 1518'); } );


/*
  // client side
  this.socket.on('serverStatus', this._onServerStatus.bind(this));
  this.socket.on('read', this._onRead.bind(this));
  
  // server side
  (IN)  socket.on('readArticle');
  (OUT) socket.emit('articleRead', {});

  article {
    node-readability : {
      String: content,
      String: title,
      String: text,
      [String] : paragraphs,
      [String]? : para
    },
    gfaLoadFeedEntry : {
      String: title,
      String: link,
      String: author,
      Date: publishedDate,
      String: contentSnippet,
      String: content,
      catagories: [String]
    },
    text-miner : {
      findFreqTerms : {
        String: word,
        Number: count,
        String: definition
      }
    },
    custom : {
      
    }
  }
*/
