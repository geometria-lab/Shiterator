    // merge two objects (not a deep copy)
    function merge(destination, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                destination[key] = source[key];
            }
        }
        return destination;
    }

    // empty function
    function noop() {}

    // simple string hash function
    function foldString(str) {
        var FOLD = 4;
        var MODULE = 0xffffffff;
        var strlen = str.length;
        var sum = 0;

        // add trailing zeros to make strlen divisible by FOLD
        if (strlen % FOLD) {
            str += '0000000'.substr(0, FOLD - strlen % FOLD);
        }

        // folding
        for(var i = 0, len = strlen / FOLD; i < len; ++i) {
            for(var j = 0; j < FOLD; ++j) {
                sum += str.charCodeAt(i * FOLD + j) << (j * 8);
            }
        }

        return '' + Math.abs(sum) % MODULE;
    }

    var domReadyListeners = [];
    var domReady = false;

    // run handler on DOMContentLoaded
    function onDomReady(handler, context){
        var called = false;
        context = context || window;

        function ready() {
            if (called) {
                return;
            }
            called = true;
            handler.apply(context, arguments);
        }

        if (document.readyState === 'interactive' ||
            document.readyState === 'complete') {
            ready();
        }

        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", function() {
                ready();
            }, false );
        } else if (document.attachEvent) {
            if (document.documentElement.doScroll && window.top) {
                function tryScroll(){
                    if (called) {
                        return;
                    }
                    if (!document.body) {
                        return;
                    }
                    try {
                        document.documentElement.doScroll("left");
                        ready();
                    } catch(e) {
                        setTimeout(tryScroll, 0);
                    }
                }
                tryScroll();
            }

            document.attachEvent("onreadystatechange", function(){
                if (document.readyState === "complete") {
                    ready();
                }
            });
        }
    }
