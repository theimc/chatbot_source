let request = require('request');

const httpsService = require('./HttpService');
const redisService = require('../tmup/RedisService');
const chatbotService = require('../tmup/ChatbotService');


let instance = null;
let tempRes = null;
let chatbotMode = "max";

class EventHandler {
    constructor() {
        if (!instance) {
            instance = this;

            this.state = {
                SERVICES: {
                    GOOGLE_MAP : 0,
                    YOUTUBE : 1,
                    WIKI : 2,
                    CES : 3,
                    CALENDAR : 4,
					HOTEL : 5,
					EMAIL : 6,
					FLIGHT : 7,
					SHOPPING : 8,
					RESTAURANT : 9
                }
            };
            this.handleEvent = this.handleEvent.bind(this);
            this.fetchMessage = this.fetchMessage.bind(this);
        }

        return instance;
    }

    handleEvent(ev) {
		console.log("");
        console.log(ev);
        switch (ev.type) {
            case 'chat.message':
				this.fetchMessage(ev.chat.room, ev.chat.msg);				
				break;

            case 'chat.initbot':
                //this.sendMessage(ev.chat.room, "안녕하세요 CeSLeA입니다.");
				this.sendMessage(ev.chat.room, "Hello, My name is CESLeA.");
                break;
				
			case 'chat.join':
				// Here comes a new challenger.
				// this.sendMessage(ev.chat.room, "누구누구가 입장했습니다.");
				
				// object : call make the summarize and send message.
				// collect messages from room.
				// (GET) https://edge.tmup.com/v3/messages/:room/:count(/:way(/:start))
				// TODO, 20181116, need to make this function as a function.
				this.getMessages(ev.chat.room, 10).then(function (messages) {
					// make collected messages as one text object
					let plainText = eventHandler.makePlainText(messages);
					//console.log("plainText: " + plainText);
					
					// request post to dennis summarization model
					// method: POST
					// uri: http://155.230.104.190:8080/articles
					// data: ["file": <SOME FILE>](only txt)
					
					var req = request.post("http://155.230.104.190:8080/articles", function (err, resp, body) {
						if (err) {
							console.log('Post Error!');
						}
						else {
							console.log('Post Success!');
							let myObj = JSON.parse(body);
							eventHandler.sendMessage(ev.chat.room, myObj.content);
						}
					});
					
					var form = req.form();
					form.append('file', plainText, {
						filename: 'myfile.txt',
						contentType: 'text/plain'
					});
					
				}).catch(err => {
					throw err;
				});
				break;
				
			case 'chat.setting':
				if (ev.chat.mode == "max") {
					chatbotMode = "max";
				}
				else if (ev.chat.mode == "semi") {
					chatbotMode = "semi";
				}
				else if (ev.chat.mode == "lock") {
					chatbotMode = "lock";
				}
				else {
					console.log('Wrong input in ev.chat.setting.');
				}
				break;

            default:
				//console.log("ev.type is other thing...");
                break;
        }
    }

    fetchMessage(room, msg) {
		let isIntention = false;
        redisService.getTokens().then(tokens => {
            httpsService.generateGetRequest("221.157.172.13", `/v3/message/summary/${room}/${msg}`, tokens).then(data => {
                // if we found not ascii code given text, skip text
				if (this.checkAscii(data.content)) {
					//console.log("We found the non-ascii code in given message, skipping");
					return;
				}
				
				const lowered = data.content.toLowerCase();
				const services = this.state.SERVICES;

				// set chatbot mode.
				if (lowered.includes("cecilia") && lowered.includes("max")) {
					chatbotMode = "max";
					this.sendMessage(room , "Max mode.");
					return;
				}
				else if (lowered.includes("cecilia") && lowered.includes("semi")) {
					chatbotMode = "semi";
					this.sendMessage(room , "Semi mode.");
					return;
				}
				else if (lowered.includes("cecilia") && lowered.includes("lock")) {
					chatbotMode = "lock";
					this.sendMessage(room , "Lock mode.");
					return;
				}
				else {
					// nothing to do..
				}

				// check input is for yes or no about askToService
				if (tempRes != null && (chatbotMode == "max" || chatbotMode == "semi")) {
					if (lowered.includes("yes")) {
						switch (tempRes.serviceCode) {
							case services.GOOGLE_MAP:
								// start service according to temporary data
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.YOUTUBE:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.WIKI:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.CES:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.CALENDAR:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								// make summerization from start to current text.

								// send the summarization to list
								break;
							case services.HOTEL:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.EMAIL:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.FLIGHT:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.SHOPPING:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							case services.RESTAURANT:
								this.sendActiveMessage(room, tempRes.serviceCode, tempRes.serviceValue);
								break;

							default:
								console.log("unexpected code from tempRes");
								break;
						}

					}
					else {
						this.sendMessage(room , "Ok, bye.");
					}

					tempRes = null;
					return;
				}

				// find intention from given message.
				chatbotService.chatServiceFilter(data.content).then(res => {
					// Connect serviceCode between dnc_intention docker module and chatbot controller
					if (res.serviceCode == 0) {
						res.serviceCode = -1;
					}
					else if (res.serviceCode == 1) {
						res.serviceCode = 0;
					}
					else if (res.serviceCode == 2) {
						res.serviceCode = 1;
					}
					else if (res.serviceCode == 3) {
						res.serviceCode = 2;
					}
					else if (res.serviceCode == 4) {
						res.serviceCode = 4;
					}
					else if (res.serviceCode == 5) {
						res.serviceCode = 8;
					}
					else if (res.serviceCode == 6) {
						res.serviceCode = 6;
					}
					else if (res.serviceCode == 7) {
						res.serviceCode = 5;
					}
					else if (res.serviceCode == 8) {
						res.serviceCode = 9;
					}
					else if (res.serviceCode == 9) {
						res.serviceCode = 3;
					}
					else if (res.serviceCode == 10) {
						res.serviceCode = 7;
					}
					else {
						console.log("what?");
					}

					console.log("service code : " + res.serviceCode + ", service value : " + res.serviceValue);

					//if (res.hasOwnProperty("serviceCode")) {
					if (res.serviceCode != -1 && res.serviceValue != null) {
						//console.log("This message contains the intention.");
						isIntention = true;
					}
                    //console.log(`from chatServiceFilter(), Intention: ${res}`);
					//console.log("service code : " + res.serviceCode + ", service value : " + res.serviceValue);
                    if (isIntention == true && (chatbotMode == "max" || chatbotMode == "semi")) {
						switch (res.serviceCode) {
							case services.GOOGLE_MAP:
								console.log('GOOGLE MAP');
								// ask to service
								this.sendMessage(room , "May I show you the google map?");
								tempRes = res;
								break;

							case services.YOUTUBE:
								console.log('YOUTUBE');
								this.sendMessage(room , "May I show you the google youtube?");
								tempRes = res;
								break;

							case services.WIKI:
								console.log('WIKI');
								this.sendMessage(room , "May I show you the wikipedia?");
								tempRes = res;
								break;

							case services.CES:
								console.log('CES');
								this.sendMessage(room , "May I show you the CES?");
								tempRes = res;
								break;

							case services.CALENDAR:
								console.log('CALENDAR');
								this.sendMessage(room , "May I show you the google calendar?");
								tempRes = res;
								break;

							case services.HOTEL:
								console.log('HOTEL');
								this.sendMessage(room , "May I show you the hotel infomation?");
								tempRes = res;
								break;

							case services.EMAIL:
								console.log('EMAIL');
								this.sendMessage(room , "May I show you the google gmail?");
								tempRes = res;
								break;

							case services.FLIGHT:
								console.log('FLIGHT');
								this.sendMessage(room , "May I show you the flight information?");
								tempRes = res;
								break;

							case services.SHOPPING:
								console.log('SHOPPING');
								this.sendMessage(room , "May I show you the shopping information?");
								tempRes = res;
								break;

							case services.RESTAURANT:
								console.log('RESTAURANT');
								this.sendMessage(room , "May I show you the restaurant information?");
								tempRes = res;
								break;

							default:
								console.log("unexpected code from res");
								break;
						}
					}
					
					if (isIntention == false && chatbotMode == "max") {
						chatbotService.setLanguage(lowered);
						chatbotService.chat(lowered, result => {
							/*
							if (result.sentence.includes("video1")) {
								// run video1
								this.sendActiveMessage(room, 11, "https://www.youtube.com/watch?v=M6c0uDPHnxs&autoplay=1&mute=1");
								//res.result.replace("video1","");
							}
							else if (result.sentence.includes("video2")) {
								// run video2
								this.sendActiveMessage(room, 12, "https://www.youtube.com/watch?v=rJNWu0JT6-M&autoplay=1&mute=1");
							}
							else if (result.sentence.includes("video3")) {
								// run video3
								this.sendActiveMessage(room, 13, "https://www.youtube.com/watch?v=bRHR3SmAdkY&autoplay=1&mute=1");
							}
							else if (result.sentence.includes("video4")) {
								// run video4
								this.sendActiveMessage(room, 14, "https://www.youtube.com/watch?v=39D2GhQNAKE&autoplay=1&mute=1");
							}
							else {
								// nothing
								this.sendMessage(room, result.sentence);
								// 20181113, TODO, if self intro is finished, make summarization and sendMessage.
							}
							*/
							this.sendMessage(room, result.sentence);

						});
					}
					
                }).catch(err => {
                    throw err;
                })

            }).catch(err => {
                throw err;
            })
        }).catch(err => {
            throw err;
        });
    }

    sendMessage(room, content) {
        const json = { content: content };
        redisService.getTokens().then(tokens => {
            httpsService.generatePostRequest("221.157.172.13", `/v3/message/${room}`, json, tokens).then(data => {
                console.log(`Send messeage: ${!!data}`);
				console.log(data);
            }).catch(err => {
                throw err;
            })
        }).catch(err => {
            throw err;
        })
    }
	
	sendActiveMessage(room, inputCode, inputValue) {
		//console.log("sendActiveMessage");
		//console.log(inputCode);
		//console.log(inputValue);
		const services = this.state.SERVICES;
		
		/* reference of active message
		api는 http://team-up.github.io/v3/edge/chat/#api-message-postMessage
		{
			"content": "메시지 내용",
			"extras": {
				"2": {
					"type": "bot",
					"message_buttons": [
						{ "type": "url", "button_text": "버튼 안의 텍스트", "url": "https://www.google.com" }
					]
				}
			}
		}
		*/
		let extras = {
			"2" : {
				"type": "bot",
				"message_buttons": [
					{
						"type": "url",
						"button_text": "버튼 안의 텍스트",
						"url": "https://google.com"
					}
				]
			}
		};
		
		switch (inputCode) {
			case services.GOOGLE_MAP:
				console.log("sending google_map");
				// https://www.google.com/maps/search/?api=1&query=jerusalem
				extras["2"].message_buttons[0].button_text = "google map";
				extras["2"].message_buttons[0].url = "https://www.google.com/maps/search/?api=1&query=" + inputValue;

				// 20181121. test with EMR protocol from ESTsoft(it's working well.)
				//extras["2"].message_buttons[0].button_text = "ces(emr)";
				//extras["2"].message_buttons[0].url = "emr://emr?aa=bb&cc=dd";
				break;

			case services.YOUTUBE:
				console.log("sending youtube");
				// https://www.youtube.com/results?search_query=save+the+holy+land+from+saracen
				extras["2"].message_buttons[0].button_text = "youtube";
				extras["2"].message_buttons[0].url = "https://www.youtube.com/results?search_query=" + inputValue;
				break;

			case services.WIKI:
				console.log("sending wiki");
				// https://en.wikipedia.org/wiki/deus_vult
				extras["2"].message_buttons[0].button_text = "wikipedia";
				extras["2"].message_buttons[0].url = "https://en.wikipedia.org/wiki/" + inputValue;
				break;

			case services.CES:
				console.log("sending ces");
				// could not found url based api yet.
				extras["2"].message_buttons[0].button_text = "CES 2019";
				extras["2"].message_buttons[0].url = "https://www.ces.tech/";
				break;

			case services.CALENDAR:
				console.log("sending calendar");
				//ICAL link, https://productforums.google.com/forum/#!topic/calendar/_iuFcxRwxi4
				extras["2"].message_buttons[0].button_text = "google calendar";
				extras["2"].message_buttons[0].url = "https://www.google.com/calendar";
				break;

			case services.HOTEL:
				console.log("sending hotel");
				// https://www.hotelscombined.co.kr/Place/Las_Vegas.htm
				extras["2"].message_buttons[0].button_text = "hotel";
				extras["2"].message_buttons[0].url = "https://www.hotelscombined.co.kr/Place/" + inputValue;
				break;

			case services.EMAIL:
				console.log("sending email");
				// https://mail.google.com
				// https://mail.google.com/mail/u/0/?view=cm&fs=1&to=someone@example.com&su=SUBJECT&body=BODY&bcc=someone.else@example.com&tf=1
				extras["2"].message_buttons[0].button_text = "google gmail";
				extras["2"].message_buttons[0].url = "https://mail.google.com";
				break;

			case services.FLIGHT:
				console.log("sending flight");
				// https://www.skyscanner.co.kr
				extras["2"].message_buttons[0].button_text = "flight";
				extras["2"].message_buttons[0].url = "https://www.skyscanner.co.kr";
				break;

			case services.SHOPPING:
				console.log("sending shopping");
				// https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=nitro
				extras["2"].message_buttons[0].button_text = "shopping";
				extras["2"].message_buttons[0].url = "https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=" + inputValue;
				break;

			case services.RESTAURANT:
				console.log("sending restaurant");
				// https://www.tripadvisor.co.kr/Search-q%EC%A7%9C%EC%9E%A5&sid=8DCB85BB7A28C5EA2ADD6C861CA726301544495016084
				extras["2"].message_buttons[0].button_text = "restaurant";
				extras["2"].message_buttons[0].url = "https://www.tripadvisor.co.kr/Search-q" + inputValue;
				break;

			/*
			case 11:
				console.log("video1 in self intro");
				extras["2"].message_buttons[0].button_text = "video1";
				extras["2"].message_buttons[0].url = inputValue;
				break;
			case 12:
				console.log("video1 in self intro");
				extras["2"].message_buttons[0].button_text = "video2";
				extras["2"].message_buttons[0].url = inputValue;
				break;
			case 13:
				console.log("video1 in self intro");
				extras["2"].message_buttons[0].button_text = "video3";
				extras["2"].message_buttons[0].url = inputValue;
				break;
			case 14:
				console.log("video1 in self intro");
				extras["2"].message_buttons[0].button_text = "video4";
				extras["2"].message_buttons[0].url = inputValue;
				break;
			*/
			default:
				console.log("unexpected code from sendActiveMessage()");
				break;
		}
		
		const json = { "content": inputValue, "extras": extras };
        redisService.getTokens().then(tokens => {
            httpsService.generatePostRequest("221.157.172.13", `/v3/message/${room}`, json, tokens).then(data => {
                console.log(`Send messeage: ${!!data}`);
				console.log(data);
            }).catch(err => {
                throw err;
            })
        }).catch(err => {
            throw err;
        })
		
    }
	
	
	getMessages(room, count) {
		return new Promise(function (resolve, reject) {
			redisService.getTokens().then(tokens => {
				httpsService.generateGetRequest("221.157.172.13", `/v3/messages/${room}/${count}`, tokens).then(data => {
					//console.log("getMessages: " + JSON.stringify(data));
					//console.log("getMessages: " + Object.keys(data.msgs).length);
					//return data;
					resolve(data);
				}).catch(err => {
					throw err;
				})
			}).catch(err => {
				throw err;
			});			
		});
	}
	
	makePlainText(messages) {
		//console.log("makePlainText function start");
		var plainText = "";
		
		//let messagesCount = Object.keys(messages.msgs).length;
		var i;
		for (i in messages.msgs) {
			if (messages.msgs[i].type == 1) {
				// check if input string is ascii or other code.
				if (eventHandler.checkAscii(messages.msgs[i].content)) {
					continue;
				}
				plainText = plainText + messages.msgs[i].content + "\n";
				//console.log(messages.msgs[i].content);
			}			
		}
		
		//console.log("makePlainText: " + plainText);
		return plainText;				
	}
	
	checkAscii(inputString) {
		for (let i = 0, n = inputString.length; i < n; i++) {
			if (inputString.charCodeAt(i) > 255) {
				console.log("from checkAscii(), we found some string that contains out of ascii code.");
				return true;
			}
		}
		return false;
	}

}

const eventHandler = new EventHandler();
module.exports = eventHandler;
