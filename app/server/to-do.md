1. save server output as .json for offline development use during UI phase
2. see if you can figure out the caching stuff that polymer uses, if possible start baking it in so data is persistant and first in list can be retired
3. test out following server types ( make sure to bake in measure of duration, need metrics )
  * sequential with emit's as each article processes.
  * sequential with an emit for the entire processing of articles
  * lets be _honest_ if you do not do sequential you will nuke rate limiting or get banned.. 
  * singular readArticle requests entirely emitted by the client as the user chooses which articles they want to get the content for
4. try markdown-js node module.  this could be used for a damn fast easy way to view articles