module.exports = (function () {

    function tokenName(name) {

        return name + '_' + this.options.tokenName;
    }

    return {
        get: function (name) {
            if(! name){
                name = 'access';
            }
            name = tokenName.call(this, name);
            return localStorage.getItem(name);
        },

        set: function (name, token_data) {
            if (token_data) {
                if(token_data['access_token']){
                    name = tokenName.call(this, 'access');
                    localStorage.setItem(name, token_data['access_token']);
                }

                if(token_data['refresh_token']){
                    name = tokenName.call(this, 'refresh');
                    localStorage.setItem(name, token_data['refresh_token']);
                }

                if(token_data['expires_in']){
                    name = tokenName.call(this, 'expires_in');

                    localStorage.setItem(name, Math.floor(Date.now()/1000) + token_data['expires_in']);
                }
            }
        },

        delete: function (name) {
            name = tokenName.call(this, name);
            localStorage.removeItem(name);
        },

        expiring: function () {
            return false;
        }
    }

})();