//const WebSocketInstance = require('./websocket');

const http = require('http');
const qs = require('querystring');
const WebSocketClient = require('websocket').client

const nexysJson = require('../../public/config/nexys');
const eventHandler = require('./EventHandler');
const redisService = require('../tmup/RedisService');
const httpService = require('./HttpService');

var client = new WebSocketClient();


let auth = () => {
    return new Promise((resolve, reject) => {
        let response = null;

        const option = {
            host: "221.157.172.13",
            path: "/oauth2/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        const requestBody = {
            username: nexysJson.id,
            password: nexysJson.pw
        };

        const req = http.request(option, res => {
            res.on('data', d => {
                response = JSON.parse(d.toString());
            });

            res.on('end', () => {
                resolve(response);
            });

            res.on('error', err => {
                reject(err);
            })
        });

        req.write(qs.stringify(requestBody));
        req.end();
    })
};

let setListener = (tokens) => {
    httpService.generateGetRequest("221.157.172.13", "/v3/events", tokens).then(ev => {
	setListener(tokens);
        if(ev.events.length > 0) {
            eventHandler.handleEvent(ev.events[0]);
        }
    }).catch(err => {
        throw err;
    })
};

let onError = err => {
    console.log(err);
};


exports.nexys_init = () => {
    auth().then(redisService.setTokens).then(redisService.getTokens).then(setListener).catch(onError);
};
