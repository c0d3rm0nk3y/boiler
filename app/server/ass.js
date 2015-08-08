var   q = require('q');
var  nr = require('node-readability');
var   h = require('htmlstrip-native');
var  fs = require('fs');
var   o = { include_script: false, include_style: false, compact_whitespace: true };
var  sh = require('sanitize-html');
var  tm = require('text-miner');
var  nl = require('newline-remove');
var   e = require('html-entities').AllHtmlEntities;
var entities = new e();

var count = 0;
var total = 0;

var procArts = [];

exports.readArticles = function(strArtArry) {
  var d = q.defer();
  try {
    
    var artArry = JSON.parse(strArtArry);  
    var pArray = [];
    artArry.forEach(function(article) { pArray.push(JSON.stringify(article)); });
    
    var l = pArray.reduce(function(promise, art) {
      return promise.then(function() {
        read(art).then(function(result) { procArts.push(result); }, function(err) { console.log(err); d.reject();  });
      });
    }, q.resolve());
    
    l.then(function(result){procArts.push(result); d.resolve(procArts); }, function(err) {console.log(err); d.reject(); });
    
  } catch(ex) {d.reject({msg: 'readArticles() exception', ex: ex});}
  return d.promise;
};

exports.readArticle = function(feedObj) {
  console.log('server.ass.readArticle()...');
  console.log('\tinbound is %s', typeof feedObj);
  var d = q.defer();
  try {
    read(feedObj)
      .then(function(readObj) { return getParagraphs(readObj);}, function(ex) { d.reject(ex); })
      .then(function(readObj) { d.resolve(readObj); })
      .done(function() { console.log('\tserver.ass.readArticle().read().done()...') });
  } catch(ex) { console.log('\treadArticle() ex: %s', ex); d.reject(ex); }
  return d.promise;
};

var read = function(feedObj) {
  
  console.log('server.ass.read()...');
  console.log('\tinbound is %s', typeof feedObj);
  var d = q.defer();
  try {
    nr(feedObj.link, function(err, art, meta) {
      if(err) { console.log('\tread() err: %s', err); d.reject(err); }
      else if(art.content === false) { console.log('\tread().content returned false'); d.reject({msg:'read().content returned false'}); }
      else {
        art.text = strip(art.text);
        art.title = strip(art.title).trim();
        art.link = feedObj.link;
        art.publishedDate = feedObj.publishedDate;
        //var strArt = JSON.stringify(art);
        d.resolve(art);
        // getParagraphs(art)
        //   .then(function(paraObj) {
        //     art.paragraphs = paraObj.paragraphs;
        //     d.resolve(art);
        //   });
      }
    });
  } catch(ex) { d.reject({msg: '\treadArticle() exception', ex: ex}); }
  return d.promise;
};



exports.stripUrl = function(url) {
  console.log('server.ass.stripUrl()...');
  try {
  return gup('url', url);
  }catch(ex) { console.log('\tserver.ass.stripUrl() ex: %s', ex); }
};

var getParagraphs = function(objReadability) {
  console.log('server.ass.getParagraphs()...');
  var d = q.defer();
  try {
    console.log('getting paragraphs for %s', objReadability.title.trim());
    
    var rezult = {};
    rezult.title = strip(objReadability.title);
    rezult.content = objReadability.content;
    rezult.para = sh(objReadability.content, {allowedTags: ['p']});
    rezult.para = nl(rezult.para);
    rezult.para = entities.decode(rezult.para);

    var open = "<p>";
    var clse = "</p>";
    var iB = 0; var iE = 0; var iI = 0;

    var pArray = [];

    while((iI = rezult.para.indexOf(open,iI)) > -1) {
      iB = iI;
      if((iE = rezult.para.indexOf(clse, iB)) > -1) {
        var p = rezult.para.substring((iB + open.length), iE).trim();
        if(p !== '')
          pArray.push(p.trim());
      }
      iI = iE;
    }
    
    rezult.paragraphs = pArray;
    d.resolve(rezult);
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

// backup

/**
read(feedObj.link, function(err, readObj, meta) {
  socket.emit('comms' , { msg: "read complete for " + count + " of " + total });
  if(err) { 
    console.log('readability error: ', err );
    socket.emit('comms' , { msg: "readability error " + err });
    d.reject(); 
    
  } else if(!readObj.content) { 
    console.log('readability returned false..'); d.resolve(); 
    socket.emit('comms' , { msg: "readability returned false.." });
  }else {
    getParagraphs(readObj)
      .then(function(results) {
        
        feedObj.text = strip(results.content);
        feedObj.text = feedObj.text.trim();
        feedObj.title = results.title.trim();
        feedObj.paragraphs = results.paragraphs;
        console.log('emitting %s', feedObj.title.trim());
        //fs.writeFile('example.json', JSON.stringify(feedObj,null,2), function(err) { if(err) console.log('write error'); console.log('write succesful'); });
        if(feedObj.text.trim() !== '')
          socket.emit('read', feedObj);
        d.resolve();
      });
  }
});  
  
 */ 
