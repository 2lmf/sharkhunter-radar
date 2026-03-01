const fs = require('fs');
const https = require('https');

const url = "https://script.google.com/macros/s/AKfycbxvJsWlcHGP0V2s-vr9suj6cgRd0HJUe_ZCeSM6v9BQFds9abphVANYnxuvw0ijy9yr/exec?action=getPrey";

https.get(url, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            if (res.statusCode === 302 && res.headers.location) {
                https.get(res.headers.location, r => {
                    let b = ''; r.on('data', d => b += d); r.on('end', () => console.log(b.substring(0, 1000)));
                });
            } else {
                console.log(body.substring(0, 1000));
            }
        } catch (e) { console.error(e); }
    });
});
