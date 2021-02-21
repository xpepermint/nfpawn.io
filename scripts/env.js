/**
 * Sets global configuration variables.
 */
(function() {
    const url = new URL(location.href);
    const test = url.pathname.substr(0, 5) == '/test';
    window.ENV = test ? 'test' : 'main';
    window.API_BASE = location.href.indexOf('http://localhost:8080') == 0
        ? 'http://localhost:4445'
        : (test ? 'https://api-test.nfpawn.com' : 'https://api.nfpawn.com');
    window.NAMESPACE = test ? 'com.nfpawn.test' : 'com.nfpawn';
})();
  
/**
 * Draws a bar at the top of the webiste indicating when working in the testing
 * environment.
 */
(function() {
    if (window.ENV !== 'test') {
        return;
    } else {
        $(document).ready(() => {
        $([
            `<div style="display: block; background: red; padding: 5px 5px 8px 5px; text-align: center; color: white">`,
            `This website runs in test environment.`,
            `</div>`
        ].join('')).prependTo($('body'));
        });
    }
})();
