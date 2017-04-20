var __utils  = require('./lib/utils.js'),
    __token  = require('./lib/token.js'),
    __cookie = require('./lib/cookie.js')

module.exports = function () {

    // Private (used double underscore __).

    var __transitionPrev = null,
        __transitionThis = null,
        __transitionRedirecType = null;

    function __duckPunch(methodName, data) {
        var _this = this,
            success = data.success;

        data = __utils.extend(this.options[methodName + 'Data'], [data]);
        data.success = function (res) {
            data.success = success;

            _this.options[methodName + 'Process'].call(_this, res, data);
        };

        this.options.http._http.call(this, data);
    }

    function __bindContext(methodName, data) {
        var _auth = this.$auth;

        _auth.options[methodName + 'Perform'].call(_auth, _auth.options.router._bindData.call(_auth, data, this));
    }

    // Overrideable

    function _checkAuthenticated(cb) {
        if (this.watch.authenticated === null && __token.get.call(this, 'access')) {
            if ( ! __cookie.exists.call(this)) {
                this.options.logoutProcess.call(this, null, {});

                this.watch.loaded = true;

                return cb.call(this);
            }

            this.watch.authenticated = false;

            if (this.options.fetchData.enabled) {
                this.options.fetchPerform.call(this, {success: cb, error: cb});
            }
        } else {
            this.watch.loaded = true;
            return cb.call(this);
        }
    }

    function _routerBeforeEach(cb) {
        var _this = this;

        if (this.watch.authenticated && !__token.get.call(this, 'access')) {
            this.options.logoutProcess.call(this, null, {});
        }

        if (this.options.refreshData.enabled && this.options.tokenExpired.call(this)) {
            this.options.refreshPerform.call(this, {
                success: function () {
                    this.options.checkAuthenticated.call(_this, cb);
                },
                error: function () {
                    _this.options.logoutProcess.call(_this, null, {});
                    _checkAuthenticated.call(_this, cb);
                }
            });

            return;
        }
        
        _checkAuthenticated.call(this, cb);
    }

    function _transitionEach(transition, routeAuth, cb) {
        routeAuth = __utils.toArray(routeAuth);

        __transitionPrev = __transitionThis;
        __transitionThis = transition;
        
        if (routeAuth && (routeAuth === true || routeAuth.constructor === Array)) {
            if ( ! this.check()) {
                __transitionRedirecType = 401;
                cb.call(this, this.options.authRedirect);
            }
            else if (routeAuth.constructor === Array && ! __utils.compare(routeAuth, __utils.oSimple(this.watch.data[this.options.rolesVar].data))) {
                __transitionRedirecType = null;
                cb.call(this, this.options.forbiddenRedirect);
            }
            else {
                this.watch.redirect = __transitionRedirecType ? {type: __transitionRedirecType, from: __transitionPrev, to: __transitionThis} : null;
                __transitionRedirecType = null;

                return cb();
            }
        }
        else if (routeAuth === false && this.check()) {
            __transitionRedirecType = 404;
            cb.call(this, this.options.loginRedirect);
        }
        else {
            this.watch.redirect = __transitionRedirecType ? {type: __transitionRedirecType, from: __transitionPrev, to: __transitionThis} : null;
            __transitionRedirecType = null;

            return cb();
        }
    }

    function _requestIntercept(req) {
        var token = __token.get.call(this, 'access');

        if (token) {
            this.options.auth.request.call(this, req, token);
        }

        return req;
    }

    function _responseIntercept(res) {
        var token_data = [];

        if (this.watch.authenticated && this.options.http._invalidToken) {
            this.options.http._invalidToken.call(this, res);
        }

        token_data = this.options.auth.response.call(this, res);

        if (token_data) {
            __token.set.call(this, null, token_data);
        }
    }

    function _parseUserData(data) {
        return data.data || {};
    }

    function _check(role) {
        if (this.watch.authenticated === true) {
            if (role) {
                return __utils.compare(role, this.watch.data[this.options.rolesVar]);
            }

            return true;
        }

        return false;
    }

    function _tokenExpired () {
        if(!__token.get.call(this, 'expires_in')){
            __token.delete.call(this, 'refresh');
            __token.delete.call(this, 'access');
            return true;
        }

        if(__token.get.call(this, 'expires_in') <= Math.floor(Date.now()/1000)){
            return true;
        }

        return ! this.watch.loaded && __token.get.call(this, 'access');
    }

    function _cookieDomain () {
        return window.location.hostname;
    }

    function _getUrl () {
        var port = window.location.port

        return window.location.protocol + '//' + window.location.hostname + (port ? ':' + port : '')
    }

    function _fetchPerform(data) {
        var _this = this,
            error = data.error;

        data.error = function (res) {
            _this.watch.loaded = true;

            if (error) { error.call(_this, res); }
        };

        if (this.watch.authenticated !== true && !this.options.loginData.fetchUser) {
            _fetchProcess.call(this, {}, data);
        }
        else {
            __duckPunch.call(this, 'fetch', data);
        }
    }

    function _fetchProcess(res, data) {
        this.watch.authenticated = true;
        this.watch.data = this.options.parseUserData.call(this, this.options.http._httpData.call(this, res));
        
        this.watch.loaded = true;
        if (data.success) { data.success.call(this, res); }
    }

    function _refreshPerform(data) {
        if(__token.get.call(this, 'refresh')){
            data.data = {
                refresh_token: __token.get.call(this, 'refresh')
            }    
        }

        __duckPunch.call(this, 'refresh', data);
    }

    function _refreshProcess(res, data) {
        if (data.success) { data.success.call(this, res); }
    }

    function _registerPerform(data) {
        __duckPunch.call(this, 'register', data);
    }

    function _registerProcess(res, data) {
        if (data.autoLogin === true) {
            data = __utils.extend(data, [this.options.loginData]);

            this.options.loginPerform.call(this, data);
        }
        else {
            if (data.success) { data.success.call(this, res); }

            if (data.redirect) {
                this.options.router._routerGo.call(this, data.redirect);
            }
        }
    }

    function _loginPerform(data) {
        __duckPunch.call(this, 'login', data);
    }

    function _loginProcess(res, data) {
        var _this = this;

        __cookie.set.call(this, data.rememberMe);

        this.authenticated = null;

        if (data.fetchUser) {
            this.options.fetchPerform.call(this, {
                success: function () {
                    if (data.success) { data.success.call(this, res); }

                    if (data.redirect && _this.options.check.call(_this)) {
                        _this.options.router._routerGo.call(_this, data.redirect);
                    }
                }
            });
        }
    }

    function _logoutPerform(data) {
        data = __utils.extend(this.options.logoutData, [data || {}]);

        if (data.makeRequest) {
            __duckPunch.call(this, 'logout', data);
        }
        else {
            this.options.logoutProcess.call(this, null, data);
        }
    }

    function _logoutProcess(res, data) {
        __cookie.delete.call(this);

        __token.delete.call(this, 'access_token');
        __token.delete.call(this, 'expires_in_token');
        __token.delete.call(this, 'refresh_token');

        this.watch.authenticated = false;
        this.watch.data = null;

        if (data.success) { data.success.call(this, res, data); }

        if (data.redirect) {
            this.options.router._routerGo.call(this, data.redirect);
        }
    }

    var defaultOptions = {

        // Variables
        rolesVar:          'roles',
        tokenName:         'token',

        // Objects
        loginRedirect:      {path: '/dashboard'},
        authRedirect:       {path: '/login'},
        forbiddenRedirect:  {path: '/403'},
        notFoundRedirect:   {path: '/404'},
        registerData:       {url: 'auth/register', method: 'POST', redirect: '/login'},
        loginData:          {
            data: {
                grant_type: 'password'
            },
            url: 'oauth/token', 
            method: 'POST', 
            redirect: '/dashboard', 
            fetchUser: true
        },
        logoutData:         {url: 'logout',     method: 'POST', redirect: '/', makeRequest: true},
        fetchData:          {url: 'userinfo',   method: 'GET', enabled: true},
        refreshData:        {
            data: {
                grant_type: 'refresh_token'
            },
            url: 'oauth/token', 
            method: 'POST', 
            enabled: true
        },

        // Internal
        getUrl:             _getUrl,
        cookieDomain:       _cookieDomain,
        parseUserData:      _parseUserData,
        tokenExpired:       _tokenExpired,
        check:              _check,
        checkAuthenticated: _checkAuthenticated,
        transitionEach:     _transitionEach,
        routerBeforeEach:   _routerBeforeEach,
        requestIntercept:   _requestIntercept,
        responseIntercept:  _responseIntercept,

        // Contextual
        registerPerform:    _registerPerform,
        registerProcess:    _registerProcess,
        loginPerform:       _loginPerform,
        loginProcess:       _loginProcess,
        logoutPerform:      _logoutPerform,
        logoutProcess:      _logoutProcess,
        fetchPerform:       _fetchPerform,
        fetchProcess:       _fetchProcess,
        refreshPerform:     _refreshPerform,
        refreshProcess:     _refreshProcess,
    };

    function Auth(Vue, options) {

        var i, ii, msg, drivers = ['auth', 'http', 'router'];

        this.options = __utils.extend(defaultOptions, [options || {}]);
        this.options.Vue = Vue;

        this.watch = new this.options.Vue({
            data: function () {
                return {
                    data: null,
                    loaded: false,
                    redirect: null,
                    authenticated: null
                };
            }
        });

        // Comprobamos los drivers 
        for (i = 0, ii = drivers.length; i < ii; i++) {
            if ( ! this.options[drivers[i]]) {
                console.error('No se encuentra el driver ' + drivers[i] + ' requerido por (@jmlion/vue-auth): "');
                return;
            }

            if (this.options[drivers[i]]._init) {
                msg = this.options[drivers[i]]._init.call(this);

                if (msg) {
                    console.error('Error (@jmlion/vue-auth): ' + msg);
                    return;
                }
            }
        }

        // Init interceptors.
        this.options.router._beforeEach.call(this, this.options.routerBeforeEach, this.options.transitionEach);
        this.options.http._interceptor.call(this, this.options.requestIntercept, this.options.responseIntercept);
    }

    Auth.prototype.ready = function (cb) {
        return this.watch.loaded;
    };

    Auth.prototype.redirect = function () {
        return this.watch.redirect;
    };

    Auth.prototype.user = function (data) {
        if (data) {
            this.watch.data = data;
        }

        return this.watch.data || {};
    };

    Auth.prototype.check = function (role) {
        return this.options.check.call(this, role);
    };

    Auth.prototype.token = function (name) {
        return __token.get.call(this, name);
    };

    Auth.prototype.fetch = function (data) {
        __bindContext.call(this, 'fetch', data);
    };

    Auth.prototype.refresh = function (data) {
        __bindContext.call(this, 'refresh', data);
    };

    Auth.prototype.register = function (data) {
        __bindContext.call(this, 'register', data);
    };

    Auth.prototype.login = function (data) {
        __bindContext.call(this, 'login', data);
    };

    Auth.prototype.logout = function (data) {
        __bindContext.call(this, 'logout', data);
    };

    return Auth;
};
