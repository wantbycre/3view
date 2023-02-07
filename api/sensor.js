const express = require('express');
const app = express();
var http = require("http").createServer(app);
const bodyParser = require('body-parser');
const process = require("process");
const mqtt = require('mqtt');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const client  = mqtt.connect('mqtt://localhost:1883'); 
const nowDate = require('date-utils'); 
const path = require('path'); 
const api = express.Router();

var mvData = [];
//gData = 학습데이터
var gData = [];
var albMin = []; //허용오차 최소범위
var albMax = []; // 허용오차 최대범위
var peak = [];
var sensorData = []; //센서에서 들어오는값 저장

//학습데이터 예시 만들기 8개 채널
for (let i = 0; i < 8; i++) {
    gData.push([]);
    for (let j = 1; j <= 2160; j++) {
        gData[i].push(j);
    }
}

client.on('connect', function () {
	console.log("mqtt_connect3");
    client.subscribe('#'); // subscribe
});

client.on('message', function (topic, message) {
	  sensorData = message.toString(); //sensorData에 JSON데이터 저장
      // message is Buffer
	  var result = JSON.parse(sensorData);
	 /*
	  if(result.STATUS == "02"){
		getAllowable(result.CHANNEL);
	  }*/
	  console.log(result);
});



api.post('/start', 
	async function (req, res) {
	const errors = getError(req, res);

	if(errors.isEmpty()){
        try{
			//console.log(req.body);
			client.publish('MV900', JSON.stringify(req.body));

			res.status(200).json({
				status: 200,
				data: "true",
				message: "success"
			});
        } catch (err) {
            throw err;
        }
	}
});

api.post('/setting', 
	async function (req, res) {
	const errors = getError(req, res);

	if(errors.isEmpty()){
        try{
			mvData = req.body.DATA;
			var leng = mvData.length;
			
			
			res.status(200).json({
				status: 200,
				data: "true",
				message: "success"
			});

			getMaxMin(leng);
        } catch (err) {
            throw err;
        }
	}  
});

function getMaxMin(leng){
	peak = [];
	
	for(var j=0;j<leng;j++){
		var peakData = Math.max.apply(null, gData[j]);
		peak.push(peakData);
		albMin.push([]);
		albMax.push([]);

		for(var i in gData[j]){
			var minValue = gData[j][i]-(peak[j] * mvData[j].allowable / 100);
			var maxValue = gData[j][i]+(peak[j] * mvData[j].allowable / 100);

			if(minValue < 0){
				minValue = 0;
			}
						
			albMin[j].push(minValue);
			albMax[j].push(maxValue);
			///////////////////////// 데이터 만들기 종료 /////////////////////////////
		}
	}
}

function getAllowable(UID){
	var Num = Number(UID)-1;
	console.log(Num);
	return false;
	for(var i in sensorData.DATA){
		if(currentData[i] > maxSlice[i]){
			socket.off('msg');
			getStop();
			//max오류
			$("#allowableError").css("display", "flex");
			$("#output2").addClass("output-error");
			$("#graphTitle"+UID).addClass("error-top");
			return false;
		}else if(currentData[i] < minSlice[i]){
			socket.off('msg');
			getStop();
			$("#allowableError").css("display", "flex");
			$("#output2").addClass("output-error");
			$("#graphTitle"+UID).addClass("error-top");
			return false;
		}
	}
}


module.exports = api;