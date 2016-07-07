var graph = require('fbgraph');
var Promise = require('bluebird');
Promise.promisifyAll(graph);

module.exports = function(Address) {
  'use strict';
  Address.sync = function(tokenid, fb_uid) {
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
    });
  };

  Address.getmobile = function(tokenid, fb_uid, cb) {
    graph.setAccessToken(tokenid);
    var fields={"fields": "id"};
    graph.getAsync("/me", fields).then(function (res, err) {
      if (err) {
        throw err;
      }
      var query = {"owner": res.id};
      return Address.find({where: query});
    }).then(function(addresses) {
      cb(null, addresses);
    }).catch(function (err) {
      cb(err);
    });
  };

  Address.remoteMethod(
    'getmobile',
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
        arg: 'addresses', type: 'array', root: true,
        description:
          'List of address',
      },
      http: {verb: 'get'}
    }
  );
};
