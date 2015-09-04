
var page = require('webpage').create();
var system = require('system');
var args = system.args;

var n = args[1];
var url = 'https://www.cartoonbank.com/search/-/search/results?_listenersearchresults_WAR_searchportlet_struts.portlet.action=%2Fview%2FshowDetail&_listenersearchresults_WAR_searchportlet_tagId=cncartoons';
page.open(url + n, function() {
  page.includeJs('//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js',function() {
      var images = page.evaluate(function() {
          var images = [];
          function getImgDimensions($i) {
              return {
                  top : $i.offset().top,
                  left : $i.offset().left,
                  width : $i.width(),
                  height : $i.height() - ($i.height() * 0.10)
              };
          }
          $('#detailimg img').each(function() {
              var img = getImgDimensions($(this));
              images.push(img);
          });

          return images;
      });

      images.forEach(function(imageObj, index, array){
          page.clipRect = imageObj;
          page.render('tmp/'+ 'comic' + n +'.jpg');
          console.log('tmp/'+ 'comic' + n +'.jpg');
      });

      phantom.exit();
  });
});
