var graph = require('fbgraph');
var Promise = require('bluebird');
Promise.promisifyAll(graph);

module.exports = function(Address) {
  'use strict';
  Address.sync = function(tokenid, fb_uid, cb) {
    graph.setAccessToken(tokenid);
    var fields={"fields": "invitable_friends.limit(100){name,picture}"};
    graph.getAsync("/me", fields).then(function (res, err) {
      if (err) {
        throw err;
      }
      var newData = [];
      var invitableFriends = res.invitable_friends.data;
      var len = invitableFriends.length;
      for (var i = 0; i < len; i++) {
        newData.push({
          "name": invitableFriends[i].name,
          "picture": invitableFriends[i].picture.data.url,
          "owner": fb_uid});
      }
      Address.create(newData);
      cb(null);
    });
  };

  Address.remoteMethod(
    'sync',
    {
      description: 'Login a user with facebook token',
      accepts: [
        {
          arg: 'tokenid',
          type: 'string',
          required: true,
          http: {
            source: 'query'
          }
        },
        {
          arg: 'fb_uid',
          type: 'string',
          required: true,
          http: {
            source: 'query'
          }
        }
      ],
      returns: {
        arg: 'accessToken', type: 'object', root: true,
        description:
          'The response body contains properties of the accessToken created'
      },
      http: {verb: 'get'}
    }
  );
};
