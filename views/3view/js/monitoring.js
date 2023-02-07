var channelOption = [];
var mvData = JSON.parse(localStorage.getItem("mvData"));
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

$(function(){
	setChannel();
});

function setChannel(){
	$.ajax({
	  type    : "POST",
	  url        : "http://localhost:3006/api/sensor/channel",
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
		for(var i in jsonResult){
			var num = Number(i)+1;

			if(jsonResult[i].erDtc == 1){
				$("#erDtc"+num).html("추종오차 <br> (Envelop)");
			}else if(jsonResult[i].erDtc == 2){
				$("#erDtc"+num).text("자동상환");
			}else if(jsonResult[i].erDtc == 3){
				$("#erDtc"+num).text("수동상환");
			}

			if(jsonResult[i].signal == 1){
				$("#signal"+num).html("민감");
			}else{
				$("#signal"+num).html("하중");
			}

			if(jsonResult[i].autoAble == 1){
				$("#autoAble"+num).html("적용");
				$("#autoAble"+num).addClass("monitor-btn2-act2");
			}else{
				$("#autoAble"+num).html("미적용");
				$("#autoAble"+num).removeClass("monitor-btn2-act2");
			}

			if(jsonResult[i].autoArea == 1){
				$("#autoArea"+num).html("적용");
				$("#autoArea"+num).addClass("monitor-btn2-act2");
			}else{
				$("#autoArea"+num).html("미적용");
				$("#autoArea"+num).removeClass("monitor-btn2-act2");
			}

			if(jsonResult[i].active == 1){
				$("#channel"+jsonResult[i].channel).addClass("monitor-btn-act");
				$("#erDtc"+jsonResult[i].channel).addClass("monitor-btn2-act");
				$("#signal"+jsonResult[i].channel).addClass("monitor-btn2-act");
			}else{
				$("#channel"+jsonResult[i].channel).removeClass("monitor-btn-act");
				$("#erDtc"+jsonResult[i].channel).removeClass("monitor-btn2-act");
				$("#signal"+jsonResult[i].channel).removeClass("monitor-btn2-act");
				$("#autoAble"+num).removeClass("monitor-btn2-act2");
				$("#autoArea"+num).removeClass("monitor-btn2-act2");
			}
		}

		localStorage.setItem("channelOption", JSON.stringify(channelOption));
		channelOption = JSON.parse(localStorage.getItem("channelOption"));
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

function updateActive(UID){
	for(var i in channelOption){
		if(channelOption[i].channel == UID){
			if(channelOption[i].active == 0){
				channelOption[i].active = 1;
			}else{
				channelOption[i].active = 0;
			}

			setChannel();
		}
	}
};

function updateErdtc(UID){
	for(var i in channelOption){
		if(channelOption[i].channel == UID){
			if(channelOption[i].active == 1){
				if(channelOption[i].erDtc == 1){
					channelOption[i].erDtc = 2;
				}else if(channelOption[i].erDtc == 2){
					channelOption[i].erDtc = 3;
				}else if(channelOption[i].erDtc == 3){
					channelOption[i].erDtc = 1;
				}

				setChannel();
			}else{
				return false;
			}
		}
	}
}

function updateSignal(UID){
	for(var i in channelOption){
		if(channelOption[i].channel == UID){
			if(channelOption[i].active == 1){
				if(channelOption[i].signal == 1){
					channelOption[i].signal = 2;
				}else{
					channelOption[i].signal = 1;
				}

				setChannel();
			}else{
				return false;
			}
		}
	}
}

function updateAutoable(UID){
	for(var i in channelOption){
		if(channelOption[i].channel == UID){
			if(channelOption[i].active == 1){
				if(channelOption[i].autoAble == 1){
					channelOption[i].autoAble = 0;
				}else{
					channelOption[i].autoAble = 1;
				}

				setChannel();
			}else{
				return false;
			}
		}
	}
}

function updateAutoarea(UID){
	for(var i in channelOption){
		if(channelOption[i].channel == UID){
			if(channelOption[i].active == 1){
				if(channelOption[i].autoArea == 1){
					channelOption[i].autoArea = 0;
				}else{
					channelOption[i].autoArea = 1;
				}

				setChannel();
			}else{
				return false;
			}
		}
	}
}