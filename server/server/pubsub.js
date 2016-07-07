'use strict'
module.exports = {
  publish: function(socket, options) {
    if(options) {
      var collectionName = options.collectionName;
      var method = options.method;
      var data = options.data;
      var modelId = options.modelId;
      var methodName = options.methodName;
      if (method == 'POST') {
        var name = collectionName + '/' + methodName + "/" + method;
        socket.emit(name, data);
      }
      else {
        var name = collectionName + '/' + modelId + '/' + methodName + "/" + method;
        socket.emit(name, data);
      }
    } else {
      throw 'Error: Option must be an object type';
    }
  },

  isEmpty: function(obj) {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    if(obj == null) return true;

    if (obj.length > 0) return false;

    if (obj.length == 0) return true;

    for (var key in obj) {
      if (this.hasOwnProperty.call(obj, key)) return false;
    }

    return true;
  }
}

