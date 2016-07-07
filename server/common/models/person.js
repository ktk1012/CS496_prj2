var graph = require('fbgraph');
var Promise = require('bluebird');
Promise.promisifyAll(graph);

var app = require('../../server/server');


module.exports = function(Person) {
  'use strict';
  Person.fblogin = function(tokenid, fb_uid, ctx, cb) {
    var info;
    var fb_id = fb_uid;
    var fields = {"fields": "name, id, email"};
    graph.setAccessToken(tokenid);
    graph.getAsync("/me", fields).then(function (res, err) {
      if (err) {
        throw err;
      }
      info = res;
      var query = {
        fb_uid: fb_uid,
        graph_uid: res.id
      }
      return Person.findOne({where: query});
    }).then(function(person) {
      var now = new Date();
      var nowStr = now.toISOString().slice(0, 10);
      if(person) {
        return person.updateAttribute('lastUpdated', nowStr);
      } else {
        var newInfo = {
          email: info.email,
          name: info.name,
          password: "DUMMYPASSWORD",
          created: nowStr,
          fb_uid: fb_id,
          graph_uid: info.id
        };
        ctx.args.sync = true;
        ctx.args.fb_token = tokenid;
        ctx.args.fb_uid = fb_id;
        return Person.create(newInfo);
      }
    }).then(function(person) {
      if (person.createAccessToken.length == 2) {
        person.createAccessToken(undefined, function(err, token) {
          if (err) {
            cb(err);
          }
          cb(null, token);
        });
      } else {
        person.createAccessToken(undefined, tokenid, function(err, token) {
          if(err) {
            cb(err);
          }
          cb(null, token);
        });
      }
    });
  };

  Person.remoteMethod(
    'fblogin',
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
        },
        {
          arg: "ctx",
          type: "object",
          http: {
            source: "context"
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

  Person.beforeRemote('fblogin', function(ctx, unused, next) {
    ctx.args.sync = false;
    next();
  });

  Person.afterRemote('fblogin', function(ctx, user, next) {
    console.log(ctx.args.sync, ctx.args.fb_token, ctx.args.fb_uid);
    if (ctx.args.sync) {
      Person.app.models.Address.sync(ctx.args.fb_token, ctx.args.fb_uid);
    }
    next();
  });
};
