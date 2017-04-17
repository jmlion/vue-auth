module.exports = {
    
    request: function (req, token) {
        this.options.http._setHeaders.call(this, req, {Authorization: 'Bearer ' + token});
    },
    
    response: function (res) {
        var data = this.options.http._httpData.call(this, res)
        var token_data = [];

        if(data.access_token){
            token_data['access_token'] = data.access_token.trim();
            token_data['refresh_token'] = data.refresh_token.trim();
            token_data['expires_in'] = data.expires_in;
        }

        
        if (token_data) {
          return token_data;
        }
    }
};