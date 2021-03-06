'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _utils = require('./utils');

var _ResponseWrapper = require('./ResponseWrapper');

var _ResponseWrapper2 = _interopRequireDefault(_ResponseWrapper);

var _WebflowError = require('./WebflowError');

var _WebflowError2 = _interopRequireDefault(_WebflowError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_ENDPOINT = 'https://api.webflow.com';

var buildMeta = function buildMeta(res) {
  if (!res || !res.headers) {
    return {};
  }

  return {
    rateLimit: {
      limit: parseInt(res.headers.get('x-ratelimit-limit'), 10),
      remaining: parseInt(res.headers.get('x-ratelimit-remaining'), 10)
    }
  };
};

var responseHandler = function responseHandler(res) {
  return res.json().catch(function (err) {
    return (
      // Catch unexpected server errors where json isn't sent and rewrite
      // with proper class (WebflowError)
      Promise.reject(new _WebflowError2.default(err))
    );
  }).then(function (body) {
    if (res.status >= 400) {
      var errOpts = {
        code: body.code,
        msg: body.msg,
        _meta: buildMeta(res)
      };

      if (body.problems && body.problems.length > 0) {
        errOpts.problems = body.problems;
      }

      var errMsg = body && body.err ? body.err : 'Unknown error occured';
      var err = new _WebflowError2.default(errMsg);

      return Promise.reject(Object.assign(err, errOpts));
    }

    body._meta = buildMeta(res); // eslint-disable-line no-param-reassign

    return body;
  });
};

var Webflow = function () {
  function Webflow() {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$endpoint = _ref.endpoint,
        endpoint = _ref$endpoint === undefined ? DEFAULT_ENDPOINT : _ref$endpoint,
        token = _ref.token,
        _ref$version = _ref.version,
        version = _ref$version === undefined ? '1.0.0' : _ref$version;

    _classCallCheck(this, Webflow);

    if (!token) throw (0, _WebflowError.buildRequiredArgError)('token');

    this.responseWrapper = new _ResponseWrapper2.default(this);

    this.endpoint = endpoint;
    this.token = token;

    this.headers = {
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
      'accept-version': version,
      'Content-Type': 'application/json'
    };

    this.authenticatedFetch = function (method, path, data, query) {
      var queryString = query && !(0, _utils.isObjectEmpty)(query) ? '?' + _qs2.default.stringify(query) : '';

      var uri = '' + _this.endpoint + path + queryString;
      var opts = {
        method: method,
        headers: _this.headers,
        mode: 'cors'
      };

      if (data) {
        opts.body = JSON.stringify(data);
      }

      return (0, _isomorphicFetch2.default)(uri, opts).then(responseHandler);
    };
  }

  // Generic HTTP request handlers

  _createClass(Webflow, [{
    key: 'get',
    value: function get(path) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.authenticatedFetch('GET', path, false, query);
    }
  }, {
    key: 'post',
    value: function post(path, data) {
      var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.authenticatedFetch('POST', path, data, query);
    }
  }, {
    key: 'put',
    value: function put(path, data) {
      var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.authenticatedFetch('PUT', path, data, query);
    }
  }, {
    key: 'patch',
    value: function patch(path, data) {
      var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this.authenticatedFetch('PATCH', path, data, query);
    }
  }, {
    key: 'delete',
    value: function _delete(path) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.authenticatedFetch('DELETE', path, query);
    }

    // Meta

  }, {
    key: 'info',
    value: function info() {
      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.get('/info', query);
    }

    // Sites

  }, {
    key: 'sites',
    value: function sites() {
      var _this2 = this;

      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.get('/sites', query).then(function (sites) {
        return sites.map(function (site) {
          return _this2.responseWrapper.site(site);
        });
      });
    }
  }, {
    key: 'site',
    value: function site(_ref2) {
      var _this3 = this;

      var siteId = _ref2.siteId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.get('/sites/' + siteId, query).then(function (site) {
        return _this3.responseWrapper.site(site);
      });
    }
  }, {
    key: 'publishSite',
    value: function publishSite(_ref3) {
      var siteId = _ref3.siteId,
          domains = _ref3.domains;

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));
      if (!domains) return Promise.reject((0, _WebflowError.buildRequiredArgError)('domains'));

      return this.post('/sites/' + siteId + '/publish', { domains: domains });
    }

    // Domains

  }, {
    key: 'domains',
    value: function domains(_ref4) {
      var _this4 = this;

      var siteId = _ref4.siteId;

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.get('/sites/' + siteId + '/domains').then(function (domains) {
        return domains.map(function (domain) {
          return _this4.responseWrapper.domain(domain, siteId);
        });
      });
    }

    // Collections

  }, {
    key: 'collections',
    value: function collections(_ref5) {
      var _this5 = this;

      var siteId = _ref5.siteId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.get('/sites/' + siteId + '/collections', query).then(function (collections) {
        return collections.map(function (collection) {
          return _this5.responseWrapper.collection(collection);
        });
      });
    }
  }, {
    key: 'collection',
    value: function collection(_ref6) {
      var _this6 = this;

      var collectionId = _ref6.collectionId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));

      return this.get('/collections/' + collectionId, query).then(function (collection) {
        return _this6.responseWrapper.collection(collection);
      });
    }

    // Items

  }, {
    key: 'items',
    value: function items(_ref7) {
      var _this7 = this;

      var collectionId = _ref7.collectionId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));

      return this.get('/collections/' + collectionId + '/items', query).then(function (res) {
        return _extends({}, res, {

          items: res.items.map(function (item) {
            return _this7.responseWrapper.item(item, collectionId);
          })
        });
      });
    }
  }, {
    key: 'item',
    value: function item(_ref8) {
      var _this8 = this;

      var collectionId = _ref8.collectionId,
          itemId = _ref8.itemId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));
      if (!itemId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.get('/collections/' + collectionId + '/items/' + itemId, query).then(function (res) {
        return _this8.responseWrapper.item(res.items[0], collectionId);
      });
    }
  }, {
    key: 'createItem',
    value: function createItem(_ref9) {
      var _this9 = this;

      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var collectionId = _ref9.collectionId,
          data = _objectWithoutProperties(_ref9, ['collectionId']);

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));

      return this.post('/collections/' + collectionId + '/items', data, query).then(function (item) {
        return _this9.responseWrapper.item(item, collectionId);
      });
    }
  }, {
    key: 'updateItem',
    value: function updateItem(_ref10) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var collectionId = _ref10.collectionId,
          itemId = _ref10.itemId,
          data = _objectWithoutProperties(_ref10, ['collectionId', 'itemId']);

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));
      if (!itemId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('itemId'));

      return this.put('/collections/' + collectionId + '/items/' + itemId, data, query);
    }
  }, {
    key: 'removeItem',
    value: function removeItem(_ref11) {
      var collectionId = _ref11.collectionId,
          itemId = _ref11.itemId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));
      if (!itemId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('itemId'));

      return this.delete('/collections/' + collectionId + '/items/' + itemId, query);
    }
  }, {
    key: 'patchItem',
    value: function patchItem(_ref12) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var collectionId = _ref12.collectionId,
          itemId = _ref12.itemId,
          data = _objectWithoutProperties(_ref12, ['collectionId', 'itemId']);

      if (!collectionId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('collectionId'));
      if (!itemId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('itemId'));

      return this.patch('/collections/' + collectionId + '/items/' + itemId, data, query);
    }

    // Images

    // TODO

    // Webhooks

  }, {
    key: 'webhooks',
    value: function webhooks(_ref13) {
      var _this10 = this;

      var siteId = _ref13.siteId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.get('/sites/' + siteId + '/webhooks', query).then(function (webhooks) {
        return webhooks.map(function (webhook) {
          return _this10.responseWrapper.webhook(webhook, siteId);
        });
      });
    }
  }, {
    key: 'webhook',
    value: function webhook(_ref14) {
      var _this11 = this;

      var siteId = _ref14.siteId,
          webhookId = _ref14.webhookId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));
      if (!webhookId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('webhookId'));

      return this.get('/sites/' + siteId + '/webhooks/' + webhookId, query).then(function (webhook) {
        return _this11.responseWrapper.webhook(webhook, siteId);
      });
    }
  }, {
    key: 'createWebhook',
    value: function createWebhook(_ref15) {
      var _this12 = this;

      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var siteId = _ref15.siteId,
          data = _objectWithoutProperties(_ref15, ['siteId']);

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));

      return this.post('/sites/' + siteId + '/webhooks', data, query).then(function (webhook) {
        return _this12.responseWrapper.webhook(webhook, siteId);
      });
    }
  }, {
    key: 'removeWebhook',
    value: function removeWebhook(_ref16) {
      var siteId = _ref16.siteId,
          webhookId = _ref16.webhookId;
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!siteId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('siteId'));
      if (!webhookId) return Promise.reject((0, _WebflowError.buildRequiredArgError)('webhookId'));

      return this.delete('/sites/' + siteId + '/webhooks/' + webhookId, query);
    }
  }]);

  return Webflow;
}();

exports.default = Webflow;
module.exports = exports['default'];