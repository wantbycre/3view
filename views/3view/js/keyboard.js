var actElem; 

function numKey(e){
	$("#numberKey").fadeIn(200);
	$("#numKeyTitle").text(e.name);
	$("#numKeyInput").val("");
	
	$("#numMin").text(e.min);
	$("#numMax").text(e.max);
	actElem = e;
}

function closeModal(){
	$("#numberKey").fadeOut(200);
}


$("#numKeyTable img").on("click", function(e){
	if(e.target.name == "backSpace"){
		var nowStr = uncomma($("#numKeyInput").val());
		var newStr = nowStr.slice(0, nowStr.length - 1);
		$("#numKeyInput").val(comma(newStr));
	}else{
		$("#numKeyInput").val(comma(uncomma($("#numKeyInput").val()) + e.target.name));
	}
});

function insertNum(){
	var numKeyInput = Number(uncomma($("#numKeyInput").val()));
	console.log(numKeyInput);
	if(numKeyInput < Number($("#numMin").text())){
		alert("입력값이 설정범위를 벗어났습니다.");
		return;
	}else if(numKeyInput > Number($("#numMax").text())){
		alert("입력값이 설정범위를 벗어났습니다.");
		return;
	}	

	if(actElem.id == "allowable"){
		actElem.value = comma($("#numKeyInput").val());
		
		allowable();
	}else if(actElem.id == "graphMin"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		graphMin();
	}else if(actElem.id == "graphMax"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		graphMax();
	}else if(actElem.id == "mnmt"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		mnmt();
	}else if(actElem.id == "lower"){
		if(mvData[actNum].condition > 0){
			if(Number($("#numKeyInput").val()) != 0){
				if(mvData[actNum].condition >= Number($("#numKeyInput").val())){
					alert("하한값은 조건값 보다 크게 설정 하세요");
					return;
				}
			}
		}

		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		lower1();
	}else if(actElem.id == "condition"){
		if(mvData[actNum].lower > 0){
			if(mvData[actNum].lower <= Number($("#numKeyInput").val())){
				alert("조건값은 하한값 보다 낮게 설정 하세요");
				return;
			}
		}

		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		condition1();
	}else if(actElem.id == "rpsvs"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		rpsvs();
	}else if(actElem.id == "part1"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		part1();
	}else if(actElem.id == "part2"){
		actElem.value = comma(uncomma(Number($("#numKeyInput").val())));
		part2();
	}

	
	closeModal();
}

function valueDown(e){
	var target = e.name;
	var cnt = $("#"+e.name).val();
	var minus = cnt-1;

	var min = Number($("#"+e.name).attr('min'));

	if(minus >= min){
		$("#"+e.name).val(minus);
		if(target == "allowable"){
			allowable();
		}else if(target == "part1"){
			part1();
		}else if(target == "part2"){
			part2();
		}
	}else{
		alert("입력값이 설정범위를 벗어났습니다.");
		return;
	}
}

function valueUp(e){
	var target = e.name;
	var cnt = $("#"+e.name).val();
	var plus = Number(cnt)+1;

	var max = Number($("#"+e.name).attr('max'));
	
	if(plus <= max){
		$("#"+e.name).val(plus);
		if(target == "allowable"){
			allowable();
		}else if(target == "part1"){
			part1();
		}else if(target == "part2"){
			part2();
		}
	}else{
		alert("입력값이 설정범위를 벗어났습니다.");
		return;
	}
}