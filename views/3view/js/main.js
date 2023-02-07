//var domain = "http://192.168.1.14:3006";
var domain = "http://localhost:3006";

var socket = io.connect("http://localhost:3006",{
//var socket = io.connect("http://192.168.1.14:3006",{
  cors: { origin: '*' }
});

var chart= [];
var channelOption = [];
var mvData = [];
//channel: 1단,2단.... / min: 모니터링각도 최소단위 / max: 모니터링각도 최대단위 / allowable: 허용오차 / mnmt: 관리오차 / lower: 하한값 / condition: 조건값 / rpsvs: 검출민감도 / part1: 부분오차1 / partMin1: 부분오차 최소범위 / partMax1: 부분오차 최대범위
var sampleData = [
	{"channel": 1, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 2, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 3, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 4, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 5, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 6, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 7, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 8, "min": 0, "max": 2160, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 0, "partMin1": 0, "partMax1": 360, "part2": 0, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false}
];

var defaultData = [
	//channel: 채널명
	//active: 활성화 (1: 활성화, 0: 비활성화)
	//erDtc: 불량검출법 (1: 추종오차, 2: 자동상환, 3: 수동상환)
	//signal: 신호표현 (1: 민감, 2:하중)
	//autoAble: 자동허용오차 (1: 적용, 0: 미적용)
	//autoArea: 영역자동설정 (1: 적용, 0: 미적용)
	{channel: 1, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 2, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 3, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 4, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 5, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 6, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 7, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
	{channel: 8, active: 1, erDtc: 1, signal: 1, autoAble:1, autoArea: 1},
];

if(localStorage.getItem("channelOption") == null){
	localStorage.setItem("channelOption", JSON.stringify(defaultData));
	channelOption = defaultData;
}else{
	channelOption = JSON.parse(localStorage.getItem("channelOption"));
}

if(localStorage.getItem("mvData") == null){
	mvData = sampleData;
}else{
	mvData = JSON.parse(localStorage.getItem("mvData"));
}

var currentData = [];
var albMin = []; //허용오차 배열 최소
var albMax = []; //허용오차 배열 최대
var mnmtMin = []; //관리오차 배열 최소
var mnmtMax = []; //관리오차 배열 최대
var labels = [];
var lowerHide = [false, false, false, false, false, false, false, false];
var lower = [];
var conditionHide = [false, false, false, false, false, false, false, false];
var condition = [];
var partMin1 = 0;
var partMax1 = 360;
var partMin2 = 0;
var partMax2 = 360;
var partMin16 = [];
var partMax16 = [];
var partMin26 = [];
var partMax26 = [];

$(function () {
	setChannel();
	getSetting();
});


function getChart(){
	for(var i=1;i<=channelOption.length;i++){
		var arrNum = i-1;
		chart[i] = new Chart(document.getElementById("canvas"+i), {
			type: 'line',
			data: {
			  labels: labels,
			  datasets: [{
				data: currentData,
				fill: false,
				borderColor: 'rgb(255, 255, 0)',
				borderWidth: 2,
				pointRadius: 0,
				order: 3
			  },
			  {
				data: mnmtMin[arrNum],
				borderColor: 'rgba(60, 179, 133, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(60, 179, 133, 1)',
				fill: '1',
				order: 5
			  },
			  {
				data: mnmtMax[arrNum],
				borderColor: 'rgba(60, 179, 133, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(60, 179, 133, 1)',
				fill: '1',
				order: 5
			  },
			  {
				data: albMin[arrNum],
				borderColor: 'rgba(26, 84, 132, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(26, 84, 132, 1)',
				fill: '-1',
				order: 8
			  },
			  {
				data: albMax[arrNum],
				borderColor: 'rgba(26, 84, 132, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(26, 84, 132, 1)',
				fill: '-1',
				order: 8
			  },
			  {
				data: lower[arrNum],
				fill: false,
				borderColor: 'rgb(255, 0, 0)',
				borderWidth: 2,
				pointRadius: 0,
				order: 1,
				borderDash: [2, 2],
				hidden: lowerHide[arrNum]
			  },
			  {
				data: condition[arrNum],
				fill: false,
				borderColor: 'rgb(255, 0, 0)',
				borderWidth: 2,
				pointRadius: 0,
				order: 1,
				borderDash: [8, 3, 3, 3],
				hidden: conditionHide[arrNum]
			  },
			  {
				data: partMin16[arrNum],
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(22, 118, 90, 1)',
				fill: '1',
				order: 4,
				hidden: false
			  },
			  {
				data: partMax16[arrNum],
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(22, 118, 90, 1)',
				fill: '1',
				order: 4,
				hidden: false
			  },
			  {
				data: partMin26[arrNum],
				borderColor: 'rgba(23, 130, 154, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(23, 130, 154, 1)',
				fill: '1',
				order: 4,
				hidden: false
			  },
			  {
				data: partMax26[arrNum],
				borderColor: 'rgba(23, 130, 154, 1)',
				borderWidth: 0,
				pointRadius: 0,
				backgroundColor: 'rgba(23, 130, 154, 1)',
				fill: '1',
				order: 4,
				hidden: false
			  }]
			},
			options: {
				animation: false,
				plugins: {
					legend: {
						display: false
					},
				},
				responsive: false,
				tooltips: {
				  enabled: false,
				  display: false
				},
				legend:{
					display:false
				},
				scales: {
					x: {
						ticks: {
							beginAtZero: true,
							minRotation: 360,
							stepSize: 1000,
							maxTicksLimit: 10			
						},
						display: true,
					},
					y: {
						 type: 'linear',
						 display: true,
						 ticks:{
							beginAtZero: true
						 }
					}
				},
				onClick: function(point, event) {
				  console.log(point.chart.canvas.id.substr(6,1));
				  location.href="./detail.html?id="+point.chart.canvas.id.substr(6,1);
				},
			}
		});

		
		if(channelOption[arrNum].active == 0){
			$("#graphBox"+channelOption[arrNum].channel).css("display","none");
		}
	}

	if(localStorage.getItem("STATUS") == "03"){
		getStts();
	}else if(localStorage.getItem("STATUS") == "01"){
		getSocket();
	}
}

function historyBack(){
	history.back();
}

function changeCnl(opt){
	var changeUID = UID;
	if(opt == "minus"){
		changeUID = parseInt(changeUID)-1;
		if(changeUID < 1){
			changeUID = 8;
		}
		location.href="./detail.html?id="+changeUID;
	}else if(opt == "plus"){
		changeUID = parseInt(changeUID)+1;
		if(changeUID > 8){
			changeUID = 1;
		}
		location.href="./detail.html?id="+changeUID;
	}
}

function getSocket(){

    socket.on('msg', function (res) {
			var data = JSON.parse(res);
			var sensorData = data.DATA;
			var channel = data.CHANNEL;
			
			if(data.STATUS == "02"){
				$("#mnmtError").css("display", "none");
				$("#output3").removeClass("output-error");
				$("#graphTitle"+data.CHANNEL).removeClass("error-top2");
			}else if(data.STATUS == "03"){
				$("#allowableError").css("display", "flex");
				$("#output2").addClass("output-error");
				$("#graphTitle"+data.CHANNEL).removeClass("error-top2");
				$("#graphTitle"+data.CHANNEL).addClass("error-top");
				localStorage.setItem("STATUS", "03");
			}else if(data.STATUS == '04'){
				$("#output3").addClass("output-error");
				$("#graphTitle"+channel).addClass("error-top2");
			}
			
			//currentData = sensorData.slice(mvData[actNum].min, Number(mvData[actNum].max)+1);
			peak = Math.max.apply(null, sensorData);
			$("#peak"+channel).text(peak);
			chart[channel].data.labels = labels;
			chart[channel].data.datasets[0].data = sensorData;
			chart[channel].update();
    });
}

function getStart(){

	$("#allowableError").css("display", "none");
	$("#output2").removeClass("output-error");
	for(var i=1;i<=8;i++){
		$("#graphTitle"+i).removeClass("error-top");
	}

	$.ajax({
	  type    : "POST",
	  url        : domain+"/api/sensor/start",
	  dataType:"json",
	  headers: {
		   "content-type": "application/json"
	  },
	  beforeSend:function(){
        $('#loading').css("display","block");
	  },
	  complete:function(){
        $('#loading').css('display',"none");
	  },
	  data: JSON.stringify({
			STATUS: "01", //01: 시작, 02: 진행중, 03: 에러, 04: 정지
			CHANNEL: [1,2,3,4,5,6,7,8],
			DATA: ""
	  }),
	  async: false
	}).done(function (result, textStatus, xhr) {
		if(result.status == 200){
			//console.log(result);
			localStorage.setItem("STATUS", "01");
			getSocket();
		}else{
            alert(result.message);
        } 
	}).fail(function(result, textStatus, errorThrown){
	  if(result.status == 403){
			alert(result);
		}else{
		    alert("전송실패");
            console.log(result);
		}
	});
};

function getSetting(){
	
	$.ajax({
	  type    : "POST",
	  url        : domain+"/api/sensor/setting",
	  dataType:"json",
	  headers: {
		   "content-type": "application/json"
	  },
	  beforeSend:function(){
        $('#loading').css("display","block");
	  },
	  complete:function(){
        $('#loading').css('display',"none");
	  },
	  data: JSON.stringify({
			STATUS: "01", //01: 시작, 02: 진행중: 03: 에러
			CHANNEL: [1,2,3,4,5,6,7,8],
			DATA: mvData
	  }),
	  async: false
	}).done(function (result, textStatus, xhr) {
		if(result.status == 200){
			var jsonResult = result.data;
			albMax = jsonResult.albMax;
			albMin = jsonResult.albMin;
			labels = jsonResult.labels;
			mnmtMin = jsonResult.mnmtMin;
			mnmtMax = jsonResult.mnmtMax;
			lower = jsonResult.lower;
			condition = jsonResult.condition;
			partMin16 = jsonResult.partMin16;
			partMax16 = jsonResult.partMax16;
			partMin26 = jsonResult.partMin26;
			partMax26 = jsonResult.partMax26;

			console.log(jsonResult);
			for(var i in lower){
				if(lower[i][0] == 0){
					lowerHide[i] = true;
				}else{
					lowerHide[i] = false;
				}
			}

			for(var i in condition){
				if(condition[i][0] == 0){
					conditionHide[i] = true;
				}else{
					conditionHide[i] = false;
				}
			}

			getChart();
			localStorage.setItem("mvData", JSON.stringify(mvData));
		}else{
            alert(result.message);
        } 
	}).fail(function(result, textStatus, errorThrown){
	  if(result.status == 403){
			alert(result);
		}else{
		    alert("전송실패");
            console.log(result);
		}
	});
}

function getStts(){
	$.ajax({
	  type    : "POST",
	  url        : domain+"/api/sensor/status",
	  dataType:"json",
	  headers: {
		   "content-type": "application/json"
	  },
	  beforeSend:function(){
        $('#loading').css("display","block");
	  },
	  complete:function(){
        $('#loading').css('display',"none");
	  },
	  async: false
	}).done(function (result, textStatus, xhr) {
		if(result.status == 200){
			var jsonResult = result.data;
			console.log(result);
			
			for(var i in jsonResult){
				if(jsonResult[i].length != 0){
					var channel = jsonResult[i].CHANNEL;
					
					var sensorData = jsonResult[i].DATA;
					var arrNum = Number(channel)+1;

					peak = Math.max.apply(null, sensorData);
					$("#peak"+arrNum).text(peak);
					//currentData = sensorData.slice(mvData[c].min, Number(mvData[actNum].max)+1);
					chart[channel].data.datasets[0].data = sensorData;
					chart[channel].update();
					
					if(jsonResult[i].STATUS == '03'){
						$("#allowableError").css("display", "flex");
						$("#output2").addClass("output-error");
						$("#graphTitle"+channel).addClass("error-top");
					}else if(jsonResult[i].STATUS == '04'){
						if ($("#allowableError").css("display") != "flex") { 
							$("#mnmtError").css("display", "flex");
							$("#output3").addClass("output-error");
							$("#graphTitle"+channel).addClass("error-top2");
						}
					}
				}
			}

		}
	}).fail(function(result, textStatus, errorThrown){
	  if(result.status == 403){
			alert(result);
		}else{
		    alert("전송실패");
            console.log(result);
		}
	});
};

function setChannel(){
	$.ajax({
	  type    : "POST",
	  url        : domain+"/api/sensor/channel",
	  dataType:"json",
	  headers: {
		   "content-type": "application/json"
	  },
	  beforeSend:function(){
        $('#loading').css("display","block");
	  },
	  complete:function(){
        $('#loading').css('display',"none");
	  },
	  data: JSON.stringify({
		CHANNEL: channelOption
	  }),
	  async: false
	}).done(function (result, textStatus, xhr) {
		var jsonResult = result.data;
		console.log(jsonResult);

		localStorage.setItem("channelOption", JSON.stringify(channelOption));
		channelOption = JSON.parse(localStorage.getItem("channelOption"));
		
		var actLeng = 0; //활성화 그래프 갯수
		var lastChartNum = 0;
		for(var i in channelOption){
			if(channelOption[i].active == 1){
				actLeng = actLeng+1;
				lastChartNum = channelOption[i].channel;
			}
		}
		
	
		if(actLeng == 7){
			$("#graphUl li:nth-child("+lastChartNum+")").css("width","868px");
			$("#graphUl li:nth-child("+lastChartNum+") .main-canvas").css("width","868px");
		}else if(actLeng == 6){
			$("#graphUl li").css("height","217px");
			$("#graphUl li .main-canvas").css("height","187px");
		}else if(actLeng == 5){
			$("#graphUl li").css("height","217px");
			$("#graphUl li .main-canvas").css("height","187px");
			$("#graphUl li:nth-child("+lastChartNum+")").css("width","868px");
			$("#graphUl li:nth-child("+lastChartNum+") .main-canvas").css("width","868px");
		}else if(actLeng == 4){
			$("#graphUl li").css("height","327px");
			$("#graphUl li .main-canvas").css("height","297px");
		}else if(actLeng == 3){
			$("#graphUl li").css("height","217px");
			$("#graphUl li").css("width","868px");
			$("#graphUl li .main-canvas").css("height","187px");
			$("#graphUl li .main-canvas").css("width","868px");
		}else if(actLeng == 2){
			$("#graphUl li").css("height","327px");
			$("#graphUl li").css("width","868px");
			$("#graphUl li .main-canvas").css("height","297px");
			$("#graphUl li .main-canvas").css("width","868px");
		}else if(actLeng == 1){
			$("#graphUl li").css("height","664px");
			$("#graphUl li").css("width","868px");
			$("#graphUl li .main-canvas").css("height","630px");
			$("#graphUl li .main-canvas").css("width","868px");
		}

	}).fail(function(result, textStatus, errorThrown){
	  if(result.status == 403){
			alert("전송실패");
            console.log(result);
		}else{
		    alert("전송실패");
            console.log(result);
		}
	});
}