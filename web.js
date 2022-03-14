(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('os'), require('fs'), require('child_process'), require('perf_hooks'), require('chalk'), require('request-promise'), require('path'), require('moment')) :
  typeof define === 'function' && define.amd ? define(['exports', 'os', 'fs', 'child_process', 'perf_hooks', 'chalk', 'request-promise', 'path', 'moment'], factory) :
  (factory((global.RallyTools = {}),global.os,global.fs,global.child_process,global.perf_hooks,global.chalk$1,global.rp,global.path,global.moment));
}(this, (function (exports,os,fs,child_process,perf_hooks,chalk$1,rp,path,moment) { 'use strict';

  var fs__default = 'default' in fs ? fs['default'] : fs;
  chalk$1 = chalk$1 && chalk$1.hasOwnProperty('default') ? chalk$1['default'] : chalk$1;
  rp = rp && rp.hasOwnProperty('default') ? rp['default'] : rp;
  var path__default = 'default' in path ? path['default'] : path;
  moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;

  function _asyncIterator(iterable) {
    var method;

    if (typeof Symbol === "function") {
      if (Symbol.asyncIterator) {
        method = iterable[Symbol.asyncIterator];
        if (method != null) return method.call(iterable);
      }

      if (Symbol.iterator) {
        method = iterable[Symbol.iterator];
        if (method != null) return method.call(iterable);
      }
    }

    throw new TypeError("Object is not async iterable");
  }

  function _AwaitValue(value) {
    this.wrapped = value;
  }

  function _AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;
        var wrappedAwait = value instanceof _AwaitValue;
        Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
          if (wrappedAwait) {
            resume("next", arg);
            return;
          }

          settle(result.done ? "return" : "normal", arg);
        }, function (err) {
          resume("throw", err);
        });
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  _AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  _AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  _AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  function _wrapAsyncGenerator(fn) {
    return function () {
      return new _AsyncGenerator(fn.apply(this, arguments));
    };
  }

  function _awaitAsyncGenerator(value) {
    return new _AwaitValue(value);
  }

  function _asyncGeneratorDelegate(inner, awaitWrap) {
    var iter = {},
        waiting = false;

    function pump(key, value) {
      waiting = true;
      value = new Promise(function (resolve) {
        resolve(inner[key](value));
      });
      return {
        done: false,
        value: awaitWrap(value)
      };
    }

    if (typeof Symbol === "function" && Symbol.iterator) {
      iter[Symbol.iterator] = function () {
        return this;
      };
    }

    iter.next = function (value) {
      if (waiting) {
        waiting = false;
        return value;
      }

      return pump("next", value);
    };

    if (typeof inner.throw === "function") {
      iter.throw = function (value) {
        if (waiting) {
          waiting = false;
          throw value;
        }

        return pump("throw", value);
      };
    }

    if (typeof inner.return === "function") {
      iter.return = function (value) {
        return pump("return", value);
      };
    }

    return iter;
  }

  exports.configFile = null;

  if (os.homedir) {
    exports.configFile = os.homedir() + "/.rallyconfig";
  }


  function loadConfig(file) {
    if (file) exports.configFile = file;
    if (!exports.configFile) return;
    exports.configObject = {
      hasConfig: true
    };

    try {
      let json = fs.readFileSync(exports.configFile);
      exports.configObject = JSON.parse(json);
      exports.configObject.hasConfig = true;
    } catch (e) {
      if (e.code == "ENOENT") {
        exports.configObject.hasConfig = false; //ok, they should probably make a config
      } else {
        throw e;
      }
    }
  }
  function loadConfigFromArgs(args) {
    let tempConfig = {
      hasConfig: true,
      ...args.config
    };
    exports.configObject = tempConfig;
  }
  function setConfig(obj) {
    exports.configObject = obj;
  }

  //these are the help entries for each command
  //function retuns obj.a.b.c

  function deepAccess(obj, path$$1) {
    let o = obj;

    for (let key of path$$1) {
      if (!o) return [];
      o = o[key];
    }

    return o;
  } //This takes a class as the first argument, then adds a getter/setter pair that
  //corresponds to an object in this.data


  function defineAssoc(classname, shortname, path$$1) {
    path$$1 = path$$1.split(".");
    let lastKey = path$$1.pop();
    Object.defineProperty(classname.prototype, shortname, {
      get() {
        return deepAccess(this, path$$1)[lastKey];
      },

      set(val) {
        deepAccess(this, path$$1)[lastKey] = val;
      }

    });
  }

  function spawn(options, ...args) {
    if (typeof options !== "object") {
      args.unshift(options);
      options = {};
    } //todo options


    return new Promise((resolve, reject) => {
      let start = perf_hooks.performance.now();
      let stdout = "";
      let stderr = "";
      let cp = child_process.spawn(...args);
      let write = global.write;

      if (options.noecho) {
        write = () => {};
      }

      if (cp.stdout) cp.stdout.on("data", chunk => {
        stdout += chunk;
        write(chunk);
      });
      if (cp.stderr) cp.stderr.on("data", chunk => {
        stderr += chunk;
        write(chunk);
      });

      if (options.stdin) {
        options.stdin(cp.stdin);
      }

      cp.on("error", reject);
      cp.on("close", code => {
        let end = perf_hooks.performance.now();
        let time = end - start;
        let timestr = time > 1000 ? (time / 100 | 0) / 10 + "s" : (time | 0) + "ms";
        resolve({
          stdout,
          stderr,
          exitCode: code,
          time,
          timestr
        });
      });
    });
  }

  global.chalk = chalk$1;

  global.log = (...text) => console.log(...text);

  global.write = (...text) => process.stdout.write(...text);

  global.elog = (...text) => console.error(...text);

  global.ewrite = (...text) => process.stderr.write(...text);

  global.errorLog = (...text) => log(...text.map(chalk$1.red));

  class lib {
    //This function takes 2 required arguemnts:
    // env: the enviornment you wish to use
    // and either:
    //  'path', the short path to the resource. ex '/presets/'
    //  'path_full', the full path to the resource like 'https://discovery-dev.sdvi.com/presets'
    //
    // If the method is anything but GET, either payload or body should be set.
    // payload should be a javascript object to be turned into json as the request body
    // body should be a string that is passed as the body. for example: the python code of a preset.
    //
    // qs are the querystring parameters, in a key: value object.
    // {filter: "name=test name"} becomes something like 'filter=name=test+name'
    //
    // headers are the headers of the request. "Content-Type" is already set if
    //   payload is given as a parameter
    //
    // fullResponse should be true if you want to receive the request object,
    //  not just the returned data.
    static async makeAPIRequest({
      env,
      path: path$$1,
      path_full,
      fullPath,
      payload,
      body,
      method = "GET",
      qs,
      headers = {},
      fullResponse = false,
      timeout = exports.configObject.timeout || 20000
    }) {
      var _configObject$api;

      //backwards compatability from ruby script
      if (fullPath) path_full = fullPath; //Keys are defined in enviornment variables

      let config = exports.configObject === null || exports.configObject === void 0 ? void 0 : (_configObject$api = exports.configObject.api) === null || _configObject$api === void 0 ? void 0 : _configObject$api[env];

      if (!config) {
        throw new UnconfiguredEnvError(env);
      }

      if (method !== "GET" && !exports.configObject.dangerModify) {
        if (env === "UAT" && exports.configObject.restrictUAT || env === "PROD") {
          throw new ProtectedEnvError(env);
        }
      }

      let rally_api_key = config.key;
      let rally_api = config.url;

      if (path$$1 && path$$1.startsWith("/v1.0/")) {
        rally_api = rally_api.replace("/api/v2", "/api");
      }

      path$$1 = path_full || rally_api + path$$1;

      if (payload) {
        body = JSON.stringify(payload, null, 4);
      }

      if (payload) {
        headers["Content-Type"] = "application/vnd.api+json";
      }

      let fullHeaders = {
        //SDVI ignores this header sometimes.
        Accept: "application/vnd.api+json",
        "X-SDVI-Client-Application": "Discovery-rtlib-" + (exports.configObject.appName || "commandline"),
        ...headers
      };

      if (exports.configObject.vvverbose) {
        log(`${method} @ ${path$$1}`);
        log(JSON.stringify(fullHeaders, null, 4));

        if (body) {
          log(body);
        } else {
          log("(No body");
        }
      }

      let requestOptions = {
        method,
        body,
        qs,
        uri: path$$1,
        timeout,
        auth: {
          bearer: rally_api_key
        },
        headers: fullHeaders,
        simple: false,
        resolveWithFullResponse: true
      };
      let response;

      try {
        response = await rp(requestOptions);

        if (exports.configObject.vverbose || exports.configObject.vvverbose) {
          log(chalk$1`${method} @ ${response.request.uri.href}`);
        }
      } catch (e) {
        if ((e === null || e === void 0 ? void 0 : e.cause.code) === "ESOCKETTIMEDOUT") {
          throw new APIError(response || {}, requestOptions, body);
        } else {
          throw e;
        }
      } //Throw an error for any 5xx or 4xx


      if (!fullResponse && ![200, 201, 202, 203, 204].includes(response.statusCode)) {
        throw new APIError(response, requestOptions, body);
      }

      let contentType = response.headers["content-type"];
      let isJSONResponse = contentType === "application/vnd.api+json" || contentType === "application/json";

      if (exports.configObject.vvverbose) {
        log(response.body);
      }

      if (fullResponse) {
        return response;
      } else if (isJSONResponse) {
        var _response, _response$body;

        if ([200, 201, 202, 203, 204].includes(response.statusCode) && !((_response = response) === null || _response === void 0 ? void 0 : (_response$body = _response.body) === null || _response$body === void 0 ? void 0 : _response$body.trim())) return {};

        try {
          return JSON.parse(response.body);
        } catch (e) {
          log(response.body);
          throw new AbortError("Body is not valid json: ");
        }
      } else {
        return response.body;
      }
    } //Index a json endpoint that returns a {links} field.
    //This function returns the merged data objects as an array
    //
    //Additonal options (besides makeAPIRequest options):
    // - Observe: function to be called for each set of data from the api


    static async indexPath(env, path$$1) {
      let opts = typeof env === "string" ? {
        env,
        path: path$$1
      } : env;
      opts.maxParallelRequests = 1;
      let index = new IndexObject(opts);
      return await index.fullResults();
    }

    static clearProgress(size = 30) {
      if (!exports.configObject.globalProgress) return;
      process.stderr.write(`\r${" ".repeat(size + 15)}\r`);
    }

    static async drawProgress(i, max, size = process.stdout.columns - 15 || 15) {
      if (!exports.configObject.globalProgress) return;
      if (size > 45) size = 45;
      let pct = Number(i) / Number(max); //clamp between 0 and 1

      pct = pct < 0 ? 0 : pct > 1 ? 1 : pct;
      let numFilled = Math.floor(pct * size);
      let numEmpty = size - numFilled;
      this.clearProgress(size);
      process.stderr.write(`[${"*".repeat(numFilled)}${" ".repeat(numEmpty)}] ${i} / ${max}`);
    }

    static async keepalive(funcs) {
      for (let f of funcs) {
        await f();
      }
    } //Index a json endpoint that returns a {links} field.
    //
    //This function is faster than indexPath because it can guess the pages it
    //needs to retreive so that it can request all assets at once.
    //
    //This function assumes that the content from the inital request is the
    //first page, so starting on another page may cause issues. Consider
    //indexPath for that.
    //
    //Additional opts, besides default indexPath opts:
    // - chunksize[10]: How often to break apart concurrent requests


    static async indexPathFast(env, path$$1) {
      let opts = typeof env === "string" ? {
        env,
        path: path$$1
      } : env;
      let index = new IndexObject(opts);
      return await index.fullResults();
    }

    static isLocalEnv(env) {
      return !env || env === "LOCAL" || env === "LOC";
    }

    static envName(env) {
      if (this.isLocalEnv(env)) return "LOCAL";
      return env;
    }

  }
  class AbortError extends Error {
    constructor(message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = "AbortError";
    }

  }
  class APIError extends Error {
    constructor(response, opts, body) {
      super(chalk$1`
{reset Request returned} {yellow ${response === null || response === void 0 ? void 0 : response.statusCode}}{
{green ${JSON.stringify(opts, null, 4)}}
{green ${body}}
{reset ${response.body}}
===============================
{red ${!response.body ? "Request timed out" : "Bad response from API"}}
===============================
        `);
      this.response = response;
      this.opts = opts;
      this.body = body; //Error.captureStackTrace(this, this.constructor);

      this.name = "ApiError";
    }

  }
  class UnconfiguredEnvError extends AbortError {
    constructor(env) {
      super("Unconfigured enviornment: " + env);
      this.name = "Unconfigured Env Error";
    }

  }
  class ProtectedEnvError extends AbortError {
    constructor(env) {
      super("Protected enviornment: " + env);
      this.name = "Protected Env Error";
    }

  }
  class FileTooLargeError extends Error {
    constructor(file) {
      super(`File ${file.parentAsset ? file.parentAsset.name : "(unknown)"}/${file.name} size is: ${file.sizeGB}g (> ~.2G)`);
      this.name = "File too large error";
    }

  }
  class ResoultionError extends Error {
    constructor(name, env) {
      super(chalk$1`Error during name resolution: '{blue ${name}}' is not mapped on {green ${env}}`);
      this.name = "Name Resoultion Error";
    }

  }
  class Collection {
    constructor(arr) {
      this.arr = arr;
    }

    [Symbol.iterator]() {
      return this.arr[Symbol.iterator]();
    }

    findById(id) {
      return this.arr.find(x => x.id == id);
    }

    findByName(name) {
      return this.arr.find(x => x.name == name);
    }

    findByNameContains(name) {
      return this.arr.find(x => x.name.includes(name));
    }

    log() {
      for (let d of this) {
        if (d) {
          log(d.chalkPrint(true));
        } else {
          log(chalk$1`{red (None)}`);
        }
      }
    }

    get length() {
      return this.arr.length;
    }

  }
  class RallyBase {
    static handleCaching() {
      if (!this.cache) this.cache = [];
    }

    static isLoaded(env) {
      if (!this.hasLoadedAll) return;
      return this.hasLoadedAll[env];
    }

    static async getById(env, id, qs) {
      this.handleCaching();

      for (let item of this.cache) {
        if (item.id == id && item.remote === env || `${env}-${id}` === item.metastring) return item;
      }

      let data = await lib.makeAPIRequest({
        env,
        path: `/${this.endpoint}/${id}`,
        qs
      });

      if (data.data) {
        let o = new this({
          data: data.data,
          remote: env,
          included: data.included
        });
        this.cache.push(o);
        return o;
      }
    }

    static async getByName(env, name, qs) {
      this.handleCaching();

      for (let item of this.cache) {
        if (item.name === name && item.remote === env) return item;
      }

      let data = await lib.makeAPIRequest({
        env,
        path: `/${this.endpoint}`,
        qs: { ...qs,
          filter: `name=${name}` + (qs && qs.filter ? qs.filter : "")
        }
      }); //TODO included might not wokr correctly here

      if (data.data[0]) {
        let o = new this({
          data: data.data[0],
          remote: env,
          included: data.included
        });
        this.cache.push(o);
        return o;
      }
    }

    static async getAllPreCollect(d) {
      return d;
    }

    static async getAll(env) {
      this.handleCaching();
      let datas = await lib.indexPathFast({
        env,
        path: `/${this.endpoint}`,
        pageSize: "50",
        qs: {
          sort: "id"
        }
      });
      datas = await this.getAllPreCollect(datas);
      let all = new Collection(datas.map(data => new this({
        data,
        remote: env
      })));
      this.cache = [...this.cache, ...all.arr];
      return all;
    }

    static async removeCache(env) {
      this.handleCaching();
      this.cache = this.cache.filter(x => x.remote !== env);
    } //Specific turns name into id based on env
    //Generic turns ids into names


    async resolveApply(type, dataObj, direction) {
      let obj;

      if (direction == "generic") {
        obj = await type.getById(this.remote, dataObj.id);

        if (obj) {
          dataObj.name = obj.name;
        } else {
          throw new ResoultionError(`(id = ${dataObj.id})`, this.remote);
        }
      } else if (direction == "specific") {
        obj = await type.getByName(this.remote, dataObj.name);

        if (obj) {
          dataObj.id = obj.id;
        } else {
          throw new ResoultionError(dataObj.name, this.remote);
        }
      }

      return obj;
    } //Type is the baseclass you are looking for (should extend RallyBase)
    //name is the name of the field
    //isArray is true if it has multiple cardinailty, false if it is single
    //direction gets passed directly to resolveApply


    async resolveField(type, name, isArray = false, direction = "generic") {
      // ignore empty fields
      let field = this.relationships[name];
      if (!(field === null || field === void 0 ? void 0 : field.data)) return;

      if (isArray) {
        return await Promise.all(field.data.map(o => this.resolveApply(type, o, direction)));
      } else {
        return await this.resolveApply(type, field.data, direction);
      }
    }

    cleanup() {
      for (let [key, val] of Object.entries(this.relationships)) {
        //Remove ids from data
        if (val.data) {
          if (val.data.id) {
            delete val.data.id;
          } else if (val.data[0]) {
            for (let x of val.data) delete x.id;
          }
        }

        delete val.links;
      } // organization is unused (?)


      delete this.relationships.organization; // id is specific to envs
      // but save source inside meta string in case we need it

      this.metastring = this.remote + "-" + this.data.id;
      delete this.data.id; // links too

      delete this.data.links;
    }

  }
  function sleep(time = 1000) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
  function* zip(...items) {
    let iters = items.map(x => x[Symbol.iterator]());

    for (;;) {
      let r = [];

      for (let i of iters) {
        let next = i.next();
        if (next.done) return;
        r.push(next.value);
      }

      yield r;
    }
  }
  function unordered(_x) {
    return _unordered.apply(this, arguments);
  }

  function _unordered() {
    _unordered = _wrapAsyncGenerator(function* (proms) {
      let encapsulatedPromises = proms.map(async (x, i) => [i, await x]);

      while (encapsulatedPromises.length > 0) {
        let [ind, result] = yield _awaitAsyncGenerator(Promise.race(encapsulatedPromises.filter(x => x)));
        yield result;
        encapsulatedPromises[ind] = undefined;
      }
    });
    return _unordered.apply(this, arguments);
  }

  function* range(start, end) {
    if (end === undefined) {
      end = start;
      start = 0;
    }

    while (start < end) yield start++;
  }
  class IndexObject {
    //normal opts from any makeAPIRequest
    //Note that full_response and pages won't work.
    //
    //if you want to start from another page, use `opts.start`
    //opts.observe: async function(jsonData) => jsonData. Transform the data from the api
    //opts.maxParallelRequests: number of max api requests to do at once
    //opts.noCollect: return [] instead of the full data
    constructor(opts) {
      this.opts = opts;
    }

    linkToPage(page) {
      return this.baselink.replace(`page=1p`, `page=${page}p`);
    }

    async initializeFirstRequest() {
      //Create a copy of the options in case we need to have a special first request
      this.start = this.opts.start || 1;
      let initOpts = { ...this.opts
      };

      if (this.opts.pageSize) {
        initOpts.qs = { ...this.opts.qs
        };
        initOpts.qs.page = `${this.start}p${this.opts.pageSize}`;
      }

      this.allResults = []; //we make 1 non-parallel request to the first page so we know how to
      //format the next requests

      let json = await lib.makeAPIRequest(initOpts);
      if (this.opts.observe) json = await this.opts.observe(json);
      if (!this.opts.noCollect) this.allResults.push(json);
      this.baselink = json.links.first;
      this.currentPageRequest = this.start;
      this.hasHit404 = false;
    }

    getNextRequestLink() {
      this.currentPageRequest++;
      return [this.currentPageRequest, this.linkToPage(this.currentPageRequest)];
    } ///promiseID is the id in `currentPromises`, so that it can be marked as
    ///done inside the promise array. promiseID is a number from 0 to
    ///maxparallel-1


    async getNextRequestPromise(promiseID) {
      let [page, path_full] = this.getNextRequestLink();
      return [promiseID, page, await lib.makeAPIRequest({ ...this.opts,
        path_full,
        fullResponse: true
      })];
    }

    cancel() {
      this.willCancel = true;
    }

    async fullResults() {
      await this.initializeFirstRequest();
      let maxParallelRequests = this.opts.maxParallelRequests || this.opts.chunksize || 20;
      let currentPromises = []; //generate the first set of requests. Everything after this will re-use these i promiseIDs

      for (let i = 0; i < maxParallelRequests; i++) {
        currentPromises.push(this.getNextRequestPromise(currentPromises.length));
      }

      for (;;) {
        let [promiseID, page, requestResult] = await Promise.race(currentPromises.filter(x => x));

        if (this.willCancel) {
          return null;
        }

        if (requestResult.statusCode === 404) {
          this.hasHit404 = true;
        } else if (requestResult.statusCode === 200) {
          let json = JSON.parse(requestResult.body);
          if (this.opts.observe) json = await this.opts.observe(json);
          if (!this.opts.noCollect) this.allResults.push(json);
          if (json.data.length === 0) this.hasHit404 = true;
        } else {
          throw new APIError(requestResult, `(unknown args) page ${page}`, null);
        }

        if (this.hasHit404) {
          currentPromises[promiseID] = null;
        } else {
          currentPromises[promiseID] = this.getNextRequestPromise(promiseID);
        }

        if (currentPromises.filter(x => x).length === 0) break;
      }

      let all = [];

      for (let result of this.allResults) {
        for (let item of result.data) {
          all.push(item);
        }
      }

      return all;
    }

  }
  function orderedObjectKeys(obj) {
    let keys = Object.keys(obj).sort();
    let newDict = {};

    for (let key of keys) {
      if (Array.isArray(obj[key])) {
        newDict[key] = obj[key].map(x => orderedObjectKeys(x));
      } else if (typeof obj[key] === "object" && obj[key]) {
        newDict[key] = orderedObjectKeys(obj[key]);
      } else {
        newDict[key] = obj[key];
      }
    }

    return newDict;
  }

  class Provider extends RallyBase {
    constructor({
      data,
      remote
    }) {
      super();
      this.data = data;
      this.meta = {};
      this.remote = remote;
    } //cached


    async getEditorConfig() {
      if (this.editorConfig) return this.editorConfig;
      this.editorConfig = await lib.makeAPIRequest({
        env: this.remote,
        path_full: this.data.links.editorConfig
      });
      this.editorConfig.fileExt = await this.getFileExtension();
      return this.editorConfig;
    }

    static async getAllPreCollect(providers) {
      return providers.sort((a, b) => {
        return a.attributes.category.localeCompare(b.attributes.category) || a.attributes.name.localeCompare(b.attributes.name);
      });
    }

    async getFileExtension() {
      let config = await this.getEditorConfig();
      let map = {
        python: "py",
        text: "txt",

        getmap(key) {
          if (this.name === "Aurora") return "zip";
          if (this.name === "Vantage") return "zip";
          if (this.name === "ffmpeg") return "txt";
          if (this[key]) return this[key];
          return key;
        }

      };
      return map.getmap(config.lang);
    }

    chalkPrint(pad = true) {
      let id = String(this.id);
      if (pad) id = id.padStart(4);
      return chalk`{green ${id}}: {blue ${this.category}} - {green ${this.name}}`;
    }

  }

  defineAssoc(Provider, "id", "data.id");
  defineAssoc(Provider, "name", "data.attributes.name");
  defineAssoc(Provider, "category", "data.attributes.category");
  defineAssoc(Provider, "remote", "meta.remote");
  defineAssoc(Provider, "editorConfig", "meta.editorConfig");
  Provider.endpoint = "providerTypes";

  class Notification extends RallyBase {
    constructor({
      data,
      remote
    }) {
      super();
      this.data = data;
      this.meta = {};
      this.remote = remote;
    }

    static async getAllPreCollect(notifications) {
      return notifications.sort((a, b) => {
        return a.attributes.type.localeCompare(b.attributes.type) || a.attributes.name.localeCompare(b.attributes.name);
      });
    }

    chalkPrint(pad = false) {
      let id = String("N-" + this.id);
      if (pad) id = id.padStart(4);
      return chalk`{green ${id}}: {blue ${this.type}} - {green ${this.name}}`;
    }

  }

  defineAssoc(Notification, "id", "data.id");
  defineAssoc(Notification, "name", "data.attributes.name");
  defineAssoc(Notification, "address", "data.attributes.address");
  defineAssoc(Notification, "type", "data.attributes.type");
  defineAssoc(Notification, "remote", "meta.remote");
  Notification.endpoint = "notificationPresets";

  let home;

  if (os.homedir) {
    home = os.homedir();
  }

  const colon = /:/g;
  const siloLike = /(silo\-\w+?)s?\/([^\/]+)\.([\w1234567890]+)$/g;
  function pathTransform(path$$1) {
    if (path$$1.includes(":")) {
      //Ignore the first colon in window-like filesystems
      path$$1 = path$$1.slice(0, 3) + path$$1.slice(3).replace(colon, "--");
    }

    if (exports.configObject.invertedPath) {
      path$$1 = path$$1.replace(siloLike, "$2-$1.$3");
    }

    if (path$$1.includes("\\342\\200\\220")) {
      path$$1 = path$$1.replace("\\342\\200\\220", "‐");
    }

    return path$$1;
  }
  function readFileSync(path$$1, options) {
    return fs__default.readFileSync(pathTransform(path$$1), options);
  } //Create writefilesync, with ability to create directory if it doesnt exist

  function writeFileSync(path$$1, data, options, dircreated = false) {
    path$$1 = pathTransform(path$$1);

    try {
      return fs__default.writeFileSync(path$$1, data, options);
    } catch (e) {
      if (dircreated) throw e;
      let directory = path.dirname(path$$1);

      try {
        fs__default.statSync(directory);
        throw e;
      } catch (nodir) {
        fs__default.mkdirSync(directory);
        return writeFileSync(path$$1, data, options, true);
      }
    }
  }

  class Rule extends RallyBase {
    constructor({
      path: path$$1,
      data,
      remote,
      subProject
    } = {}) {
      super();

      if (path$$1) {
        path$$1 = path.resolve(path$$1);

        try {
          let f = readFileSync(path$$1, "utf-8");
          data = JSON.parse(readFileSync(path$$1, "utf-8"));
        } catch (e) {
          if (e.code === "ENOENT") {
            if (exports.configObject.ignoreMissing) {
              this.missing = true;
              return undefined;
            } else {
              throw new AbortError("Could not load code of local file");
            }
          } else {
            throw new AbortError(`Unreadable JSON in ${path$$1}. ${e}`);
          }
        }
      }

      this.meta = {};
      this.subproject = subProject;

      if (!data) {
        data = Rule.newShell();
      }

      this.data = data;
      this.remote = remote;
      delete this.data.relationships.transitions;
      delete this.data.meta;
      delete this.data.attributes.updatedAt;
      delete this.data.attributes.createdAt;
      this.isGeneric = !this.remote;
    }

    static newShell() {
      return {
        "attributes": {
          "description": "-",
          "priority": "PriorityNorm",
          "starred": false
        },
        "relationships": {},
        "type": "workflowRules"
      };
    }

    async acclimatize(env) {
      this.remote = env;
      let preset = await this.resolveField(Preset, "preset", false, "specific");
      let pNext = await this.resolveField(Rule, "passNext", false, "specific");
      let eNext = await this.resolveField(Rule, "errorNext", false, "specific");
      let proType = await this.resolveField(Provider, "providerType", false, "specific");
      let dynamicNexts = await this.resolveField(Rule, "dynamicNexts", true, "specific");
      let enterNotif = await this.resolveField(Notification, "enterNotifications", true, "specific");
      let errorNotif = await this.resolveField(Notification, "errorNotifications", true, "specific");
      let passNotif = await this.resolveField(Notification, "passNotifications", true, "specific");
    }

    async saveA(env) {
      if (lib.isLocalEnv(env)) return;
      return await this.createIfNotExist(env);
    }

    async saveB(env) {
      if (!this.isGeneric) {
        await this.resolve();
      }

      this.cleanup();

      if (lib.isLocalEnv(env)) {
        log(chalk`Saving rule {green ${this.name}} to {blue ${lib.envName(env)}}.`);
        writeFileSync(this.localpath, JSON.stringify(orderedObjectKeys(this.data), null, 4));
      } else {
        await this.acclimatize(env);
        return await this.uploadRemote(env);
      }
    }

    get immutable() {
      return false;
    }

    async createIfNotExist(env) {
      write(chalk`First pass rule {green ${this.name}} to {green ${env}}: `);

      if (this.immutable) {
        log(chalk`{magenta IMMUTABLE}. Nothing to do.`);
        return;
      } //First query the api to see if this already exists.


      let remote = await Rule.getByName(env, this.name);
      this.idMap = this.idMap || {};

      if (remote) {
        this.idMap[env] = remote.id;
        log(chalk`exists ${remote.chalkPrint(false)}`);
        return;
      } //If it exists we can replace it


      write("create, ");
      let res = await lib.makeAPIRequest({
        env,
        path: `/workflowRules`,
        method: "POST",
        payload: {
          data: {
            attributes: {
              name: this.name
            },
            type: "workflowRules"
          }
        }
      });
      this.idMap = this.idMap || {};
      this.idMap[env] = res.data.id;
      write("id ");
      log(this.idMap[env]);
    }

    async patchStrip() {
      delete this.data.attributes.createdAt;
      delete this.data.attributes.starred;
      delete this.data.attributes.updatedAt; // TEMP FIX FOR BUG IN SDVI

      if (this.relationships.passMetadata && this.relationships.passMetadata[0]) {
        log("HAS PASS");
        log(this.name);
        log("HAS PASS");
      }

      delete this.relationships.passMetadata;

      if (this.relationships.errorMetadata && this.relationships.errorMetadata[0]) {
        log("HAS PASS");
        log(this.name);
        log("HAS PASS");
      }

      delete this.relationships.errorMetadata; // This is commented out because it was fixed.
      //for(let key in this.relationships){
      //let relationship = this.relationships[key];
      //if(!relationship.data || relationship.data instanceof Array && !relationship.data[0]){
      //delete this.relationships[key];
      //}
      //}
    }

    async uploadRemote(env) {
      write(chalk`Uploading rule {green ${this.name}} to {green ${env}}: `);

      if (this.immutable) {
        log(chalk`{magenta IMMUTABLE}. Nothing to do.`);
        return;
      }

      if (this.idMap[env]) {
        this.remote = env;
        await this.patchStrip();
        this.data.id = this.idMap[env]; //If it exists we can replace it

        write("replace, ");
        let res = await lib.makeAPIRequest({
          env,
          path: `/workflowRules/${this.idMap[env]}`,
          method: "PUT",
          payload: {
            data: this.data
          },
          fullResponse: true
        });
        log(chalk`response {yellow ${res.statusCode}}`);

        if (res.statusCode > 210) {
          return `Failed to upload: ${res.body}`;
        }
      } else {
        throw Error("Bad idmap!");
      }
    }

    get localpath() {
      return this._localpath || path.join(exports.configObject.repodir, this.subproject || "", "silo-rules", this.name + ".json");
    }

    async resolve() {
      let preset = await this.resolveField(Preset, "preset", false); //log(preset);

      let pNext = await this.resolveField(Rule, "passNext", false);
      let eNext = await this.resolveField(Rule, "errorNext", false);
      let proType = await this.resolveField(Provider, "providerType", false); //log("Dynamic nexts")

      let dynamicNexts = await this.resolveField(Rule, "dynamicNexts", true); //log(dynamicNexts);

      let enterNotif = await this.resolveField(Notification, "enterNotifications", true);
      let errorNotif = await this.resolveField(Notification, "errorNotifications", true);
      let passNotif = await this.resolveField(Notification, "passNotifications", true); //TODO Unsupported

      delete this.relationships["enterMetadata"];
      delete this.relationships["errorMetadata"];
      this.isGeneric = true;
      return {
        preset,
        proType,
        pNext,
        eNext,
        dynamicNexts,
        errorNotif,
        enterNotif,
        passNotif
      };
    }

    chalkPrint(pad = true) {
      let id = String("R-" + (this.remote && this.remote + "-" + this.id || "LOCAL"));
      let sub = "";

      if (this.subproject) {
        sub = chalk`{yellow ${this.subproject}}`;
      }

      if (pad) id = id.padStart(10);

      try {
        return chalk`{green ${id}}: ${sub}{blue ${this.name}}`;
      } catch (e) {
        return this.data;
      }
    }

  }

  defineAssoc(Rule, "name", "data.attributes.name");
  defineAssoc(Rule, "description", "data.attributes.description");
  defineAssoc(Rule, "id", "data.id");
  defineAssoc(Rule, "relationships", "data.relationships");
  defineAssoc(Rule, "isGeneric", "meta.isGeneric");
  defineAssoc(Rule, "remote", "meta.remote");
  defineAssoc(Rule, "subproject", "meta.project");
  defineAssoc(Rule, "idMap", "meta.idMap");
  Rule.endpoint = "workflowRules";

  const inquirer = importLazy("inquirer");
  const readdir = importLazy("recursive-readdir");
  let hasAutoCompletePrompt = false;
  function addAutoCompletePrompt() {
    if (hasAutoCompletePrompt) return;
    hasAutoCompletePrompt = true;
    inquirer.registerPrompt("autocomplete", require("inquirer-autocomplete-prompt"));
  }
  async function loadLocals(path$$1, Class) {
    let basePath = exports.configObject.repodir;
    let objs = (await readdir(basePath)).filter(name => name.includes(path$$1)).filter(name => !path.basename(name).startsWith(".")).map(name => new Class({
      path: name
    }));
    return objs;
  }
  async function selectLocal(path$$1, typeName, Class, canSelectNone = true) {
    addAutoCompletePrompt();
    let objs = await loadLocals(path$$1, Class);
    let objsMap = objs.map(x => ({
      name: x.chalkPrint(true),
      value: x
    }));
    return await selectLocalMenu(objsMap, typeName, canSelectNone);
  }
  async function selectLocalMenu(objs, typeName, canSelectNone = true) {
    let none = {
      name: chalk`      {red None}: {red None}`,
      value: null
    };
    if (canSelectNone) objs.unshift(none);
    let q = await inquirer.prompt([{
      type: "autocomplete",
      name: "obj",
      message: `What ${typeName} do you want?`,
      source: async (sofar, input) => {
        return objs.filter(x => input ? x.name.toLowerCase().includes(input.toLowerCase()) : true);
      }
    }]);
    return q.obj;
  }
  async function selectPreset({
    purpose = "preset",
    canSelectNone
  }) {
    return selectLocal("silo-presets", purpose, Preset, canSelectNone);
  }
  async function askInput(question, def) {
    return (await inquirer.prompt([{
      type: "input",
      name: "ok",
      message: question,
      default: def
    }])).ok;
  }
  async function askQuestion(question) {
    return (await inquirer.prompt([{
      type: "confirm",
      name: "ok",
      message: question
    }])).ok;
  }
  async function saveConfig(newConfigObject, {
    ask = true,
    print = true
  } = {}) {
    //Create readable json and make sure the user is ok with it
    let newConfig = JSON.stringify(newConfigObject, null, 4);
    if (print) log(newConfig); //-y or --set will make this not prompt

    if (ask && !(await askQuestion("Write config to disk?"))) return;
    fs.writeFileSync(exports.configFile, newConfig, {
      mode: 0o600
    });
    log(chalk`Created file {green ${exports.configFile}}.`);
  }

  class File extends RallyBase {
    constructor({
      data,
      remote,
      included,
      parent
    }) {
      super();
      this.data = data;
      this.meta = {};
      this.remote = remote;
      this.parentAsset = parent;
    }

    chalkPrint(pad = false) {
      let id = String("F-" + (this.remote && this.remote + "-" + this.id || "LOCAL"));
      if (pad) id = id.padStart(15);
      return chalk`{green ${id}}: {blue ${this.data.attributes ? this.name : "(lite file)"}} {red ${this.sizeHR}}`;
    }

    canBeDownloaded() {
      return this.sizeGB <= .2;
    }

    async getContent(force = false, noRedirect = false) {
      if (!this.canBeDownloaded() && !force) {
        throw new FileTooLargeError(this);
      }

      let d = lib.makeAPIRequest({
        env: this.remote,
        fullPath: this.contentLink,
        qs: {
          "no-redirect": noRedirect
        }
      });

      if (noRedirect) {
        return (await d).links.content;
      } else {
        return d;
      }
    }

    async delete(remove = true) {
      return lib.makeAPIRequest({
        env: this.remote,
        fullPath: this.selfLink,
        method: "DELETE"
      });
    }

    get size() {
      return Object.values(this.data.attributes.instances)[0].size;
    }

    get sizeGB() {
      return Math.round(this.size / 1024 / 1024 / 1024 * 10) / 10;
    }

    get sizeHR() {
      let units = ["B", "K", "M", "G", "T"];
      let unitIdx = 0;
      let size = this.size;

      while (size > 1000) {
        size /= 1024;
        unitIdx++;
      }

      if (size > 100) {
        size = Math.round(size);
      } else {
        size = Math.round(size * 10) / 10;
      }

      return size + units[unitIdx];
    }

    get instancesList() {
      let instances = [];

      for (let [key, val] of Object.entries(this.instances)) {
        let n = {
          id: key
        };
        Object.assign(n, val);
        instances.push(n);
      }

      return instances;
    }

    static rslURL(instance) {
      return `rsl://${instance.storageLocationName}/${instance.name}`;
    }

  }

  defineAssoc(File, "id", "data.id");
  defineAssoc(File, "name", "data.attributes.label");
  defineAssoc(File, "contentLink", "data.links.content");
  defineAssoc(File, "selfLink", "data.links.self");
  defineAssoc(File, "label", "data.attributes.label");
  defineAssoc(File, "md5", "data.attributes.md5");
  defineAssoc(File, "sha512", "data.attributes.sha512");
  defineAssoc(File, "tags", "data.attributes.tagList");
  defineAssoc(File, "instances", "data.attributes.instances");
  File.endpoint = null;

  async function findLineInFile(renderedPreset, lineNumber) {
    let trueFileLine = lineNumber;
    let linedRenderedPreset = renderedPreset.split("\n").slice(2, -2);
    renderedPreset = renderedPreset.split("\n").slice(2, -2).join("\n");
    let includeLocation = renderedPreset.split("\n").filter(x => x.includes("@include"));
    let endIncludeNumber = -1,
        addTabDepth = 2;
    let lineBeforeIncludeStatement = '';
    let withinInclude = true;

    if (lineNumber > linedRenderedPreset.indexOf(includeLocation[includeLocation.length - 1])) {
      addTabDepth = 0;
      withinInclude = false;
    }

    for (let index = includeLocation.length - 1; index >= 0; index--) {
      let currIncludeIndex = linedRenderedPreset.indexOf(includeLocation[index]);
      let tabDepth = includeLocation[index].split("  ").length;

      if (lineNumber > currIncludeIndex) {
        if (includeLocation[index].split(" ").filter(Boolean)[1] != "ERROR:") {
          if (lineBeforeIncludeStatement.split("  ").length == tabDepth && withinInclude) {
            trueFileLine = trueFileLine - currIncludeIndex;
            break;
          } else if (lineBeforeIncludeStatement.split("  ").length + addTabDepth == tabDepth && endIncludeNumber == -1) {
            endIncludeNumber = currIncludeIndex;
          } else if (lineBeforeIncludeStatement.split("  ").length + addTabDepth == tabDepth) {
            trueFileLine = trueFileLine - (endIncludeNumber - currIncludeIndex);
            endIncludeNumber = -1;
          }
        }
      } else {
        lineBeforeIncludeStatement = includeLocation[index];
      }
    }

    let funcLine = "";

    for (let line of linedRenderedPreset.slice(0, lineNumber).reverse()) {
      let match = /def (\w+)/.exec(line);

      if (match) {
        funcLine = match[1];
        break;
      }
    }

    let includeFilename;

    if (lineBeforeIncludeStatement != "") {
      includeFilename = lineBeforeIncludeStatement.slice(1).trim().slice(14, -1);
    } else {
      includeFilename = null;
    }

    if (includeLocation.length !== 0) {
      trueFileLine -= 1;
      lineNumber -= 1;
    }

    return {
      lineNumber: trueFileLine,
      includeFilename,
      line: linedRenderedPreset[lineNumber],
      funcLine
    };
  }
  function printOutLine(eLine) {
    return log(chalk`{blue ${eLine.includeFilename || "Main"}}:{green ${eLine.lineNumber}} in ${eLine.funcLine}
${eLine.line}`);
  }
  async function getArtifact(env, artifact, jobid) {
    let path$$1 = `/jobs/${jobid}/artifacts/${artifact}`;
    let art = lib.makeAPIRequest({
      env,
      path: path$$1
    }).catch(_ => null);
    return await art;
  }
  async function getInfo(env, jobid) {
    let trace = getArtifact(env, "trace", jobid);
    let renderedPreset = getArtifact(env, "preset", jobid);
    let result = getArtifact(env, "result", jobid);
    let error = getArtifact(env, "error", jobid);
    let output = getArtifact(env, "output", jobid);
    [trace, renderedPreset, result, output, error] = await Promise.all([trace, renderedPreset, result, output, error]);
    return {
      trace,
      renderedPreset,
      result,
      output,
      error
    };
  }
  const tracelineRegex = /^(?:[\d.]+) ([\w ]+):(\d+): (.+)/;
  function parseTraceLine(line) {
    let info = tracelineRegex.exec(line);

    if (!info) {
      return {
        full: line,
        parsed: false,
        content: line
      };
    }

    return {
      absoluteTime: info[0],
      presetName: info[1],
      lineNumber: info[2],
      text: info[3],
      content: info[3],
      full: line,
      parsed: true
    };
  }
  async function parseTrace(env, jobid) {
    let {
      trace,
      renderedPreset
    } = await getInfo(env, jobid);
    let errorLines = [];
    let shouldBreak = 0;

    for (let tr of trace.split("\n\n").reverse()) {
      errorLines.push(tr);
      shouldBreak--;
      if (tr.includes("Exception")) shouldBreak = 1;
      if (tr.includes("raised")) shouldBreak = 1;
      if (!shouldBreak) break;
    }

    let errorList = [];

    for (let errLine of errorLines) {
      let info = parseTraceLine(errLine);

      if (!info.parsed) {
        errorList.push((await findLineInFile(renderedPreset, info.lineNumber)));
      } else {
        errorList.push(errLine);
      }
    }

    return errorList;
  }
  const Trace = {
    parseTrace,
    printOutLine,
    getInfo,
    findLineInFile,
    getArtifact
  };

  class Asset extends RallyBase {
    constructor({
      data,
      remote,
      included,
      lite
    }) {
      super();
      this.data = data;
      this.meta = {};
      this.remote = remote;

      if (included) {
        this.meta.metadata = Asset.normalizeMetadata(included);
      }

      this.lite = !!lite;
    }

    static normalizeMetadata(payload) {
      let newMetadata = {};

      for (let md of payload) {
        if (md.type !== "metadata") continue;
        newMetadata[md.attributes.usage] = md.attributes.metadata;
      }

      return newMetadata;
    }

    async getMetadata(forceRefresh = false) {
      if (this.meta.metadata && !forceRefresh) return this.meta.metadata;
      let req = await lib.makeAPIRequest({
        env: this.remote,
        path: `/movies/${this.id}/metadata?page=1p100`
      });
      return this.meta.metadata = Asset.normalizeMetadata(req.data);
    }

    async patchMetadata(metadata) {
      if (metadata.Workflow) {
        //FIXME
        //Currently, WORKFLOW_METADATA cannot be patched via api: we need to
        //start a ephemeral eval to upload it
        let md = JSON.stringify(JSON.stringify(metadata.Workflow));
        let fakePreset = {
          code: `WORKFLOW_METADATA.update(json.loads(${md}))`
        };
        await this.startEphemeralEvaluateIdeal(fakePreset);
        log("WFMD Patched using ephemeralEval");
      }

      if (metadata.Metadata) {
        let req = await lib.makeAPIRequest({
          env: this.remote,
          path: `/movies/${this.id}/metadata/Metadata`,
          method: "PATCH",
          payload: {
            "data": {
              "type": "metadata",
              "attributes": {
                "metadata": metadata.Metadata
              }
            }
          }
        });
        log("MD Patched");
      }
    }

    static lite(id, remote) {
      return new this({
        data: {
          id
        },
        remote,
        lite: true
      });
    }

    chalkPrint(pad = false) {
      let id = String("A-" + (this.remote && this.remote + "-" + this.id || "LOCAL"));
      if (pad) id = id.padStart(15);
      return chalk`{green ${id}}: {blue ${this.data.attributes ? this.name : "(lite asset)"}}`;
    }

    static async createNew(name, env) {
      let req = await lib.makeAPIRequest({
        env,
        path: "/assets",
        method: "POST",
        payload: {
          data: {
            attributes: {
              name
            },
            type: "assets"
          }
        }
      });
      return new this({
        data: req.data,
        remote: env
      });
    }

    async delete() {
      let req = await lib.makeAPIRequest({
        env: this.remote,
        path: "/assets/" + this.id,
        method: "DELETE"
      });
    }

    async getFiles(refresh = false) {
      if (this._files && !refresh) return this._files;
      let req = await lib.indexPathFast({
        env: this.remote,
        path: `/assets/${this.id}/files`,
        method: "GET"
      }); //return req;

      return this._files = new Collection(req.map(x => new File({
        data: x,
        remote: this.remote,
        parent: this
      })));
    }

    async addFile(label, fileuris) {
      if (!Array.isArray(fileuris)) fileuris = [fileuris];
      let instances = {};

      for (let i = 0; i < fileuris.length; i++) {
        instances[String(i + 1)] = {
          uri: fileuris[i]
        };
      }

      let req = await lib.makeAPIRequest({
        env: this.remote,
        path: "/files",
        method: "POST",
        payload: {
          "data": {
            "attributes": {
              label,
              instances
            },
            "relationships": {
              "asset": {
                "data": {
                  id: this.id,
                  "type": "assets"
                }
              }
            },
            "type": "files"
          }
        }
      });
      return req;
    }

    async startWorkflow(jobName, {
      initData,
      priority
    } = {}) {
      let attributes = {};

      if (initData) {
        //Convert init data to string
        initData = typeof initData === "string" ? initData : JSON.stringify(initData);
        attributes.initData = initData;
      }

      if (priority) {
        attributes.priority = priority;
      }

      let req = await lib.makeAPIRequest({
        env: this.remote,
        path: "/workflows",
        method: "POST",
        payload: {
          "data": {
            "type": "workflows",
            attributes,
            "relationships": {
              "movie": {
                "data": {
                  id: this.id,
                  "type": "movies"
                }
              },
              "rule": {
                "data": {
                  "attributes": {
                    "name": jobName
                  },
                  "type": "rules"
                }
              }
            }
          }
        }
      });
      return req;
    }

    static async startAnonWorkflow(env, jobName, {
      initData,
      priority
    } = {}) {
      let attributes = {};

      if (initData) {
        //Convert init data to string
        initData = typeof initData === "string" ? initData : JSON.stringify(initData);
        attributes.initData = initData;
      }

      if (priority) {
        attributes.priority = priority;
      }

      let req = await lib.makeAPIRequest({
        env,
        path: "/workflows",
        method: "POST",
        payload: {
          "data": {
            "type": "workflows",
            attributes,
            "relationships": {
              "rule": {
                "data": {
                  "attributes": {
                    "name": jobName
                  },
                  "type": "rules"
                }
              }
            }
          }
        }
      });
      return req;
    }

    async startEphemeralEvaluateIdeal(preset, dynamicPresetData, isBinary = false) {
      let res;
      const env = this.remote;
      let provider = await Provider.getByName(this.remote, "SdviEvaluate");
      write(chalk`Starting ephemeral evaluate on ${this.chalkPrint(false)}...`); // Fire and forget.

      let evalInfo = await lib.makeAPIRequest({
        env: this.remote,
        path: "/jobs",
        method: "POST",
        payload: {
          data: {
            attributes: {
              category: provider.category,
              providerTypeName: provider.name,
              rallyConfiguration: {},
              //we need to strip invalid utf8 characters from the
              //buffer before we encode it or the sdvi backend dies
              providerData: Buffer.from(preset.code, isBinary && "binary" || "utf8").toString("base64"),
              dynamicPresetData
            },
            type: "jobs",
            relationships: {
              movie: {
                data: {
                  id: this.id,
                  type: "movies"
                }
              }
            }
          }
        }
      });
      write(" Waiting for finish...\n");
      let dots = 0;

      for (;;) {
        res = await lib.makeAPIRequest({
          env,
          path_full: evalInfo.data.links.self
        });
        write(`\r${res.data.attributes.state}${".".repeat(dots++)}         `);

        if (dots === 5) {
          dots = 1;
        }

        if (res.data.attributes.state == "Complete") {
          write(chalk`{green  Done}...\n`);
          break;
        }

        await sleep(500);
      }

      return;
    }

    async startEvaluate(presetid, dynamicPresetData) {
      // Fire and forget.
      let data = await lib.makeAPIRequest({
        env: this.remote,
        path: "/jobs",
        method: "POST",
        payload: {
          data: {
            type: "jobs",
            attributes: {
              dynamicPresetData
            },
            relationships: {
              movie: {
                data: {
                  id: this.id,
                  type: "movies"
                }
              },
              preset: {
                data: {
                  id: presetid,
                  type: "presets"
                }
              }
            }
          }
        }
      });
      return data;
    }

    async rename(newName) {
      let req = await lib.makeAPIRequest({
        env: this.remote,
        path: `/assets/${this.id}`,
        method: "PATCH",
        payload: {
          data: {
            attributes: {
              name: newName
            },
            type: "assets"
          }
        }
      });
      this.name = newName;
      return req;
    }

    async migrate(targetEnv) {
      exports.configObject.globalProgress = false;
      log(`Creating paired file in ${targetEnv}`); //Fetch metadata in parallel, we await it later

      let _mdPromise = this.getMetadata();

      let targetAsset = await Asset.getByName(targetEnv, this.name);

      if (targetAsset) {
        log(`Asset already exists ${targetAsset.chalkPrint()}`); //if(configObject.script) process.exit(10);
      } else {
        targetAsset = await Asset.createNew(this.name, targetEnv);
        log(`Asset created ${targetAsset.chalkPrint()}`);
      } //wait for metadata to be ready before patching


      await _mdPromise;
      log("Adding asset metadata");
      await targetAsset.patchMetadata(this.md);
      let fileCreations = [];

      for (let file of await this.getFiles()) {
        let possibleInstances = {}; //Check for any valid copy-able instances

        for (let inst of file.instancesList) {
          //We need to skip internal files
          if (inst.storageLocationName === "Rally Platform Bucket") continue;
          log(`Adding file: ${file.chalkPrint()}`);

          possibleInstances[inst.storageLocationName] = () => targetAsset.addFileInstance(file, inst);
        }

        if (Object.values(possibleInstances).length > 1) {
          //prioritize archive is possible
          if (possibleInstances["Archive"]) {
            log("Hit archive prioritizer");
            fileCreations.push(possibleInstances["Archive"]);
          } else {
            fileCreations.push(...Object.values(possibleInstances));
          }
        } else {
          fileCreations.push(...Object.values(possibleInstances));
        }
      }

      await Promise.all(fileCreations.map(x => x()));
    }

    async addFileInstance(file, inst, tagList = []) {
      let newInst = {
        uri: File.rslURL(inst),
        name: inst.name,
        size: inst.size,
        lastModified: inst.lastModified,
        storageLocationName: inst.storageLocationName
      };
      let instances = {};
      instances[String(Math.floor(Math.random() * 100000 + 1))] = newInst;
      let request = lib.makeAPIRequest({
        env: this.remote,
        path: `/files`,
        method: "POST",
        payload: {
          data: {
            type: "files",
            attributes: {
              label: file.label,
              tagList,
              instances
            },
            relationships: {
              asset: {
                data: {
                  id: this.id,
                  type: "assets"
                }
              }
            }
          }
        }
      });

      try {
        let fileData = await request;
        let newFile = new File({
          data: fileData.data,
          remote: this.remote,
          parent: this
        });
        if (exports.configObject.script) console.log(inst.uri, newFile.instancesList[0].uri);
      } catch (e) {
        log(chalk`{red Failed file: ${file.chalkPrint()}}`);
      }
    }

    async downloadFile(label, destFolder) {
      let files = await this.getFiles();
      let file = files.findByName(label);
      let c = await file.getContent();

      if (destFolder) {
        let filePath = path__default.join(destFolder, file.instancesList[0].name);
        fs__default.writeFileSync(filePath, c);
      } else {
        console.log(c);
      }
    }

    async deleteFile(label) {
      let files = await this.getFiles();
      let file = files.findByName(label);
      if (!file) return false;
      await file.delete(false); //mode=forget

      return true;
    }

    async listJobs() {
      let jobs = await lib.indexPathFast({
        env: this.remote,
        path: "/jobs",
        qs: {
          filter: `movieId=${this.id}`
        }
      });

      for (let e of jobs) {
        if (!e.relationships.preset.data) continue;
        let preset = await Preset.getById(this.remote, e.relationships.preset.data.id);
        let rule = await Rule.getById(this.remote, e.relationships.workflowRule.data.id);
        log("Preset", preset.name);
        log("Rule", rule.name);
      }
    } //get all artifacts of type `artifact` from this asset


    artifactsList(artifact) {
      var _this = this;

      return _wrapAsyncGenerator(function* () {
        function reorderPromises(_x) {
          return _reorderPromises.apply(this, arguments);
        }

        function _reorderPromises() {
          _reorderPromises = _wrapAsyncGenerator(function* (p) {
            ////yield in order we got it
            //yield* p[Symbol.iterator]();
            ////yield in order of first to finish
            //yield* unordered(p);
            //yield in chronological order
            let k = yield _awaitAsyncGenerator(Promise.all(p));
            yield* _asyncGeneratorDelegate(_asyncIterator(k.sort(([e1, _a], [e2, _b]) => {
              return e1.attributes.completedAt - e2.attributes.completedAt;
            })), _awaitAsyncGenerator);
          });
          return _reorderPromises.apply(this, arguments);
        }

        elog("Reading jobs...");
        let r = yield _awaitAsyncGenerator(lib.indexPathFast({
          env: _this.remote,
          path: "/jobs",
          qs: {
            filter: `movieId=${_this.id}`
          }
        }));
        elog("Getting job artifacts..."); //let evals = r.filter(x => x.attributes.providerTypeName === "SdviEvaluate");

        let evals = r;
        let zipped = evals.map(async x => [x, await getArtifact(_this.remote, artifact, x.id)]);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;

        var _iteratorError;

        try {
          for (var _iterator = _asyncIterator(reorderPromises(zipped)), _step, _value; _step = yield _awaitAsyncGenerator(_iterator.next()), _iteratorNormalCompletion = _step.done, _value = yield _awaitAsyncGenerator(_step.value), !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
            let x = _value;
            yield x;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              yield _awaitAsyncGenerator(_iterator.return());
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      })();
    }

    async grep(text, {
      artifact = "trace",
      nameOnly = false,
      ordering = null
    }) {
      function highlight(line, text) {
        let parts = line.split(text);
        return parts.join(chalk`{blue ${text}}`);
      }

      function parseLine(x) {
        if (artifact === "trace") {
          return parseTraceLine(x);
        } else {
          //fake the output from parseTraceLine to make it look right
          return {
            content: x
          };
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;

      var _iteratorError2;

      try {
        for (var _iterator2 = _asyncIterator(this.artifactsList(artifact)), _step2, _value2; _step2 = await _iterator2.next(), _iteratorNormalCompletion2 = _step2.done, _value2 = await _step2.value, !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
          let [e, trace] = _value2;
          if (!trace) continue;
          let lines = trace.split("\n").map(parseLine);
          let matching = lines.filter(x => x.content.includes(text));

          if (matching.length > 0) {
            let preset = await Preset.getById(this.remote, e.relationships.preset.data.id);

            if (nameOnly) {
              log(chalk`{red ${preset.name}} ${e.id} {blue ${matching.length}} matche(s) ${e.attributes.completedAt}`);
            } else if (exports.configObject.rawOutput) {
              console.log(matching.map(x => chalk`{red ${preset.name}}:${highlight(x.content, text)}`).join("\n"));
            } else {
              log(chalk`{red ${preset.name}} ${e.id} ${moment(e.attributes.completedAt)}`);
              log(matching.map(x => `  ${highlight(x.content, text)}`).join("\n"));
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            await _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }

    async replay() {
      function colorRequest(id) {
        if (id <= 299) {
          return chalk`{green ${id}}`;
        } else if (id <= 399) {
          return chalk`{blue ${id}}`;
        } else if (id <= 499) {
          return chalk`{red ${id}}`;
        } else if (id <= 599) {
          return chalk`{cyan ${id}}`;
        } else {
          throw new Error("failed to create color from id");
        }
      }

      let worstRegexEver = /^@Request (?<type>\w+) (?<url>.+)$[\n\r]+^(?<time>.+)$[\S\s]+?^(?<request>\{[\S\s]+?^\})?[\S\s]+?^@Response (?<statusCode>\d+)$[\S\s]+?^(?<response>\{[\S\s]+?^\})?[\S\s]+?={61}/gm;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;

      var _iteratorError3;

      try {
        for (var _iterator3 = _asyncIterator(this.artifactsList("output")), _step3, _value3; _step3 = await _iterator3.next(), _iteratorNormalCompletion3 = _step3.done, _value3 = await _step3.value, !_iteratorNormalCompletion3; _iteratorNormalCompletion3 = true) {
          let [e, trace] = _value3;
          if (!trace) continue;
          let preset = await Preset.getById(this.remote, e.relationships.preset.data.id);
          log(chalk`{red ${preset.name}}`);

          for (let request of trace.matchAll(worstRegexEver)) {
            //log(request);
            {
              let r = request.groups;
              log(chalk`Request: ${r.type} ${r.url} returned ${colorRequest(r.statusCode)}`);
            }
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            await _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }

    async analyze() {
      await lib.makeAPIRequest({
        env: this.remote,
        path: "/v1.0/analysis",
        method: "POST",
        payload: {
          "movieId": this.id,
          "latestVersion": true
        }
      });
    }

  }

  defineAssoc(Asset, "id", "data.id");
  defineAssoc(Asset, "name", "data.attributes.name");
  defineAssoc(Asset, "remote", "meta.remote");
  defineAssoc(Asset, "md", "meta.metadata");
  defineAssoc(Asset, "lite", "meta.lite");
  Asset.endpoint = "movies";

  let exists = {};

  class Preset extends RallyBase {
    constructor({
      path: path$$1,
      remote,
      data,
      subProject
    } = {}) {
      // Get full path if possible
      if (path$$1) {
        path$$1 = path.resolve(path$$1);

        if (path.dirname(path$$1).includes("silo-metadata")) {
          throw new AbortError("Constructing preset from metadata file");
        }
      }

      super(); // Cache by path

      if (path$$1) {
        if (exists[pathTransform(path$$1)]) return exists[pathTransform(path$$1)];
        exists[pathTransform(path$$1)] = this;
      }

      this.meta = {};
      this.subproject = subProject;
      this.remote = remote;

      if (lib.isLocalEnv(this.remote)) {
        if (path$$1) {
          this.path = path$$1;
          let pathspl = this.path.split(".");
          this.ext = pathspl[pathspl.length - 1];

          try {
            this.code = this.getLocalCode();
          } catch (e) {
            if (e.code === "ENOENT" && exports.configObject.ignoreMissing) {
              this.missing = true;
              return undefined;
            } else {
              log(chalk`{red Node Error} ${e.message}`);
              throw new AbortError("Could not load code of local file");
            }
          }

          let name = this.parseFilenameForName() || this.parseCodeForName();

          try {
            this.data = this.getLocalMetadata();
            this.isGeneric = true;
            name = this.name;
          } catch (e) {
            log(chalk`{yellow Warning}: ${path$$1} does not have a readable metadata file! Looking for ${this.localmetadatapath}`);
            this.data = Preset.newShell(name);
            this.isGeneric = false;
          }

          this.name = name;
        } else {
          this.data = Preset.newShell();
        }
      } else {
        this.data = data; //this.name = data.attributes.name;
        //this.id = data.id;

        this.isGeneric = false;
      }

      delete this.data.attributes.rallyConfiguration;
      delete this.data.attributes.systemManaged;
      delete this.data.meta;
    } //Given a metadata file, get its actual file


    static async fromMetadata(path$$1, subproject) {
      let data;

      try {
        data = JSON.parse(readFileSync(path$$1));
      } catch (e) {
        if (e.code === "ENOENT" && exports.configObject.ignoreMissing) {
          return null;
        } else {
          throw e;
        }
      }

      let providerType = data.relationships.providerType.data.name;
      let provider = await Provider.getByName("DEV", providerType);

      if (!provider) {
        log(chalk`{red The provider type {green ${providerType}} does not exist}`);
        log(chalk`{red Skipping {green ${path$$1}}.}`);
        return null;
      }

      let ext = await provider.getFileExtension();
      let name = data.attributes.name;
      let realpath = Preset.getLocalPath(name, ext, subproject);
      return new Preset({
        path: realpath,
        subProject: subproject
      });
    }

    static newShell(name = undefined) {
      return {
        "attributes": {
          "providerSettings": {
            "PresetName": name
          }
        },
        "relationships": {},
        "type": "presets"
      };
    }

    cleanup() {
      super.cleanup();
      delete this.attributes["createdAt"];
      delete this.attributes["updatedAt"];
    }

    async acclimatize(env) {
      if (!this.isGeneric) throw new AbortError("Cannot acclimatize non-generics or shells");
      let providers = await Provider.getAll(env);
      let ptype = this.relationships["providerType"];
      ptype = ptype.data;
      let provider = providers.findByName(ptype.name);
      ptype.id = provider.id;
    }

    get test() {
      if (!this.code) return [];
      const regex = /[^-]autotest:\s?([\w\d_\-. \/]+)[\r\s\n]*?/gm;
      let match;
      let matches = [];

      while (match = regex.exec(this.code)) {
        matches.push(match[1]);
      }

      return matches;
    }

    async runTest(env) {
      let remote = await Preset.getByName(env, this.name);

      for (let test of this.test) {
        log("Tests...");
        let asset;

        if (test.startsWith("id")) {
          let match = /id:\s*(\d+)/g.exec(test);

          if (!match) {
            log(chalk`{red Could not parse autotest} ${test}.`);
            throw new AbortError("Could not properly parse the preset header");
          }

          asset = await Asset.getById(env, match[1]);
        } else {
          asset = await Asset.getByName(env, test);
        }

        if (!asset) {
          log(chalk`{yellow No movie found}, skipping test.`);
          continue;
        }

        log(chalk`Starting job {green ${this.name}} on ${asset.chalkPrint(false)}... `);
        await asset.startEvaluate(remote.id, {
          "uploadPresetName": this.name
        });
      }
    }

    async resolve() {
      if (this.isGeneric) return;
      let proType = await this.resolveField(Provider, "providerType");
      this.ext = await proType.getFileExtension();
      this.isGeneric = true;
      return {
        proType
      };
    }

    async saveLocal() {
      await this.saveLocalMetadata();
      await this.saveLocalFile();
    }

    async saveLocalMetadata() {
      if (!this.isGeneric) {
        await this.resolve();
        this.cleanup();
      }

      writeFileSync(this.localmetadatapath, JSON.stringify(this.data, null, 4));
    }

    async saveLocalFile() {
      writeFileSync(this.localpath, this.code || "");
    }

    async uploadRemote(env, shouldTest = true) {
      await this.uploadCodeToEnv(env, true, shouldTest);
    }

    async save(env, shouldTest = true) {
      this.saved = true;

      if (!this.isGeneric) {
        await this.resolve();
      }

      this.cleanup();

      if (lib.isLocalEnv(env)) {
        log(chalk`Saving preset {green ${this.name}} to {blue ${lib.envName(env)}}.`);
        await this.saveLocal();
      } else {
        await this.uploadRemote(env, shouldTest);
      }
    }

    async downloadCode() {
      var _this$data$links;

      if (!this.remote || this.code) return this.code;
      let pdlink = (_this$data$links = this.data.links) === null || _this$data$links === void 0 ? void 0 : _this$data$links.providerData;
      if (!pdlink) return this.code = "";
      let code = await lib.makeAPIRequest({
        env: this.remote,
        path_full: pdlink,
        json: false
      }); //match header like 
      // # c: d
      // # b
      // # a
      // ##################

      let headerRegex = /(^# .+[\r\n]+)+#+[\r\n]+/gim;
      let hasHeader = headerRegex.exec(code);

      if (hasHeader) {
        this.header = code.substring(0, hasHeader[0].length - 1);
        code = code.substring(hasHeader[0].length);
      }

      return this.code = code;
    }

    get code() {
      if (this._code) return this._code;
    }

    set code(v) {
      this._code = v;
    }

    chalkPrint(pad = true) {
      let id = String("P-" + (this.remote && this.remote + "-" + this.id || "LOCAL"));
      let sub = "";

      if (this.subproject) {
        sub = chalk`{yellow ${this.subproject}}`;
      }

      if (pad) id = id.padStart(10);

      if (this.name == undefined) {
        return chalk`{green ${id}}: ${sub}{red ${this.path}}`;
      } else if (this.meta.proType) {
        return chalk`{green ${id}}: ${sub}{red ${this.meta.proType.name}} {blue ${this.name}}`;
      } else {
        return chalk`{green ${id}}: ${sub}{blue ${this.name}}`;
      }
    }

    parseFilenameForName() {
      if (this.path.endsWith(".jinja") || this.path.endsWith(".json")) {
        return path.basename(this.path).replace("_", " ").replace("-", " ").replace(".json", "").replace(".jinja", "");
      }
    }

    parseCodeForName() {
      const name_regex = /name\s*:\s*([\w\d. \/_]+)\s*$/gim;
      const match = name_regex.exec(this.code);
      if (match) return match[1];
    }

    findStringsInCode(strings) {
      if (!this.code) return [];
      return strings.filter(str => {
        let regex = new RegExp(str);
        return !!this.code.match(regex);
      });
    }

    static getLocalPath(name, ext, subproject) {
      return this._localpath || path__default.join(exports.configObject.repodir, subproject || "", "silo-presets", name + "." + ext);
    }

    get localpath() {
      return Preset.getLocalPath(this.name, this.ext, this.subproject);
    }

    get path() {
      if (this._path) return this._path;
    }

    set path(val) {
      this._path = val;
    }

    get name() {
      return this._nameOuter;
    }

    set name(val) {
      if (!this._nameInner) this._nameInner = val;
      this._nameOuter = val;
    }

    set providerType(value) {
      this.relationships["providerType"] = {
        data: { ...value,
          type: "providerTypes"
        }
      };
    }

    get localmetadatapath() {
      if (this.path) {
        return this.path.replace("silo-presets", "silo-metadata").replace(new RegExp(this.ext + "$"), "json");
      }

      return path__default.join(exports.configObject.repodir, this.subproject || "", "silo-metadata", this.name + ".json");
    }

    get immutable() {
      return this.name.includes("Constant") && !exports.configObject.updateImmutable;
    }

    async convertImports() {}

    async convertIncludes() {}

    isEval() {
      return this.providerName === "SdviEvaluate" || this.providerName === "SdviEvalPro";
    }

    async uploadPresetData(env, id) {
      if (this.code.trim() === "NOUPLOAD") {
        write(chalk`code skipped {yellow :)}, `); // Not an error, so return null

        return null;
      }

      let code = this.code;
      let headers = {}; //if(this.isEval()){
      //let crt = 0;
      //code = code.split("\n").map(line => {
      //crt += 1
      //if(line.trim().endsWith("\\")) return line;
      //return [
      //line,
      //`# this ^^ is ${this.name}:${crt}`,
      //]
      //}).flat().join("\n");
      //}

      if (!exports.configObject.skipHeader && this.isEval()) {
        write(chalk`generate header, `);
        let repodir = exports.configObject.repodir;
        let localpath;

        if (this.path) {
          localpath = this.path.replace(repodir, "");
          if (localpath.startsWith("/")) localpath = localpath.substring(1);
        } else {
          localpath = "Other Silo";
        }

        try {
          let {
            stdout: headerText
          } = await spawn({
            noecho: true
          }, "sh", [path__default.join(exports.configObject.repodir, `bin/header.sh`), moment(Date.now()).format("ddd YYYY/MM/DD hh:mm:ssa"), localpath]);
          code = headerText + code;
          write(chalk`header ok, `);
        } catch (e) {
          write(chalk`missing unix, `);
        }
      } //binary presets


      if (this.providerName == "Vantage") {
        code = Buffer.from(code).toString("base64");
        headers["Content-Transfer-Encoding"] = "base64";
      }

      let res = await lib.makeAPIRequest({
        env,
        path: `/presets/${id}/providerData`,
        body: code,
        method: "PUT",
        fullResponse: true,
        timeout: 10000,
        headers
      });
      write(chalk`code up {yellow ${res.statusCode}}, `);
    }

    async grabMetadata(env) {
      let remote = await Preset.getByName(env, this.name);
      this.isGeneric = false;

      if (!remote) {
        throw new AbortError(`No file found on remote ${env} with name ${this.name}`);
      }

      this.data = remote.data;
      this.remote = env;
    }

    async deleteRemoteVersion(env, id = null) {
      if (lib.isLocalEnv(env)) return false;

      if (!id) {
        let remote = await Preset.getByName(env, this.name);
        id = remote.id;
      }

      return await lib.makeAPIRequest({
        env,
        path: `/presets/${id}`,
        method: "DELETE"
      });
    }

    async delete() {
      if (lib.isLocalEnv(this.remote)) return false;
      return await this.deleteRemoteVersion(this.remote, this.id);
    }

    async uploadCodeToEnv(env, includeMetadata, shouldTest = true) {
      if (!this.name) {
        let match;

        if (match = /^(#|["']{3})\s*EPH (\d+)/.exec(this.code.trim())) {
          let a = await Asset.getById(env, Number(match[2]));
          return a.startEphemeralEvaluateIdeal(this);
        } else {
          log(chalk`Failed uploading {red ${this.path}}. No name found.`);
          return "Missing Name";
        }
      }

      write(chalk`Uploading preset {green ${this.name}} to {green ${env}}: `);

      if (this.immutable) {
        log(chalk`{magenta IMMUTABLE}. Nothing to do.`);
        return "Immutable Preset";
      } //First query the api to see if this already exists.


      let remote = await Preset.getByName(env, this.name);
      let uploadResult = null;

      if (remote) {
        //If it exists we can replace it
        if (includeMetadata) {
          let payload = {
            data: {
              attributes: this.data.attributes,
              type: "presets"
            }
          };
          payload.data.relationships = {};

          if (this.relationships.providerType) {
            payload.data.relationships.providerType = this.relationships.providerType;
            let dt = payload.data.relationships.providerType;
            write(chalk`query type, `);
            let ptid = await Provider.getByName(env, dt.data.name);
            write(chalk`({gray ${ptid.name}}) ok, `);
            dt.data.id = ptid.data.id;
          } else {
            write("replace (simple), ");
          }

          if (this.providerName === "SdviEvalPro") {
            log("givin it a name,");
            let oldName = this.attributes.providerDataFilename;

            if (!oldName) {
              this.attributes.providerDataFilename = this.name + ".py";
            }
          }

          let res = await lib.makeAPIRequest({
            env,
            path: `/presets/${remote.id}`,
            method: "PUT",
            payload,
            fullResponse: true
          });
          write(chalk`metadata {yellow ${res.statusCode}}, `);

          if (res.statusCode >= 400) {
            log(chalk`skipping code upload, did not successfully upload metadata`);
            return "Metadata Upload Failed";
          }
        }

        uploadResult = await this.uploadPresetData(env, remote.id);
      } else {
        write("create, ");
        let metadata = {
          data: this.data
        };

        if (!this.relationships["providerType"]) {
          throw new AbortError("Cannot acclimatize shelled presets. (try creating it on the env first)");
        }

        await this.acclimatize(env);
        write("Posting to create preset... ");
        let res = await lib.makeAPIRequest({
          env,
          path: `/presets`,
          method: "POST",
          payload: metadata,
          timeout: 5000
        });
        let id = res.data.id;
        write(chalk`Created id {green ${id}}... Uploading Code... `);
        uploadResult = await this.uploadPresetData(env, id);
      }

      if (this.test[0] && shouldTest) {
        await this.runTest(env);
      } else {
        log("No tests. Done.");
      }

      return uploadResult;
    }

    getLocalMetadata() {
      return JSON.parse(readFileSync(this.localmetadatapath, "utf-8"));
    }

    getLocalCode() {
      //todo fixup for binary presets, see uploadPresetData
      return readFileSync(this.path, "utf-8");
    }

    parseHeaderInfo() {
      var _$exec$, _$exec$2, _$exec$3, _$exec$4, _$exec$5, _$exec$6, _$exec$7;

      if (!this.header) return null;
      let abs = {
        built: (_$exec$ = /Built On:(.+)/.exec(this.header)[1]) === null || _$exec$ === void 0 ? void 0 : _$exec$.trim(),
        author: (_$exec$2 = /Author:(.+)/.exec(this.header)[1]) === null || _$exec$2 === void 0 ? void 0 : _$exec$2.trim(),
        build: (_$exec$3 = /Build:(.+)/.exec(this.header)[1]) === null || _$exec$3 === void 0 ? void 0 : _$exec$3.trim(),
        version: (_$exec$4 = /Version:(.+)/.exec(this.header)[1]) === null || _$exec$4 === void 0 ? void 0 : _$exec$4.trim(),
        branch: (_$exec$5 = /Branch:(.+)/.exec(this.header)[1]) === null || _$exec$5 === void 0 ? void 0 : _$exec$5.trim(),
        commit: (_$exec$6 = /Commit:(.+)/.exec(this.header)[1]) === null || _$exec$6 === void 0 ? void 0 : _$exec$6.trim(),
        local: (_$exec$7 = /Local File:(.+)/.exec(this.header)[1]) === null || _$exec$7 === void 0 ? void 0 : _$exec$7.trim()
      };
      let tryFormats = [[true, "ddd MMM DD HH:mm:ss YYYY"], [false, "ddd YYYY/MM/DD LTS"]];

      for (let [isUTC, format] of tryFormats) {
        let date;

        if (isUTC) {
          date = moment.utc(abs.built, format);
        } else {
          date = moment(abs.built, format);
        }

        if (!date.isValid()) continue;
        abs.offset = date.fromNow();
        break;
      }

      return abs;
    }

    async printRemoteInfo(env) {
      let remote = await Preset.getByName(env, this.name);

      if (!remote) {
        log(chalk`Not found on {red ${env}}`);
        return;
      }

      await remote.downloadCode();
      let i = remote.parseHeaderInfo();

      if (i) {
        log(chalk`
                ENV: {red ${env}}, updated {yellow ~${i.offset}}
                Built on {blue ${i.built}} by {green ${i.author}}
                From ${i.build || "(unknown)"} on ${i.branch} ({yellow ${i.commit}})
                Remote Data Filename "${this.importName}"
            `.replace(/^[ \t]+/gim, "").trim());
      } else {
        log(chalk`No header on {red ${env}}`);
      }
    }

    async getInfo(envs) {
      await this.printDepends();

      for (let env of envs.split(",")) {
        await this.printRemoteInfo(env);
      }
    }

    async printDepends(indent = 0, locals = null, seen = {}) {
      let includeRegex = /@include ["'](.+)['"]/gim; //let includeRegex = /@include/g;

      let includes = [];
      let inc;

      while (inc = includeRegex.exec(this.code)) {
        includes.push(inc[1]);
      } //let includes = this.code
      //.split("\n")
      //.map(x => includeRegex.exec(x))
      //.filter(x => x)
      //.map(x => x[1]);
      //log(includes);


      if (!locals) {
        locals = new Collection((await loadLocals("silo-presets", Preset)));
      }

      log(Array(indent + 1).join(" ") + "- " + this.name);

      for (let include of includes) {
        if (seen[include]) {
          log(Array(indent + 1).join(" ") + "  - (seen) " + include);
        } else {
          seen[include] = true;
          let file = await locals.findByName(include);

          if (file) {
            await file.printDepends(indent + 2, locals, seen);
          } else {
            log(Array(indent + 1).join(" ") + "  - (miss) " + include);
          }
        }
      }
    }

  }

  defineAssoc(Preset, "_nameInner", "data.attributes.providerSettings.PresetName");
  defineAssoc(Preset, "_nameOuter", "data.attributes.name");
  defineAssoc(Preset, "_nameE2", "data.attributes.providerDataFilename");
  defineAssoc(Preset, "id", "data.id");
  defineAssoc(Preset, "importName", "data.attributes.providerDataFilename");
  defineAssoc(Preset, "attributes", "data.attributes");
  defineAssoc(Preset, "relationships", "data.relationships");
  defineAssoc(Preset, "remote", "meta.remote");
  defineAssoc(Preset, "_code", "meta.code");
  defineAssoc(Preset, "_path", "meta.path");
  defineAssoc(Preset, "isGeneric", "meta.isGeneric");
  defineAssoc(Preset, "ext", "meta.ext");
  defineAssoc(Preset, "subproject", "meta.project");
  defineAssoc(Preset, "metastring", "meta.metastring");
  defineAssoc(Preset, "providerName", "relationships.providerType.data.name");
  Preset.endpoint = "presets";

  //Move project into silo metadata
  //move autotest into silo metadata
  //

  class SupplyChain {
    constructor(startingRule, stopRule) {
      if (startingRule) {
        this.startingRule = startingRule;
        this.stopRule = stopRule;
        this.remote = startingRule.remote;
      }
    }

    async downloadPresetCode(objs = this.allPresets) {
      log("Downloading code... ");
      await lib.keepalive(objs.arr.map(x => () => x.downloadCode()));
    }

    async calculate() {
      log("Getting rules... ");
      this.allRules = await Rule.getAll(this.remote);
      log(this.allRules.length);
      log("Getting presets... ");
      this.allPresets = await Preset.getAll(this.remote);
      log(this.allPresets.length);
      log("Getting providers... ");
      this.allProviders = await Provider.getAll(this.remote);
      log(this.allProviders.length);
      log("Getting notifications... ");
      this.allNotifications = await Notification.getAll(this.remote);
      log(this.allNotifications.length);

      if (!this.startingRule) {
        this.rules = this.allRules;
        this.presets = this.allPresets;
        this.notifications = new Collection([]);
        await this.downloadPresetCode();
        return;
      } else {
        await this.downloadPresetCode();
      }

      log("Done!"); //Now we have everything we need to find a whole supply chain

      write("Calculating Supply chain... ");
      log(this.startingRule.chalkPrint());
      let allRuleNames = this.allRules.arr.map(x => x.name).filter(x => x.length >= 4);
      let allPresetNames = this.allPresets.arr.map(x => x.name).filter(x => x.length >= 4);
      let allNotifNames = this.allNotifications.arr.map(x => x.name).filter(x => x.length >= 4);
      let requiredNotifications = new Set();
      let ruleQueue = [this.startingRule];
      let presetQueue = [];

      for (let currentRule of ruleQueue) {
        if (currentRule === this.stopRule) continue;
        let {
          eNext,
          pNext,
          preset,
          passNotif,
          errorNotif,
          enterNotif
        } = await currentRule.resolve();
        passNotif.forEach(n => requiredNotifications.add(n));
        enterNotif.forEach(n => requiredNotifications.add(n));
        errorNotif.forEach(n => requiredNotifications.add(n));
        if (eNext && !ruleQueue.includes(eNext)) ruleQueue.push(eNext);
        if (pNext && !ruleQueue.includes(eNext)) ruleQueue.push(pNext);
        let neededPresets = preset.findStringsInCode(allPresetNames);
        neededPresets = neededPresets.map(x => this.allPresets.findByName(x));
        let neededRules = preset.findStringsInCode(allRuleNames);
        neededRules = neededRules.map(x => this.allRules.findByName(x));
        preset.findStringsInCode(allNotifNames).map(str => this.allNotifications.findByName(str)).forEach(notif => requiredNotifications.add(notif));
        neededPresets.push(preset);

        for (let p of neededPresets) if (!presetQueue.includes(p)) presetQueue.push(p);

        for (let p of neededRules) if (!ruleQueue.includes(p)) ruleQueue.push(p);

        if (exports.configObject.verbose) {
          write(currentRule.chalkPrint(false));
          log(":");
          write("  ");
          write(preset.chalkPrint(false));
          log(":");
          write("  Pass Next: ");
          if (pNext) write(pNext.chalkPrint(false));else write("None");
          log("");
          write("  Err  Next: ");
          if (eNext) write(eNext.chalkPrint(false));else write("None");
          log("");
          log("  Rules:");

          for (let p of neededRules) log("    " + p.chalkPrint(true));

          log("  Presets:");

          for (let p of neededPresets) log("    " + p.chalkPrint(true));

          log("\n");
        }
      }

      log("Done!");
      this.rules = new Collection(ruleQueue);
      this.presets = new Collection(presetQueue);
      requiredNotifications.delete(undefined);
      this.notifications = new Collection([...requiredNotifications]);
    }

    async log() {
      if (this.notifications.arr.length > 0) {
        log("Required notifications: ");
        this.notifications.log();
      }

      if (this.rules.arr.length > 0) {
        write("Required rules: ");
        log(this.rules.arr.length);
        this.rules.log();
      }

      if (this.presets.arr.length > 0) {
        write("Required presets: ");
        log(this.presets.arr.length);
        this.presets.log();
      }

      if (exports.configObject.rawOutput) {
        return {
          presets: this.presets.arr,
          rules: this.rules.arr,
          notifications: this.notifications.arr
        };
      }
    }

    async deleteTo(env) {
      for (let preset of this.presets) {
        try {
          await preset.deleteRemoteVersion(env);
        } catch (e) {
          log(e);
        }
      }
    }

    async syncTo(env) {
      let fails = [];

      for (let preset of this.presets) {
        try {
          fails.push([preset, await preset.save(env), "preset"]);
        } catch (e) {
          log(chalk`{red Error}`);
          fails.push([preset, e]);
        }
      }

      if (this.rules.arr[0]) {
        log("Starting create phase for rules");

        for (let rule of this.rules) {
          try {
            fails.push([rule, await rule.saveA(env), "rule create"]);
          } catch (e) {
            log(chalk`{red Error}`);
            fails.push([rule, e, "rule create"]);
          }
        }

        log("OK");
        log("Starting link phase for rules");
        Rule.removeCache(env);

        for (let rule of this.rules) {
          try {
            fails.push([rule, await rule.saveB(env), "rule link"]);
          } catch (e) {
            log(chalk`{red Error}`);
            fails.push([rule, e, "rule link"]);
          }
        }
      }

      let finalErrors = [];

      for (let [item, error, stage] of fails) {
        if (!error) continue;
        log(chalk`Error during {blue ${stage}}: ${item.chalkPrint(false)} {red ${error}}`);
        finalErrors.push([item, error, stage]);
      }

      return finalErrors;
    }

  }

  class User extends RallyBase {
    constructor({
      data,
      remote
    }) {
      super();
      this.data = data;
      this.meta = {};
      this.remote = remote;
    }

    chalkPrint(pad = false) {
      let id = String("U-" + this.id);
      if (pad) id = id.padStart(7);
      return chalk`{green ${id}}: {blue ${this.name}}`;
    }

  }

  defineAssoc(User, "id", "data.id");
  defineAssoc(User, "name", "data.attributes.name");
  defineAssoc(User, "email", "data.attributes.email");
  defineAssoc(User, "remote", "meta.remote");
  User.endpoint = "users";

  class Tag extends RallyBase {
    constructor({
      data,
      remote
    } = {}) {
      super();
      this.meta = {};
      this.remote = remote;
      this.data = data; //this.data.attributes.rallyConfiguration = undefined;
      //this.data.attributes.systemManaged = undefined;
    }

    chalkPrint(pad = true) {
      let id = String("T-" + this.remote + "-" + this.id);
      if (pad) id = id.padStart(10);
      let prefix = this.curated ? "blue +" : "red -";
      return chalk`{green ${id}}: {${prefix}${this.name}}`;
    }

    static async create(env, name, {
      notCurated
    } = {}) {
      return new Tag({
        data: await lib.makeAPIRequest({
          env,
          path: `/${this.endpoint}`,
          method: "POST",
          payload: {
            data: {
              attributes: {
                name,
                curated: notCurated ? false : true
              },
              type: "tagNames"
            }
          }
        }),
        remote: env
      });
    }

    async curate() {
      this.curated = !this.curated;
      return await lib.makeAPIRequest({
        env: this.remote,
        path: `/tagNames/${this.id}`,
        method: "PATCH",
        payload: {
          data: {
            attributes: {
              curated: this.curated
            },
            type: "tagNames"
          }
        }
      });
    }

  }

  defineAssoc(Tag, "id", "data.id");
  defineAssoc(Tag, "attributes", "data.attributes");
  defineAssoc(Tag, "relationships", "data.relationships");
  defineAssoc(Tag, "name", "data.attributes.name");
  defineAssoc(Tag, "curated", "data.attributes.curated");
  defineAssoc(Tag, "remote", "meta.remote");
  Tag.endpoint = "tagNames";

  let stagingEmsg = chalk`Not currently on a clean staging branch. Please move to staging or resolve the commits.
Try {red git status} or {red rally stage edit --verbose} for more info.`;
  let Stage$$1 = {
    async before(args) {
      this.env = args.env;
      this.args = args;
      if (!this.env) throw new AbortError("No env supplied");
    },

    setStageId() {
      let api = exports.configObject.api[this.env];
      if (!api) return null;
      return this.stageid = api.stage;
    },

    // This returns true if the stage failed to load
    async downloadStage() {
      this.setStageId();

      if (!this.stageid) {
        log(chalk`No stage ID found for {green ${this.env}}. Run "{red rally stage init -e ${this.env} (stage name)}" or select a different env.`);
        return true;
      }

      let preset = await Preset.getById(this.env, this.stageid);
      await preset.downloadCode();
      this.stageData = JSON.parse(preset.code);
      this.stagePreset = preset;
      log(chalk`Stage loaded: {green ${this.stagePreset.name}}`);
    },

    async uploadStage() {
      if (!this.stagePreset || !this.stageData) {
        throw "Assert fail: no existing prestage (you shouldn't see this)";
      }

      this.stagePreset.code = JSON.stringify(this.stageData, null, 4);
      await this.stagePreset.uploadCodeToEnv(this.env, false, false);
    },

    async $init() {
      let presetName = this.args._.pop();

      let preset = await Preset.getByName(this.env, presetName);

      if (!preset) {
        log("Existing preset stage not found.");
        return;
      }

      log(chalk`Found stage target to init: ${preset.chalkPrint(false)}`);
      exports.configObject.api[this.env].stage = preset.id;
      exports.configObject["ownerName"] = await askInput("What is your name");
      await saveConfig(exports.configObject, {
        print: false
      });
    },

    async $info() {
      if (await this.downloadStage()) return;
      if (exports.configObject.rawOutput) return this.stageData;
      log(chalk`Currently Staged Branches: ${this.stageData.stage.length}`);

      for (let {
        branch,
        commit
      } of this.stageData.stage) {
        log(chalk`    ${branch} {gray ${commit}}`);
      }

      log(chalk`Currently Claimed Presets: ${this.stageData.claimedPresets.length}`);

      for (let preset of this.stageData.claimedPresets) {
        log(chalk`    {blue ${preset.name}} {gray ${preset.owner}}`);
      }
    },

    async $claim() {
      await Promise.all([this.downloadStage(), addAutoCompletePrompt()]);
      let q;
      let opts = [{
        name: "Claim a preset",
        value: "add"
      }, {
        name: "Remove a claimed preset",
        value: "rem"
      }, {
        name: "Apply changes",
        value: "done"
      }, {
        name: "Quit without saving",
        value: "quit"
      }]; //slice to copy

      let newClaimed = [];
      let ownerName = exports.configObject["ownerName"];

      for (;;) {
        q = await inquirer.prompt([{
          type: "autocomplete",
          name: "type",
          message: `What do you want to do?`,
          source: this.filterwith(opts)
        }]);

        if (q.type === "add") {
          let p = await selectPreset({});
          if (!p) continue;
          newClaimed.push(p);
        } else if (q.type === "rem") {
          let objsMap = newClaimed.map(x => ({
            name: x.chalkPrint(true),
            value: x
          }));

          for (let obj of this.stageData.claimedPresets) {
            objsMap.push({
              name: obj.name,
              value: obj.name
            });
          }

          let p = await selectLocalMenu(objsMap, "preset", true);
          if (!p) continue;

          if (typeof p == "string") {
            this.stageData.claimedPresets = this.stageData.claimedPresets.filter(x => x.name != p);
          } else {
            newClaimed = newClaimed.filter(x => x !== p);
          }
        } else if (q.type === "done") {
          break;
        } else if (q.type === "quit") {
          return;
        }
      }

      for (let newClaim of newClaimed) {
        this.stageData.claimedPresets.push({
          name: newClaim.name,
          owner: ownerName
        });
      }

      await this.uploadStage();
    },

    async getBranches() {
      let branches = await spawn({
        noecho: true
      }, "git", ["branch", "-la", "--color=never"]);

      if (branches.exitCode !== 0) {
        log("Error in loading branches", branches);
      }

      let branchList = branches.stdout.split("\n").map(x => x.trim()).filter(x => x.startsWith("remotes/origin")).map(x => {
        let lastSlash = x.lastIndexOf("/");

        if (lastSlash !== -1) {
          x = x.slice(lastSlash + 1);
        }

        return x;
      });

      if (!(await this.checkCurrentBranch())) {
        log(stagingEmsg);
        return;
      }

      log("Finished retreiving branches.");
      return branchList;
    },

    async runGit(oks, ...args) {
      if (typeof oks === "number") {
        oks = [oks];
      } else if (typeof oks === "undefined") {
        oks = [0];
      }

      let g = await spawn({
        noecho: true
      }, "git", args);
      if (exports.configObject.verbose) log(`git ${args.join(" ")}`);

      if (!oks.includes(g.exitCode)) {
        log(g.stderr);
        log(g.stdout);
        throw new AbortError(chalk`Failed to run git ${args} {red ${g.exitCode}}`);
      }

      return [g.stdout, g.stderr];
    },

    filterwith(list) {
      return async (sofar, input) => {
        return list.filter(x => input ? (x.name || x).toLowerCase().includes(input.toLowerCase()) : true);
      };
    },

    //finite state machine for inputting branch changes
    async editFSM(allBranches, newStagedBranches) {
      let q;
      let opts = [{
        name: "Add a branch to the stage",
        value: "add"
      }, {
        name: "Remove a branch from the stage",
        value: "rem"
      }, {
        name: "Finalize stage",
        value: "done"
      }, {
        name: "Quit without saving",
        value: "quit"
      }];

      for (;;) {
        q = await inquirer.prompt([{
          type: "autocomplete",
          name: "type",
          message: `What do you want to do?`,
          source: this.filterwith(opts)
        }]);

        if (q.type === "add") {
          let qqs = allBranches.slice(0); //copy the branches

          qqs.push("None");
          q = await inquirer.prompt([{
            type: "autocomplete",
            name: "branch",
            message: `What branch do you want to add?`,
            source: this.filterwith(qqs)
          }]);

          if (q.branch !== "None") {
            newStagedBranches.add(q.branch);
          }
        } else if (q.type === "rem") {
          let qqs = Array.from(newStagedBranches);
          qqs.push("None");
          q = await inquirer.prompt([{
            type: "autocomplete",
            name: "branch",
            message: `What branch do you want to remove?`,
            source: this.filterwith(qqs)
          }]);

          if (q.branch !== "None") {
            newStagedBranches.delete(q.branch);
          }
        } else if (q.type === "done") {
          break;
        } else if (q.type === "quit") {
          return "quit";
        }
      }
    },

    async $edit() {
      let needsInput = !this.args.a && !this.args.r && !this.args.add && !this.args.remove;
      let clean = this.args.clean;
      let [branches, stage, _] = await Promise.all([this.getBranches(), this.downloadStage(), !needsInput || addAutoCompletePrompt()]);
      if (stage) return;
      if (!branches) return; //copy the branches we started with

      let newStagedBranches = new Set();
      let oldStagedBranches = new Set();

      for (let {
        branch
      } of this.stageData.stage) {
        if (!clean) {
          newStagedBranches.add(branch);
        }

        oldStagedBranches.add(branch);
      }

      if (needsInput) {
        let res = await this.editFSM(branches, newStagedBranches);

        if (res == "quit") {
          return;
        }
      } else {
        let asarray = arg$$1 => {
          if (!arg$$1) return [];
          return Array.isArray(arg$$1) ? arg$$1 : [arg$$1];
        };

        for (let branch of [...asarray(this.args.a), ...asarray(this.args.add)]) {
          if (!branches.includes(branch)) {
            throw new AbortError(`Invalid branch ${branch}`);
          }

          newStagedBranches.add(branch);
        }

        for (let branch of [...asarray(this.args.r), ...asarray(this.args.remove)]) {
          if (!branches.includes(branch)) {
            throw new AbortError(`Invalid branch ${branch}`);
          }

          newStagedBranches.delete(branch);
        }
      }

      const difference = (s1, s2) => new Set([...s1].filter(x => !s2.has(x)));

      const intersect = (s1, s2) => new Set([...s1].filter(x => s2.has(x)));

      log("Proposed stage changes:");

      for (let branch of intersect(newStagedBranches, oldStagedBranches)) {
        log(chalk`   ${branch}`);
      }

      for (let branch of difference(newStagedBranches, oldStagedBranches)) {
        log(chalk`  {green +${branch}}`);
      }

      for (let branch of difference(oldStagedBranches, newStagedBranches)) {
        log(chalk`  {red -${branch}}`);
      }

      let ok = this.args.y || (await askQuestion("Prepare these branches for deployment?"));
      if (!ok) return; //just to make sure commits/branches don't get out of order

      newStagedBranches = Array.from(newStagedBranches);

      try {
        let [diffText, newStagedCommits] = await this.doGit(newStagedBranches, this.stageData.stage.map(x => x.commit));
        await this.runRally(diffText);
        this.stageData.stage = Array.from(zip(newStagedBranches, newStagedCommits)).map(([branch, commit]) => ({
          branch,
          commit
        }));
        await this.uploadStage();
      } catch (e) {
        if (e instanceof AbortError) {
          await this.runGit([0], "reset", "--hard", "HEAD");
          await this.runGit([0], "checkout", "staging");
          throw e;
        }

        throw e; //TODO 
      } finally {
        await this.runGit([0], "checkout", "staging");
      }
    },

    async $pull() {
      if (await this.downloadStage()) return;
      await this.makeOldStage(this.stageData.stage.map(x => x.commit), `rallystage-${this.env}`);
    },

    async makeNewStage(newStagedBranches) {
      let newStagedCommits = [];
      await this.runGit([0, 1], "branch", "-D", "RALLYNEWSTAGE");
      await this.runGit([0], "checkout", "-b", "RALLYNEWSTAGE");

      for (let branch of newStagedBranches) {
        let originName = `origin/${branch}`;
        let mergeinfo = await spawn({
          noecho: true
        }, "git", ["merge", "--squash", originName]);

        if (mergeinfo.exitCode == 1) {
          let e = new AbortError(`Failed to merge ${branch}`);
          e.branch = branch;
          throw e;
        } else if (mergeinfo.exitCode != 0) {
          throw new AbortError(`Failed to merge for unknown reason ${branch}: {red ${mergeinfo}}`);
        }

        let [commit, _2] = await this.runGit([0, 1], "commit", "-m", `autostaging: commit ${branch}`);

        if (commit.includes("working tree clean")) {
          log(chalk`{yellow Warning:} working tree clean after merging {green ${branch}}, please remove this from the stage`);
        }

        let hash = await spawn({
          noecho: true
        }, "git", ["log", "--format=oneline", "--color=never", "-n", "1", originName]);

        if (hash.exitCode !== 0) {
          throw new AbortError(`Failed to get commit hash for branch, ${branch}`);
        }

        newStagedCommits.push(hash.stdout.split(" ")[0]);
      }

      return newStagedCommits;
    },

    async makeOldStage(oldStagedCommits, name) {
      await this.runGit([0], "checkout", "staging");
      await this.runGit([0, 1], "branch", "-D", name);
      await this.runGit([0], "checkout", "-b", name);

      for (let branch of oldStagedCommits) {
        let [err, _] = await this.runGit([0, 1], "merge", branch);

        if (err.includes("Automatic merge failed")) {
          log(chalk`{red Error:} ${branch} failed to merge during auto-commit`);

          if (this.args.force) {
            await this.runGit([0], "merge", "--abort");
          } else {
            throw new AbortError("Not trying to merge other branches");
          }
        }
      }
    },

    async checkCurrentBranch() {
      let expected = `On branch staging
Your branch is up to date with 'origin/staging'.

nothing to commit, working tree clean`;
      let status = await spawn({
        noecho: true
      }, "git", ["status"]);
      let trimmed = status.stdout.trim();

      if (exports.configObject.verbose) {
        log("expected:");
        log(chalk`{green ${expected}}`);
        log("got:");
        log(chalk`{red ${trimmed}}`);
      }

      return trimmed === expected;
    },

    async findConflict(newStagedBranches, brokeBranch) {
      await this.runGit([0], "reset", "--hard", "HEAD");
      let conflicting = [];

      for (let branch of newStagedBranches) {
        if (branch == brokeBranch) continue;
        await this.runGit([0], "checkout", "staging");
        await this.runGit([0, 1], "branch", "-D", "RALLYNEWSTAGE");
        await this.runGit([0], "checkout", "-b", "RALLYNEWSTAGE");
        let originName = `origin/${branch}`;
        await this.runGit([0], "merge", "--squash", originName);
        await this.runGit([0, 1], "commit", "-m", `autostaging: commit ${branch}`);
        let [a, b] = await this.runGit([0, 1], "merge", "--squash", `origin/${brokeBranch}`);

        if (a.includes("merge failed")) {
          conflicting.push({
            branch,
            msg: a
          });
          let [c, d] = await this.runGit([0, 1], "reset", "--hard", "HEAD");
        } else {
          let [c, d] = await this.runGit([0, 1], "commit", "-m", `asdf`);
        }
      }

      await this.runGit([0], "reset", "--hard", "HEAD");
      await this.runGit([0], "checkout", "staging");
      return conflicting;
    },

    async printConflicts(conflicts) {
      for ({
        branch,
        msg
      } of conflicts) {
        log(chalk`Conflict found on branch {blue ${branch}}: \n {red ${msg}}`);
      }
    },

    async $tfc() {
      await this.runGit([0], "reset", "--hard", "HEAD");
      await this.runGit([0], "checkout", "staging");
      let a = await this.findConflict(["fix-tc_adjust_planb", "test-too_many_markers_fix", "audio_rectifier_updates_ASR-69", "getIbmsMediaIdFix", "ASR-393_WrongTimecodesBlackSegmentDetection", "ASR-390_BadWooPartNums", "ASXT-Audio-QC-Baton-DLAPost", "ASR-293", "ASR-383_tiktok_rectifier"], "ASR-383_tiktok_rectifier");
      await this.printConflicts(a);
    },

    async doGit(newStagedBranches, oldStagedCommits) {
      if (!(await this.checkCurrentBranch())) {
        log(stagingEmsg);
        return;
      }

      let newStagedCommits;

      try {
        newStagedCommits = await this.makeNewStage(newStagedBranches);
      } catch (e) {
        if (e instanceof AbortError && e.branch) {
          log("Diagnosing conflict...");
          let conflicts = await this.findConflict(newStagedBranches, e.branch);
          this.printConflicts(conflicts);

          if (conflicts.length > 0) {
            throw new AbortError("Found conflict");
          } else {
            throw new AbortError("Unable to find conflict... No idea what to do.");
          }
        } else {
          throw e;
        }
      }

      await this.makeOldStage(oldStagedCommits, "RALLYOLDSTAGE");
      await this.runGit([0], "checkout", "RALLYNEWSTAGE");
      let diff = await spawn({
        noecho: true
      }, "git", ["diff", "RALLYOLDSTAGE..HEAD", "--name-only"]);

      if (diff.exitCode !== 0) {
        log(diff);
        throw new Error("diff failed");
      }

      let diffText = diff.stdout;
      return [diffText, newStagedCommits];
    },

    async $testrr() {
      let diff = `silo-presets/Super Movie Data Collector.py
        silo-presets/Super Movie Post Work Order.py
        silo-presets/Super Movie Task Handler.py`;
      await this.runRally(diff);
    },

    async runRally(diffText) {
      let set = new Set();

      for (let file of diffText.trim().split("\n")) {
        set.add((await categorizeString(file)));
      }

      let files = [...set];
      files = files.filter(f => f && !f.missing);
      let chain = new SupplyChain();
      chain.rules = new Collection(files.filter(f => f instanceof Rule));
      chain.presets = new Collection(files.filter(f => f instanceof Preset));
      chain.notifications = new Collection([]);

      if (chain.rules.arr.length + chain.presets.arr.length === 0) {
        log(chalk`{blue Info:} No changed prests, nothing to deploy`);
        return;
      }

      chain.log();
      let hasClaimed = false;

      for (let preset of chain.presets) {
        for (let claim of this.stageData.claimedPresets) {
          if (preset.name == claim.name) {
            hasClaimed = true;
            log(chalk`{yellow Claimed preset}: {blue ${claim.name}} (owner {green ${claim.owner}})`);
          }
        }
      }

      if (hasClaimed) {
        throw new AbortError("Someone has a claimed preset in the deploy");
      }

      let ok = this.args.y || (await askQuestion("Deploy now?"));
      if (!ok) throw new AbortError("Not deploying");
      await chain.syncTo(this.env);
    },

    async unknown(arg$$1, args) {
      log(chalk`Unknown action {red ${arg$$1}} try '{white rally help stage}'`);
    }

  };

  require("source-map-support").install();
  const rallyFunctions = {
    async bestPagintation() {
      global.silentAPI = true;

      for (let i = 10; i <= 30; i += 5) {
        console.time("test with " + i);
        let dl = await lib.indexPathFast("DEV", `/workflowRules?page=1p${i}`);
        console.timeEnd("test with " + i);
      }
    },

    async uploadPresets(env, presets, createFunc = () => false) {
      for (let preset of presets) {
        await preset.uploadCodeToEnv(env, createFunc);
      }
    },

    //Dummy test access
    async testAccess(env) {
      if (lib.isLocalEnv(env)) {
        let repodir = exports.configObject.repodir;

        if (repodir) {
          try {
            fs__default.lstatSync(repodir).isDirectory();
            return [true, 0];
          } catch (e) {
            return [false, 0];
          }
        } else {
          throw new UnconfiguredEnvError();
        }
      }

      let start = new Date();
      let result = await lib.makeAPIRequest({
        env,
        path: "/providers?page=1p1",
        fullResponse: true,
        timeout: 2000
      });
      let timed = new Date() - start;
      return [result.statusCode, timed];
    }

  };
  async function categorizeString(str, defaultSubproject = undefined) {
    str = str.trim();

    if (str.startsWith('"')) {
      str = str.slice(1, -1);
    }

    if (match = /^(\w)-(\w{1,10})-(\d{1,10}):/.exec(str)) {
      if (match[1] === "P") {
        let ret = await Preset.getById(match[2], match[3]); //TODO modify for subproject a bit

        return ret;
      } else if (match[1] === "R") {
        return await Rule.getById(match[2], match[3]);
      } else {
        return null;
      }
    } else if (match = /^([\w \/\\\-_]*)[\/\\]?silo\-(\w+)[\/\\]/.exec(str)) {
      try {
        switch (match[2]) {
          case "presets":
            return new Preset({
              path: str,
              subProject: match[1]
            });

          case "rules":
            return new Rule({
              path: str,
              subProject: match[1]
            });

          case "metadata":
            return await Preset.fromMetadata(str, match[1]);
        }
      } catch (e) {
        log(e);
      }
    } else {
      return null;
    }
  }

  exports.rallyFunctions = rallyFunctions;
  exports.categorizeString = categorizeString;
  exports.SupplyChain = SupplyChain;
  exports.Preset = Preset;
  exports.Rule = Rule;
  exports.Provider = Provider;
  exports.Notification = Notification;
  exports.Asset = Asset;
  exports.User = User;
  exports.Tag = Tag;
  exports.Stage = Stage$$1;
  exports.Trace = Trace;
  exports.loadConfig = loadConfig;
  exports.loadConfigFromArgs = loadConfigFromArgs;
  exports.setConfig = setConfig;
  exports.lib = lib;
  exports.AbortError = AbortError;
  exports.APIError = APIError;
  exports.UnconfiguredEnvError = UnconfiguredEnvError;
  exports.ProtectedEnvError = ProtectedEnvError;
  exports.FileTooLargeError = FileTooLargeError;
  exports.ResoultionError = ResoultionError;
  exports.Collection = Collection;
  exports.RallyBase = RallyBase;
  exports.sleep = sleep;
  exports.zip = zip;
  exports.unordered = unordered;
  exports.range = range;
  exports.IndexObject = IndexObject;
  exports.orderedObjectKeys = orderedObjectKeys;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=web.js.map
