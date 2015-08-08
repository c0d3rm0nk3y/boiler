// requires
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

// vars
var bTime;  // start time of processing
var fTime; // end time of processing


// exports

exports.readArticles = function(loadFeedObj) {
  var d = q.defer();
  try {} catch(ex) {}
  return d.promise;
};

exports.readArticle = function(loadFeedEntryObj) {
  var d = q.defer();
  try {} catch(ex) {}
  return d.promise;
};


// helper methods
var stripUrl = function(url) {
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
    d.resolve(pArray);
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