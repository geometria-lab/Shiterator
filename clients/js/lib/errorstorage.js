    var ErrorStorage = function(expireAfterDays) {
        this.__storage;

        this.__expires;

        this.__retrieveFromCookies(expireAfterDays);
    };

    ErrorStorage.prototype.__retrieveFromCookies = function(expireAfterDays) {
        this.__storage = [];

        var storedData = this.__getCookie('shiterator');
        if (storedData) {
            this.__storage = storedData.split('/');
        }

        var expirationTimestamp = this.__storage.shift();
        if (!expirationTimestamp) {
            expirationTimestamp = new Date((new Date()).getTime() + expireAfterDays * 1000 * 60 * 60 * 24);
        }

        this.__expires = this.__expires = expirationTimestamp;
    };
    
    ErrorStorage.prototype.__setCookie = function(name, value, expires) {
        var today = new Date();
        today.setTime(today.getTime());
        var expires_date = new Date(expires);

        document.cookie = name + "=" + encodeURIComponent(value) +
                          (expires ? ";expires=" + expires_date.toGMTString() : "");
    };

    ErrorStorage.prototype.__getCookie = function(check_name) {
        var allCookies = document.cookie.split(';');
        var tempCookie = '';
        var cookieName = '';
        var cookieValue = '';

        var i = allCookies.length;
        while (i--) {
            tempCookie = allCookies[i].split('=');

            cookieName = tempCookie[0].replace(/^\s+|\s+$/g, '');

            if (cookieName === check_name) {
                if (tempCookie.length > 1) {
                    cookieValue = decodeURIComponent(tempCookie[1].replace(/^\s+|\s+$/g, ''));
                }
                return cookieValue;
            }
        }

        return null;
    };

    ErrorStorage.prototype.__storeInCookies = function() {
        var cookie = [this.__expires].concat(this.__storage).join('/');

        this.__setCookie('shiterator', cookie, this.__expires);
    };

    ErrorStorage.prototype.has = function(key) {
        var i = this.__storage.length;
        while (i--) {
            if (this.__storage[i] === key) {
                return true;
            }
        }
        return false;
    };

    ErrorStorage.prototype.put = function(key) {
        this.__storage.push(key);
        this.__storeInCookies();
    };
