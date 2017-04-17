var Auth = require('./auth.js')();

module.exports = (function () {

    return function install(Vue, options) {
        
        var auth = new Auth(Vue, options);

        var login = auth.login;
        var fetch = auth.fetch;
        var logout = auth.logout;
        var refresh = auth.refresh;
        var register = auth.register;

        Object.defineProperties(Vue.prototype, {
            $auth: {
                get: function () {
                    auth.login = login.bind(this);
                    auth.fetch = fetch.bind(this);
                    auth.logout = logout.bind(this);
                    auth.refresh = refresh.bind(this);
                    auth.register = register.bind(this);

                    return auth;
                }
            }
        });
    }
})();