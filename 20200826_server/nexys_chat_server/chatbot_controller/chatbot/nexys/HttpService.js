const http = require("http");


let instance = null;

class HttpService {
    constructor() {
        if (!instance) {
            instance = this;
        }

        return this;
    }

    generateGetRequest(host, path, tokens) {
        return new Promise((resolve, reject) => {
            let data = null;

            const option = {
                host,
                path,
                method: "GET",
                headers: {
                    "Authorization": `bearer ${tokens[ 0 ]}`
                }
            };

            const req = http.request(option, res => {
                res.on('data', d => {
                    data = JSON.parse(d.toString());
                });

                res.on('end', () => {
                    resolve(data);
                });

                res.on('error', err => {
                    reject(err);
                });
            });

            req.end();
        })
    }

    generatePostRequest(host, path, json, tokens) {
        return new Promise((resolve, reject) => {
            let data = null;

            const option = {
                host,
                path,
                method: "POST",
                headers: {
                    "Authorization": `bearer ${tokens[ 0 ]}`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            };

            const req = http.request(option, res => {
                res.on('data', d => {
                    data = JSON.parse(d.toString());
                });

                res.on('end', () => {
                    resolve(data);
                });

                res.on('error', err => {
                    reject(err);
                });
            });

            req.write(JSON.stringify(json));
            req.end();
        });
    }
}

const httpService = new HttpService();
module.exports = httpService;
