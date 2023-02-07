//server.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const process = require("process");
const mqtt = require('mqtt');
const nowDate = require('date-utils'); 
const path = require('path'); 
const { check } = require('express-validator');
const { getError } = require('./api/config/requestError.js');
var http = require("http").createServer(app);
var io = require('socket.io')(http, { cors: { origin: "*" } });
var port = 3006;
var client  = mqtt.connect('mqtt://localhost:1883'); 

http.listen(port, () => {
  console.log("listening on *:" + port);
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "100mb", extended: false }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        if (err) 
            return res.status(400).json({status: 400, data: {err: err}, message: "fail"});

        next();
    });
});
app.use(express.urlencoded( {extended : false } ));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static('views'));

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); //cross origin
	res.header('Access-Control-Allow-Headers', 'content-type, x-access-token, token');
	next();
});

// API
//app.use('/api/sensor', require('./api/sensor.js'));


// SOCKET IO

io.on('connection', function (socket) {
	console.log(socket.id, 'Connected');
	//socket.emit('msg', `${socket.id} 연결 되었습니다.`);
	socket.on('msg', function (data) {
		socket.emit('msg', data);
	});
});

// MQTT

var client  = mqtt.connect('mqtt://localhost:1883'); 
var topicId;

//
var stts;
var mvData = [[],[],[],[],[],[],[],[]]; //세팅값
var channelOption = []; //채널 옵션
var gData = [[],[],[],[],[],[],[],[]]; //학습데이터
var albMin = [[],[],[],[],[],[],[],[]]; //허용오차 최소범위
var albMax = [[],[],[],[],[],[],[],[]]; // 허용오차 최대범위
var mnmtMin = [[],[],[],[],[],[],[],[]]; //관리오차 최소범위
var mnmtMax = [[],[],[],[],[],[],[],[]]; //관리오차 최대범위
var lower = [[],[],[],[],[],[],[],[]]; //하한값
var condition = [[],[],[],[],[],[],[],[]]; //조건값
var labels = [];
var peak = [[],[],[],[],[],[],[],[]];
var sensorData = []; //센서에서 들어오는값 저장
var lastData = [[],[],[],[],[],[],[],[]]; //마지막 데이터 저장
var rpsvs = [0,0,0,0,0,0,0,0]; //검출민감도 카운트
var part1= [];
var part2= [];
var partMin1= [[],[],[],[],[],[],[],[]];
var partMax1= [[],[],[],[],[],[],[],[]];
var partMin2= [[],[],[],[],[],[],[],[]];
var partMax2= [[],[],[],[],[],[],[],[]];

//화면단으로 보낼 6의배수값 2160개의 데이터를 360개 데이터로 변환
var labels6 = [];
var albMin6 = [[],[],[],[],[],[],[],[]]; //허용오차 최소범위 6의 배수
var albMax6 = [[],[],[],[],[],[],[],[]]; // 허용오차 최대범위 6의 배수
var mnmtMin6 = [[],[],[],[],[],[],[],[]]; //관리오차 최소범위 6의 배수
var mnmtMax6 = [[],[],[],[],[],[],[],[]]; //관리오차 최대범위 6의 배수
var lower6 = [[],[],[],[],[],[],[],[]]; //하한값 6의 배수
var condition6 = [[],[],[],[],[],[],[],[]]; //조건값 6의 배수
var totalMin= [[],[],[],[],[],[],[],[]]; //허용오차 최소
var totalMax= [[],[],[],[],[],[],[],[]];; //허용오차 최대
var totalCurrent= [[],[],[],[],[],[],[],[]]; // 현재 데이터의 합 저장
var totalTemp = [[],[],[],[],[],[],[],[]]; //마지막 데이터의 합 저장
var pqAbs = [[],[],[],[],[],[],[],[]]; // PQ절대값(기준)
var partMin16 = [[],[],[],[],[],[],[],[]];
var partMax16 = [[],[],[],[],[],[],[],[]];
var partMin26 = [[],[],[],[],[],[],[],[]];
var partMax26 = [[],[],[],[],[],[],[],[]];

client.on('connect', function () {
	console.log("mqtt_connect");
    client.subscribe('#'); // subscribe
});
 
client.on('message', function (topic, message) {
	  sensorData = message.toString(); //sensorData에 JSON데이터 저장
      // message is Buffer
	  var result = JSON.parse(sensorData);
	  var arrNum = result.CHANNEL-1;

	  if(result.STATUS == "02"){
		  var sensorData6 = [];
		  for(var i in result.DATA){
			if(i % 6 == 0){
				sensorData6.push(result.DATA[i])
			}
		  }
		  result.DATA = sensorData6;
		  lastData[arrNum] = result;

		//io.emit('msg', sensorData);
		var arrNum = result.CHANNEL-1;

		var mnmt = mvData[arrNum].mnmt;
		getAllowable(arrNum, mnmt);
	  }else{
		 lastData[arrNum] = result;
	  }
});

app.post("/api/sensor/status", (req, res) => {
    const errors = getError(req, res);

	if(errors.isEmpty()){
        try{
			res.status(200).json({
				status: 200,
				data: lastData,
				message: "success"
			});
        } catch (err) {
            throw err;
        }
	}
});

app.post("/api/sensor/channel", (req, res) => {
    const errors = getError(req, res);
	channelOption = req.body.CHANNEL;

	if(errors.isEmpty()){
        try{
			res.status(200).json({
				status: 200,
				data: req.body.CHANNEL,
				message: "success"
			});
        } catch (err) {
            throw err;
        }
	}
});

app.post("/api/sensor/start", (req, res) => {
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

app.post("/api/sensor/setting", (req, res) => {
    const errors = getError(req, res);

	if(errors.isEmpty()){
        try{
			//mvData = req.body.DATA;
			var leng = mvData.length;
			mvData = req.body.DATA;
			//console.log(mvData);

			albMin = [[],[],[],[],[],[],[],[]]; //허용오차 최소범위
			albMax = [[],[],[],[],[],[],[],[]]; // 허용오차 최대범위
			mnmtMin = [[],[],[],[],[],[],[],[]]; //관리오차 최소범위
			mnmtMax = [[],[],[],[],[],[],[],[]]; // 관리오차 최대범위
			lower = [[],[],[],[],[],[],[],[]]; //하한값
			condition = [[],[],[],[],[],[],[],[]]; //조건값
			labels = [];
			partMin1 = [[],[],[],[],[],[],[],[]]; //부분영역1 최소
			partMax1 = [[],[],[],[],[],[],[],[]]; //부분영역1 최대
			partMin2 = [[],[],[],[],[],[],[],[]]; //부분영역2 최소
			partMax2 = [[],[],[],[],[],[],[],[]]; //부분영역2 최대

			albMin6 = [[],[],[],[],[],[],[],[]]; //허용오차 최소범위
			albMax6 = [[],[],[],[],[],[],[],[]]; // 허용오차 최대범위
			mnmtMin6 = [[],[],[],[],[],[],[],[]]; //관리오차 최소범위
			mnmtMax6 = [[],[],[],[],[],[],[],[]]; // 관리오차 최대범위
			lower6 = [[],[],[],[],[],[],[],[]]; //하한값
			condition6 = [[],[],[],[],[],[],[],[]]; //조건값
			labels6 = [];
			partMin16 = [[],[],[],[],[],[],[],[]]; 
			partMax16 = [[],[],[],[],[],[],[],[]]; 
			partMin26 = [[],[],[],[],[],[],[],[]]; 
			partMax26 = [[],[],[],[],[],[],[],[]];
			
			for(var i in mvData){
				var arrNum = mvData[i].channel-1;
				getMaxMin(arrNum);
			}
						
			res.status(200).json({
				status: 200,
				data: {
					albMin: albMin6,
					albMax: albMax6,
					labels: labels6,
					mnmtMin: mnmtMin6,
					mnmtMax: mnmtMax6,
					lower: lower6,
					condition: condition6,
					partMin16: partMin16,
					partMax16: partMax16,
					partMin26: partMin26,
					partMax26: partMax26,
					part1: part1,
					part2: part2
				},
				message: "success"
			});
			
        } catch (err) {
            throw err;
        }
	}  
});

///////////////////////// 데이터파싱 시작 /////////////////////


//학습데이터 예시 만들기 8개 채널
for (var i = 0; i < 8; i++) {
    gData[i].push(0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	1,	2,	3,	4,	5,	6,	7,	8,	9,	10,	11,	12,	13,	14,	15,	16,	17,	18,	19,	20,	21,	22,	23,	24,	25,	26,	27,	28,	29,	30,	31,	32,	33,	34,	35,	36,	37,	38,	39,	40,	41,	42,	43,	44,	45,	46,	47,	48,	49,	50,	51,	52,	53,	54,	55,	56,	57,	58,	59,	60,	60,	59,	58,	57,	56,	55,	54,	53,	52,	51,	50,	49,	48,	47,	46,	45,	44,	43,	42,	41,	40,	39,	38,	37,	36,	35,	34,	33,	32,	31,	30,	29,	28,	27,	26,	25,	24,	23,	22,	21,	20,	19,	18,	17,	16,	15,	14,	13,	12,	11,	10,	9,	8,	7,	6,	5,	4,	3,	2,	1,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0
);
	/*
	for (var j = 1; j <= 2160; j++) {
        gData[i].push(j);
    }*/
}

function getMaxMin(UID){
	var peakData = Math.max.apply(null, gData[UID]);
	var labelNum = 0;
	
	peak[UID] = peakData;
	labels = [];
	labels6 = [];
	part1[UID] = mvData[UID].part1;
	part2[UID] = mvData[UID].part2;
	
	for(var i in gData[UID]){
		labels.push(Number(i)+1);
		var minValue = gData[UID][i]-(peak[UID] * mvData[UID].allowable / 100);
		var maxValue = gData[UID][i]+(peak[UID] * mvData[UID].allowable / 100);
		var mnmtMinValue = gData[UID][i] - ((gData[UID][i] - minValue) * mvData[UID].mnmt) / 100;
		var mnmtMaxValue = gData[UID][i] + ((gData[UID][i] - minValue) * mvData[UID].mnmt) / 100;
		var lowerValue = peak[UID] * mvData[UID].lower / 100;
		var conditionValue = peak[UID] * mvData[UID].condition / 100;
		var minPart1Value;
		var maxPart1Value;
		var minPart2Value;
		var maxPart2Value;
		
		if(channelOption[UID].erDtc == 2){//자동상환
			minValue = 0;
			maxValue = peak[UID]+(peak[UID] * mvData[UID].allowable / 100);
			maxValue = maxValue + (maxValue * 0.1);
			console.log(mvData[UID].allowable);
		}else if(channelOption[UID].erDtc == 3){//수동상환
			minValue = 0;
			maxValue = mvData[UID].allowable;
		}else{//추종오차
			//부분영역1 체크
			if(mvData[UID].partToggle1 == true){
				if(mvData[UID].partMin1*6-6 > i || mvData[UID].partMax1*6 <= i){
					minPart1Value = null;
					maxPart1Value = null;
				}else{
					minPart1Value = gData[UID][i]-(peak[UID] * mvData[UID].part1 / 100);
					maxPart1Value = gData[UID][i]+(peak[UID] * mvData[UID].part1 / 100);
					minValue = minPart1Value; //허용오차에 부분영역 적용
					maxValue = maxPart1Value; //허용오차에 부분영역 적용
				}
				if(minPart1Value < 0){
					minPart1Value = 0;
				}
				partMin1[UID].push(minPart1Value);
				partMax1[UID].push(maxPart1Value);
			}

			//부분영역2 체크
			if(mvData[UID].partToggle2 == true){
				if(mvData[UID].partMin2*6-6 > i || mvData[UID].partMax2*6 <= i){
					minPart2Value = null;
					maxPart2Value = null;
				}else{
					minPart2Value = gData[UID][i]-(peak[UID] * mvData[UID].part2 / 100);
					maxPart2Value = gData[UID][i]+(peak[UID] * mvData[UID].part2 / 100);
					minValue = minPart2Value; //허용오차에 부분영역 적용
					maxValue = maxPart2Value; //허용오차에 부분영역 적용
				}
				
				if(minPart2Value < 0){
					minPart2Value = 0;
				}
				partMin2[UID].push(minPart2Value);
				partMax2[UID].push(maxPart2Value);
			}

			if(minValue < 0){
				minValue = 0;
			}

			if(mnmtMinValue < 0){
				mnmtMinValue = 0;
			}
		}

		albMin[UID].push(minValue);
		albMax[UID].push(maxValue);
		mnmtMin[UID].push(mnmtMinValue);
		mnmtMax[UID].push(mnmtMaxValue);
		lower[UID].push(lowerValue);
		condition[UID].push(conditionValue);

		if(i % 6 == 0){ //화면단으로 보낼 6의 배수 만들기
			labelNum = labelNum + 1;
			albMin6[UID].push(minValue);
			albMax6[UID].push(maxValue);
			mnmtMin6[UID].push(mnmtMinValue);
			mnmtMax6[UID].push(mnmtMaxValue);
			lower6[UID].push(lowerValue);
			condition6[UID].push(conditionValue);
			labels6.push(labelNum);

			if(mvData[UID].partToggle1 == true){
				partMin16[UID].push(minPart1Value);
				partMax16[UID].push(maxPart1Value);
			}

			if(mvData[UID].partToggle2 == true){
				partMin26[UID].push(minPart2Value);
				partMax26[UID].push(maxPart2Value);
			}
		}
		///////////////////////// 데이터 만들기 종료 /////////////////////////////
	}

	totalMax[UID] = albMax[UID].reduce(function add(sum, currValue) {
	  return sum + currValue;
	}, 0);

	totalMin[UID] = albMin[UID].reduce(function add(sum, currValue) {
	  return sum + currValue;
	}, 0);

	pqAbs[UID] = Number(totalMax[UID])-Number(totalMin[UID]);
}

function getAllowable(arrNum, mnmt){
	UID = arrNum+1;
	var result = JSON.parse(sensorData);
	const peakNum = Math.max.apply(null, result.DATA);
	peak[arrNum] = peakNum;
	
	totalCurrent[arrNum] = result.DATA.reduce(function add(sum, currValue) {
	  return sum + currValue;
	}, 0);
	
	var pqData = (Math.abs((Number(totalCurrent[arrNum])) - Number(totalTemp[arrNum])) * 100) / pqAbs[arrNum];
	if(arrNum == 3){
		console.log({abs:pqAbs[arrNum], pq:pqData});
	}
	
	
	var sensorData6 = []; //6개당 1개씩 저장
	//허용오차 데이터
	for(var i in result.DATA){
		if(i % 6 == 0){ //화면단으로 보낼 6의 배수 만들기
			sensorData6.push(result.DATA[i]);
		}
	}

	var errorData = JSON.stringify({ //에러 데이터
			CHANNEL: UID,
			STATUS: "03", //01: 시작, 02: 진행중, 03: 에러
			DATA: sensorData6,
			PQ: pqData
	});

	var data = JSON.stringify({ //정상 데이터
			CHANNEL: UID,
			STATUS: "02", //01: 시작, 02: 진행중, 03: 에러
			DATA: sensorData6,
			PQ: pqData
	});

	totalTemp[arrNum] = totalCurrent[arrNum]; //현재데이터 담아놓고 다음데이터와 비교할대 사용

	for(var i in result.DATA){
		//허용오차 체크
		if(result.DATA[i] > albMax[arrNum][i] || result.DATA[i] <albMin[arrNum][i]){
			if(condition[arrNum][0] < result.DATA[i]){ //조건값 보다 클 경우만 오류로 판단
				//검출민감도 체크
				if(mvData[arrNum].rpsvs <= 0){
					console.log({lower:lower[arrNum][0], peak: peak[arrNum]});
					console.log(UID+"channel lower error");
					client.publish('MV900', errorData);
					io.emit('msg', errorData);
					stts = "03";
					return false;
				}else{
					rpsvs[arrNum] = Number(rpsvs[arrNum] + 1);
					if(mvData[arrNum].rpsvs > rpsvs[arrNum]){
						console.log(UID+"channel rpsvs No: " + rpsvs[arrNum]);
						io.emit('msg', data);
						stts = "02";
						return false;
					}else{
						console.log({lower:lower[arrNum][0], peak: peak[arrNum]});
						console.log(UID+"channel rpsvs No: " + rpsvs[arrNum]);
						client.publish('MV900', errorData);
						io.emit('msg', errorData);
						stts = "03";
						rpsvs[arrNum] = 0;
						return false;
					}
				}
			}
		}
	}
	
	//하한값 체크
	if(lower[arrNum][0] > 0){
		//하한값이 0보다 크면 설정 적용
		if(lower[arrNum][0] > peak[arrNum]){
			//검출민감도 체크
			if(mvData[arrNum].rpsvs <= 0){
				console.log({lower:lower[arrNum][0], peak: peak[arrNum]});
				console.log(UID+"channel lower error");
				client.publish('MV900', errorData);
				io.emit('msg', errorData);
				stts = "03";
				return false;
			}else{
				if(mvData[arrNum].rpsvs > rpsvs[arrNum]){
					rpsvs[arrNum] = Number(rpsvs[arrNum] + 1);
					console.log(UID+"channel rpsvs No: " + rpsvs[arrNum]);
					io.emit('msg', data);
					stts = "02";
					return false;
				}else{
					console.log({lower:lower[arrNum][0], peak: peak[arrNum]});
					console.log(UID+"channel rpsvs No: " + rpsvs[arrNum]);
					client.publish('MV900', errorData);
					io.emit('msg', errorData);
					stts = "03";
					rpsvs[arrNum] = 0;
					return false;
				}
			}
		}
	}

	if(mnmt > 0){
		getMnmt(arrNum, pqData);
	}else{
		rpsvs[arrNum] = 0; //검출민감도 0
		io.emit('msg', data);
		stts = "02";
	}
}


function getMnmt(arrNum, pqData){
	UID = arrNum+1;
	var result = JSON.parse(sensorData);
	var sensorData6 = []; //6개당 1개씩 저장
	
	for(var i in result.DATA){
		if(i % 6 == 0){ //화면단으로 보낼 6의 배수 만들기
			sensorData6.push(result.DATA[i]);
		}
	}
	//허용오차 데이터
	var errorData = JSON.stringify({ //관리오차 데이터
			CHANNEL: UID,
			STATUS: "04", //01: 시작, 02: 진행중, 03: 에러
			DATA: sensorData6,
			PQ: pqData
			
	});

	var data = JSON.stringify({ //정상 데이터
			CHANNEL: UID,
			STATUS: "02", //01: 시작, 02: 진행중, 03: 에러
			DATA: sensorData6,
			PQ: pqData
	});

	for(var i in result.DATA){
		if(result.DATA[i] > mnmtMax[arrNum][i]){
			//socket.off('msg');
			console.log(UID+"mnmt max error");
			client.publish('MV900', errorData);
			io.emit('msg', errorData);
			stts = "04";
			return false;
		}else if(result.DATA[i] < mnmtMin[arrNum][i]){
			console.log(UID+"mnmt min error");
			client.publish('MV900', errorData);
			io.emit('msg', errorData);
			//socket.off('msg');
			//min올휴
			stts = "04";
			return false;
		}
	}

	rpsvs[arrNum] = 0; //검출민감도 0
	io.emit('msg', data);
	stts = "02";
}