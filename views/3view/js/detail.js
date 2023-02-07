// domain = "http://192.168.1.14:3006";
var domain = "http://localhost:3006";
//var socket = io.connect("http://192.168.1.14:3006",{
var socket = io.connect("http://localhost:3006",{
  cors: { origin: '*' }
});
var UID = getParam("id");
var actNum = Number(UID)-1;
var channelOption = [];
var graphLd = false;
var mvData = [];
//channel: 1단,2단.... / min: 모니터링각도 최소단위 / max: 모니터링각도 최대단위 / allowable: 허용오차 / mnmt: 관리오차 / lower: 하한값 / condition: 조건값 / rpsvs: 검출민감도 / part1: 부분오차1 / partMin1: 부분오차 최소범위 / partMax1: 부분오차 최대범위
var sampleData = [
	{"channel": 1, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 2, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 3, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 4, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 5, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 6, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 7, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false},
	{"channel": 8, "min": 0, "max": 360, "allowable": 20, "mnmt": 50, "lower": 0, "condition": 0, "rpsvs": 0, "part1": 50, "partMin1": 0, "partMax1": 360, "part2": 50, "partMin2": 0, "partMax2": 360, "partToggle1": false, "partToggle2": false}
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

if(localStorage.getItem("mvData") == null){
	localStorage.setItem("mvData", JSON.stringify(sampleData));
	mvData = sampleData;
}else{
	mvData = JSON.parse(localStorage.getItem("mvData"));
}

if(localStorage.getItem("channelOption") == null){
	localStorage.setItem("channelOption", JSON.stringify(defaultData));
	channelOption = defaultData;
}else{
	channelOption = JSON.parse(localStorage.getItem("channelOption"));
}

//학습데이터
var gData = [];

var albMin = []; //허용오차 배열 최소
var albMax = []; //허용오차 배열 최대
var mnmtMin = []; //관리오차 배열 최소
var mnmtMax = []; // 관리오차 배열 최대
var labels = []; //X축 기준설정
var currentData = [];
var lower = []; //하한값
var condition = [];//조건값
var mnmtHide = false;
var lowerHide = false;
var conditionHide = false;
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

	if(channelOption[actNum].erDtc == 3){
		$("#allowable").attr("max", 16383);
	}
	partMin1 = mvData[actNum].partMin1;
	partMax1 = mvData[actNum].partMax1;
	partMin2 = mvData[actNum].partMin2;
	partMax2 = mvData[actNum].partMax2;

	$("#part2").val(mvData[actNum].part2);
	$("#part1").val(mvData[actNum].part1);
	$("#channel").text(getParam("id"));
	$("#allowable").val(mvData[actNum].allowable);
	$("#mnmt").val(mvData[actNum].mnmt);
	$("#rpsvs").val(mvData[actNum].rpsvs);
	$("#lower").val(mvData[actNum].lower);
	$("#condition").val(mvData[actNum].condition);
	$("#graphMin").val(mvData[actNum].min);
	$("#graphMax").val(mvData[actNum].max);

	  $("#slider-range").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin1, partMax1],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }
		  $("#partMin1").val(ui.values[0]);
		  $("#partMax1").val(ui.values[1]);

		  mvData[actNum].partMin1 = Number($("#partMin1").val());
		  mvData[actNum].partMax1 = Number($("#partMax1").val());
		
		  getSetting();
		}
	  });
	
	  
	  $("#partMin1").val($("#slider-range").slider("values", 0));
	  $("#partMax1").val($("#slider-range").slider("values", 1));

	  $("#slider-range2").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin2, partMax2],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }
		  		  
		  $("#partMin2").val(ui.values[0]);
		  $("#partMax2").val(ui.values[1]);

		  mvData[actNum].partMin2 = Number($("#partMin2").val());
		  mvData[actNum].partMax2 = Number($("#partMax2").val());

		  getSetting();
		}
	  });

	  
	  $("#partMin2").val($("#slider-range2").slider("values", 0));
	  $("#partMax2").val($("#slider-range2").slider("values", 1));

	  $("#slider-range .ui-slider-range").append("<div class='poly-box' id='polyLine1'><div class='poly-line1'></div><div class='poly-line2'></div></div>");
	  $("#slider-range2 .ui-slider-range").append("<div class='poly-box' id='polyLine2'><div class='poly-line3'></div><div class='poly-line4'></div></div>");

	  if(mvData[actNum].partToggle1 == true){
		$("#divToggleBtn1").attr("src", "../images/ON_ICON.png");
		$(".division-bg1").css("filter", "grayscale(0%)");
		$("#divCover1").css("display","none");
		$("#polyLine1").css("display","block");
	}

	if(mvData[actNum].partToggle2 == true){
		$("#divToggleBtn2").attr("src", "../images/ON_ICON.png");
		$(".division-bg2").css("filter", "grayscale(0%)");
		$("#divCover2").css("display","none");
		$("#polyLine2").css("display","block");
	}
	
	// update $('#slider-range').slider( "option", "max", 100);
	getSetting();
});

function getChart(){
	chart = new Chart(document.getElementById("canvas1"), {
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
			data: mnmtMin[actNum],
			borderColor: 'rgba(60, 179, 133, 1)',
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(60, 179, 133, 1)',
			fill: '1',
			order: 4,
			hidden: false
		  },
		  {
			data: mnmtMax[actNum],
			borderColor: 'rgba(60, 179, 133, 1)',
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(60, 179, 133, 1)',
			fill: '1',
			order: 4,
			hidden: false
		  },
		  {
			data: albMin[actNum],
			borderColor: 'rgba(26, 84, 132, 1)',
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(26, 84, 132, 1)',
			fill: '-1',
			order: 5,
			hidden: false
		  },
		  {
			data: albMax[actNum],
			borderColor: 'rgba(26, 84, 132, 1)',
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(26, 84, 132, 1)',
			fill: '-1',
			order: 5,
			hidden: false
		  },
		  {
			data: lower[actNum],
			fill: false,
			borderColor: 'rgb(255, 0, 0)',
			borderWidth: 2,
			pointRadius: 0,
			order: 1,
			borderDash: [2, 2],
			hidden: lowerHide
		  },
		  {
			data: condition[actNum],
			fill: false,
			borderColor: 'rgb(255, 0, 0)',
			borderWidth: 2,
			pointRadius: 0,
			order: 1,
			borderDash: [8, 3, 3, 3],
			hidden: conditionHide
		  },
		  {
			data: partMin16[actNum],
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(22, 118, 90, 1)',
			fill: '1',
			order: 4,
			hidden: false
		  },
		  {
			data: partMax16[actNum],
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(22, 118, 90, 1)',
			fill: '1',
			order: 4,
			hidden: false
		  },
		  {
			data: partMin26[actNum],
			borderColor: 'rgba(23, 130, 154, 1)',
			borderWidth: 0,
			pointRadius: 0,
			backgroundColor: 'rgba(23, 130, 154, 1)',
			fill: '1',
			order: 4,
			hidden: false
		  },
		  {
			data: partMax26[actNum],
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
			hover: {mode: null},
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
					min: Number($("#graphMin").val()),
					max: Number($("#graphMax").val()),
					ticks: {
						minRotation: 360,
						maxTicksLimit: 4
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
			  console.log(point.srcElement.id);
			},
		}
	});
}

function historyBack(){
	history.back();
}

$("#slider-range").click(function () {
  var min_price = $('#min_price').val();
  var max_price = $('#max_price').val();
});

$("#slider-range2").click(function () {
  var min_price = $('#min_price2').val();
  var max_price = $('#max_price2').val();
});

$("#divToggleBtn1").on("click", function(){
	if($(this).attr("src") == "../images/OFF_ICON.png"){
		mvData[actNum].partToggle1 = true;
		$(this).attr("src", "../images/ON_ICON.png");
		$(".division-bg1").css("filter", "grayscale(0%)");
		$("#divCover1").css("display","none");
		$("#polyLine1").css("display","block");

		mvData[actNum].part1 = Number($("#part1").val());
		mvData[actNum].partMin1 = Number($("#partMin1").val());
		mvData[actNum].partMax1 = Number($("#partMax1").val());

		getSetting();	
	}else{
		mvData[actNum].partToggle1 = false;
		$(this).attr("src", "../images/OFF_ICON.png");
		$(".division-bg1").css("filter", "grayscale(100%)");
		$("#divCover1").css("display","block");
		$("#polyLine1").css("display","none");

		getSetting();
	}
});

$("#divToggleBtn2").on("click", function(){
	if($(this).attr("src") == "../images/OFF_ICON.png"){
		mvData[actNum].partToggle2 = true;
		$(this).attr("src", "../images/ON_ICON.png");
		$(".division-bg2").css("filter", "grayscale(0%)");
		$("#divCover2").css("display","none");
		$("#polyLine2").css("display","block");

		mvData[actNum].part2 = Number($("#part2").val());
		mvData[actNum].partMin2 = Number($("#partMin2").val());
		mvData[actNum].partMax2 = Number($("#partMax2").val());

		getSetting();	
	}else{
		mvData[actNum].partToggle2 = false;
		$(this).attr("src", "../images/OFF_ICON.png");
		$(".division-bg2").css("filter", "grayscale(100%)");
		$("#divCover2").css("display","block");
		$("#polyLine2").css("display","none");

		getSetting();	
	}
});

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

function allowable(){
	mvData[actNum].allowable = $("#allowable").val();
	console.log(mvData[actNum].allowable);
	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].allowable = uncomma($("#allowable").val());
		}
	}
	
	getSetting();	
}

function mnmt(){
	mvData[actNum].mnmt = $("#mnmt").val();

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].mnmt = Number($("#mnmt").val());
		}
	}
	
	getSetting();	
}

function lower1(){
	mvData[actNum].lower = $("#lower").val();

	if(mvData[actNum].lower == 0){
		chart.data.datasets[5].hidden = true;
	}else{
		chart.data.datasets[5].hidden = false;
	}

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].lower = Number($("#lower").val());
		}
	}

	getSetting();
}

function condition1(){
	
	mvData[actNum].condition = $("#condition").val();

	if(mvData[actNum].condition == 0){
		chart.data.datasets[6].hidden = true;
	}else{
		chart.data.datasets[6].hidden = false;
	}

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].condition = Number($("#condition").val());
		}
	}

	getSetting();	
}

function rpsvs(){
	mvData[actNum].rpsvs = $("#rpsvs").val();

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].rpsvs = Number($("#rpsvs").val());
		}
	}

	getSetting();	
}

function part1(){
	mvData[actNum].part1 = Number($("#part1").val());

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].part1 = Number($("#part1").val());
		}
	}

	getSetting();	
}

function part2(){
	mvData[actNum].part2 = Number($("#part2").val());

	for(var i in mvData){
		if(mvData[i].channel == UID){
			mvData[i].part2 = Number($("#part2").val());
		}
	}

	getSetting();	
}

function graphMin(){

	mvData[actNum].min = $("#graphMin").val();

	$("#slider-range").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin1, partMax1],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }

		  $("#partMin1").val(ui.values[0]);
		  $("#partMax1").val(ui.values[1]);

		  mvData[actNum].partMin1 = Number($("#partMin1").val());
		  mvData[actNum].partMax1 = Number($("#partMax1").val());

		  getSetting();
		}
	  });

	  $("#partMin1").val($("#slider-range").slider("values", 0));
	  $("#partMax1").val($("#slider-range").slider("values", 1));

	  $("#slider-range2").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin2, partMax2],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }
		  
		  $("#partMin2").val(ui.values[0]);
		  $("#partMax2").val(ui.values[1]);

		  mvData[actNum].partMin2 = Number($("#partMin2").val());
		  mvData[actNum].partMax2 = Number($("#partMax2").val());

		  getSetting();
		}
	  });

	  
	  $("#partMin2").val($("#slider-range2").slider("values", 0));
	  $("#partMax2").val($("#slider-range2").slider("values", 1));
	
	chart.options.scales.x = {
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		ticks: {
			minRotation: 360,
			maxTicksLimit: 4
		},
		display: true,
	}
	
	chart.update();
	localStorage.setItem("mvData", JSON.stringify(mvData));
}

function graphMax(){
	mvData[actNum].max = $("#graphMax").val();

	$("#slider-range").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin1, partMax1],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }

		  $("#partMin1").val(ui.values[0]);
		  $("#partMax1").val(ui.values[1]);

		  mvData[actNum].partMin1 = Number($("#partMin1").val());
		  mvData[actNum].partMax1 = Number($("#partMax1").val());

		  getSetting();
		}
	  });

	  $("#slider-range2").slider({
		range: true,
		orientation: "horizontal",
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		values: [partMin2, partMax2],
		step: 1,

		slide: function (event, ui) {
		  if (ui.values[0] == ui.values[1]) {
			  return false;
		  }
		  
		  $("#partMin2").val(ui.values[0]);
		  $("#partMax2").val(ui.values[1]);

		  mvData[actNum].partMin2 = Number($("#partMin2").val());
		  mvData[actNum].partMax2 = Number($("#partMax2").val());

		  getSetting();
		}
	  });


	chart.options.scales.x = {
		min: Number($("#graphMin").val()),
		max: Number($("#graphMax").val()),
		ticks: {
			minRotation: 360,
			maxTicksLimit: 4
		},
		display: true,
	}
	
	chart.update();
	localStorage.setItem("mvData", JSON.stringify(mvData));
}

function getSocket(){
    socket.on('msg', function (res) {
			//var data = JSON.parse(res);
			var data = JSON.parse(res);
			var sensorData = data.DATA;
			

			if(getParam("id") == data.CHANNEL){
				if(data.STATUS == "02"){
					
					$("#mnmtError").css("display", "none");
					$("#output3").removeClass("output-error");
					$("#topLevel").removeClass("error-top2");
				
				}else if(data.STATUS == "03"){
					if(getParam("id") == data.CHANNEL){
						$("#allowableError").css("display", "flex");
						$("#output2").addClass("output-error");
						$("#topLevel").addClass("error-top");
						localStorage.setItem("STATUS", "03");
					}else{
						$("#allowableError").css("display", "flex");
						$("#output2").addClass("output-error");
						localStorage.setItem("STATUS", "03");
					}
				}else if(data.STATUS == "04"){
					if(getParam("id") == data.CHANNEL){
						$("#mnmtError").css("display", "flex");
						$("#output3").addClass("output-error");
						$("#topLevel").addClass("error-top2");
					}else{
						
					}
				}

				peak = Math.max.apply(null, sensorData);
				$("#peak").text(peak);
				//currentData = sensorData.slice(mvData[actNum].min, Number(mvData[actNum].max)+1);

				//chart.data.labels = labels;
				chart.data.datasets[0].data = sensorData;
				chart.update();

				var pqTemp = data.PQ;
				var pqData = pqTemp.toFixed(1);
				var pqValue = (100 - pqData) * 0.1;
				var pqHeight = Number(100 - pqData) + "%";

				$("#pqAct").css("bottom", pqHeight);
				$("#pqData").text(pqValue.toFixed(1));
			}
				
			
    });
}

function getStart(){

	$("#allowableError").css("display", "none");
	$("#output2").removeClass("output-error");
	$("#topLevel").removeClass("error-top");

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
			console.log(jsonResult);
			var arrNum = getParam("id") -1;
			var sensorData = jsonResult[arrNum].DATA;
			
			peak = Math.max.apply(null, sensorData);
			$("#peak").text(peak);
			//currentData = sensorData.slice(mvData[actNum].min, Number(mvData[actNum].max)+1);

			chart.data.labels = labels;
			chart.data.datasets[0].data = sensorData;
			chart.update();
			
			for(var i in jsonResult){
				if(jsonResult[arrNum].STATUS == '03'){
					$("#allowableError").css("display", "flex");
					$("#output2").addClass("output-error");
					$("#topLevel").addClass("error-top");
				}else{
					$("#allowableError").css("display", "flex");
					$("#output2").addClass("output-error");
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
			DATA: mvData
	  }),
	  async: false
	}).done(function (result, textStatus, xhr) {
		if(result.status == 200){
			var jsonResult = result.data;
			console.log(jsonResult);
			gData = jsonResult;

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
			
			if(lower[actNum][0] == 0){
				lowerHide = true;
			}else{
				lowerHide = false;
			}

			if(condition[actNum][0] == 0){
				conditionHide = true;
			}else{
				conditionHide = false;
			}

			if(graphLd == false){ //그래프로딩
				graphLd = true;
				getChart();

				if(localStorage.getItem("STATUS") == "03"){
					getStts();
				}else if(localStorage.getItem("STATUS") == "01"){
					getSocket();
				}
			}else{ //그래프 업데이트
				chart.data.datasets[1].data = mnmtMin[actNum];
				chart.data.datasets[2].data = mnmtMax[actNum];
				chart.data.datasets[3].data = albMin[actNum];
				chart.data.datasets[4].data = albMax[actNum];
				chart.data.datasets[5].data = lower[actNum];
				chart.data.datasets[6].data = condition[actNum];
				chart.data.datasets[7].data = partMin16[actNum];
				chart.data.datasets[8].data = partMax16[actNum];
				chart.data.datasets[9].data = partMin26[actNum];
				chart.data.datasets[10].data = partMax26[actNum];
				chart.update();
			}

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