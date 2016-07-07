var graph = require('fbgraph');
var Promise = require('bluebird');
var AWS = require('aws-sdk');
Promise.promisifyAll(graph);
var ContainerUrl = "http://cs496bucket.s3.amazonaws.com/"
var ContainerName = "cs496bucket";

module.exports = function(Image) {
  Image.upload = function(ctx, tokenid, cb) {
    graph.setAccessToken(tokenid);
    var fields = {"fields": "name, id"};
    var info = {};
    graph.getAsync("/me", fields).then(function (res, err) {
      if (err) {
        throw err;
      } 
      info.owner = res.id
      console.log(res);
      return res;
    }).then(function(res) {
      var option = {};
      ctx.req.params.container = ContainerName;
      var Upload = Promise.promisify(Image.app.models.container.upload);
      return Upload(ctx.req, ctx.result, option);
    }).then(function(fileObj, err) {
      console.log(err, fileObj);
      if(err) {
        throw err;
      }
      info.url = ContainerUrl + fileObj.files.newFile[0].name;
      return Image.create(info);
    }).then(function(image) {
      console.log(image);
      if (image) {
        cb(null, image);
      } else {
        err = {"err": "Create failed"};
        throw err;
      }
    }).catch(function(err) {
      console.log("errrrr :(");
      cb(err);
    });
  }

  Image.remoteMethod(
    'upload',
    {
      description: 'Upload a file',
      accepts: [
        {
          arg: 'ctx',
          type: 'object',
          http: {source: 'context'}
        },
        {
          arg: 'tokenid',
          type: 'string',
          http: { source:'query'}
        }
      ],
      returns: {arg: 'image', type: 'object'}
    }
  );
};
