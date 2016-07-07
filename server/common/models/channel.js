var graph = require('fbgraph');
var Promise = require('bluebird');
var pubsub = require('../../server/pubsub.js');
Promise.promisifyAll(graph);


module.exports = function(Channel) {
  'use strict',
  Channel.join = function(tokenid, session, ctx, cb) {
    graph.setAccessToken(tokenid);
    var fields={"fields": "id"};
    var user = {};
    graph.getAsync("/me", fields).then(function(res, err) {
      if(err) {
        throw err;
      }
      var query = {"fb_uid": res.id};
      return Channel.app.models.Person.findOne({where: query});
    }).then(function (person) {
      if (person) {
        user = person;
        var query = {"id": session};
        ctx.args.username = person.name;
        return Channel.findOne({where: query});
      } else {
        throw {"err": "no user"};
      }
    }).then(function (channel) {
      if (channel) {
        var check = true;
        for (var i = 0; i < channel.users.length; i++) {
          if (channel.users[i].id.equals(user.id)) {
            check = false;
            break;
          }
        }
        if (check) channel.users.push(user);
        return Channel.upsert(channel);
      } else {
        throw {"err": "no session"};
      }
    }).then(function(channel, err) {
      if (err) {
        throw err;
      }
      ctx.args.session = session;
      cb(null, channel.messages);
    }).catch(function (err) {
      cb(err);
    })
  };

  Channel.message = function(tokenid, content, session, ctx, cb) {
    graph.setAccessToken(tokenid);
    var fields={"fileds": "id"};
    var user={};
    graph.getAsync("/me", fields).then(function(res, err) {
      if(err) {
        throw err;
      }
      var query = {"fb_uid": res.id};
      return Channel.app.models.Person.findOne({where: query});
    }).then(function(person) {
      if(person) {
        user = person;
        var query = {"id": session};
        ctx.args.username = person.name;
        return Channel.findOne({where: query});
      } else {
        throw {"err": "No user"};
      }
    }).then(function(channel) {
      if (channel) {
        var msg = {
          "author": user.name,
          "content": content,
          "type": 1
        };
        channel.messages.push(msg);
        return Channel.upsert(channel);
      } else {
        throw {"err": "no channel"};
      }
    }).then(function(channel, err) {
      ctx.args.session = session;
      ctx.args.newMsg = channel;
      cb(null);
    }).catch(function(err) {
      cb(err);
    });
  };

  Channel.remoteMethod(
    'join',
    {
      description: 'Join into created session',
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
          arg: 'session',
          type: 'string',
          required: true,
          http: {
            source: 'query'
          }
        },
        {
          arg: "ctx",
          type: "object",
          http: {source: "context"}
        }
      ],
      returns: {
        arg: 'messages', type: 'object', root: true,
        description:
          'The response body contains all messages'
      },
      http: {verb: 'get'}
    }
  );

  Channel.remoteMethod(
    'message',
    {
      description: 'Send new message',
      accepts: [
        {
          arg: 'tokenid',
          type: 'string',
          required: false,
          http: {
            source: 'query'
          }
        },
        {
          arg: 'content',
          type: 'string',
          required: false,
          http: {
            source: 'query'
          }
        },
        {
          arg: 'session',
          type: 'string',
          required: false,
          http: {
            source: 'query'
          }
        },
        {
          arg: "ctx",
          type: "object",
          http: {source: "context"}
        }
      ],
      returns: {
        arg: 'messages', type: 'object', root: true,
        description:
          'The response body contains all messages'
      },
      http: {verb: 'get'}
    }
  );

  Channel.afterRemote('join', function(ctx, user, next) {
    var socket = Channel.app.io;
    var option = {
      collectionName: "channel",
      method: "GET",
      modelId: ctx.args.session,
      methodName: "join",
      data: {
        "message": ctx.args.username + "  Joined"
      }
    }
    pubsub.publish(socket, option);
    next();
  });

  Channel.afterRemote('message', function(ctx, user, next) {
    var socket = Channel.app.io;
    var option = {
      collectionName: "channel",
      method: "GET",
      modelId: ctx.args.session,
      methodName: "message",
      data: {
        "newMsg": ctx.args.newMsg
      }
    }
    pubsub.publish(socket, option);
    next();
  });
};
