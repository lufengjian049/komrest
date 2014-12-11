var Util={
	os:{
		ios:null,
		android:null,
		height:window.screen.height,
		width:window.screen.width
	},
	getOs:function(){
		var ua=navigator.userAgent,android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
		if(android){
			this.os.android = true;
            this.os.version = android[2];
            if(window.devicePixelRatio){
            	this.os.height=window.screen.height/window.devicePixelRatio;
            	this.os.width=window.screen.width/window.devicePixelRatio;
            }
		}
	},
	support : {
		storage : !!window.localStorage
	},
	toInt:function(str){
		return parseInt(str);
	},
	toFloat:function(str){
		return parseFloat(str);
	},
	toTenThous:function(str){
		return (str==0) ? 0:(this.toFloat(str)/10000).toFixed(2)+"万"
	},
	translateRE:/translate(?:3d)?\((.+?)\)/,
	translateMatrixRE:/matrix(3d)?\((.+?)\)/,
	parseTranslate:function(translateString, position){
		var result = translateString.match(Util.translateRE || '');
		if (!result || !result[1]) {
			result = ['', '0,0,0'];
		}
		result = result[1].split(",");
		result = {
			x : parseFloat(result[0]),
			y : parseFloat(result[1]),
			z : parseFloat(result[2])
		};
		if (position && result.hasOwnProperty(position)) {
			return result[position];
		}
		return result;
	},
	parseTranslateMatrix:function(translateString, position){
		var matrix = translateString.match(Util.translateMatrixRE);
		var is3D = matrix && matrix[1];
		if (matrix) {
			matrix = matrix[2].split(",");
			if (is3D === "3d")
				matrix = matrix.slice(12, 15);
			else {
				matrix.push(0);
				matrix = matrix.slice(4, 7)
			}
		} else {
			matrix = [0, 0, 0];
		}
		var result = {
			x : parseFloat(matrix[0]),
			y : parseFloat(matrix[1]),
			z : parseFloat(matrix[2])
		}
		if (position && result.hasOwnProperty(position)) {
			return result[position];
		}
		return result;
	},
	writelog:function(title){
		console.log(title+":"+(new Date()).format("hh:mm:ss S"));
	},
	popbox:function(title,content){
		var sendparams={
			title:title,
			info:encodeURIComponent(content)
		};
		window.location.href=encodeURI("objc://openpopbox/"+JSON.stringify(sendparams));
	},
	getArrByN:function(n){
		var rearr=[0];
		if(n >0){
			for(var i=1;i<=n;i++){
				rearr.push(i);
				rearr.unshift(-i);
			}
		}
		return rearr;
	},
	//--时间相关的方法
	//获取时间戳
	getStamp:function(){
		return new Date * 1;
		// return Date.parse(new Date());
	},
	getMonthDays:function(month){// 通过时间差 timespan
		var year=(new Date()).getFullYear(),
		monthstartdate=new Date(year,month,1),
		monthenddate=new Date(year,month+1,1);
		return (monthenddate-monthstartdate)/(1000*60*60*24);
	},
	getQuarter:function(month){
		return parseInt(month/3)+1;
	},
	getweekdate:function(curDate,datetype,curmonth){
		curDate=new Date(curDate);
		var year=curDate.getFullYear(),month=curDate.getMonth(),sday=curDate.getDate()-curDate.getDay()+1,
		eday=curDate.getDate()+(6-curDate.getDay())+1,curmonthday=this.getMonthDays(month),
		curstartdate=new Date(year,curmonth,1),curentdate=new Date(year,curmonth,0),
		weekStartDate = new Date(year,month,sday),weekEndDate = new Date(year,month,eday);
		if(datetype == 1){
			(weekStartDate<curstartdate) && (weekStartDate=curstartdate);
			(weekEndDate>curentdate) && (weekEndDate=curentdate);
		}
		return {start:weekStartDate,end:weekEndDate};
	},
	getQuarterStartMonth:function(month){
		var qstartmonth=0;
		if(month <3)
			qstartmonth=0;
		if(2<month && month <6)
			qstartmonth=3;
		if(5<month && month < 9)
			qstartmonth =6;
		if(month >8)
			qstartmonth =9;
		return qstartmonth;
	},
	gettimebytype:function(type,newdate){
		var reobj={},nowdate=newdate || (new Date()),nowyear=nowdate.getFullYear(),nowmonth=nowdate.getMonth(),
		nowday=nowdate.getDate(),mstart,mend,qsm;
		switch (type){
			case 'month':
				mstart=new Date(nowyear,nowmonth,1);
				mend=new Date(nowyear,nowmonth,this.getMonthDays(nowyear,nowmonth));
			break;
			case 'week':
				mstart=new Date(nowyear,nowmonth,nowday-nowdate.getDay()+1);
				mend=new Date(nowyear,nowmonth,nowday+(6-nowdate.getDay())+1);
			break;
			case 'thisyear':
				mstart=new Date(nowyear,"1","1");
				mend=new Date(nowyear,"12","31");
			break;
			case 'thisquarter':
				qsm=this.getQuarterStartMonth(nowmonth);
				mstart=new Date(nowyear,qsm,1);
				mend=new Date(nowyear,qsm+2,this.getMonthDays(nowyear,qsm+2));
			break;
		}
		if(mstart && mend){
			reobj.startdate=mstart.format("yyyy-MM-dd");
			reobj.enddate=mend.format("yyyy-MM-dd");
		}
		return reobj;
	},
	moving:false,
	startMove:function(obj,json,fnEnd){
		if(!this.moving){
		 clearInterval(obj.timer);
		 obj.timer=setInterval(function(){
		 	var bStop=true;
		 	Util.moving=true;
		 	for(var attr in json){
		 		var iTarget=json[attr],cur=0,viewboxextend="";
		 		if(attr == "viewBox"){
		 			iTarget=parseInt(json[attr].split(" ")[0]);
		 			cur=parseInt(obj.attr("viewBox").split(" ")[0]);
		 			viewboxextend=json[attr].split(" ").slice(1).join(" ");
		 		}else{
		 			 cur = parseInt(getStyle(obj, attr));
		 		}
		 		var speed = (iTarget - cur) / 6;
		 		speed = speed > 0 ? Math.ceil(speed) : Math.floor(speed);
		 		if (iTarget != cur)
                	bStop = false; 
                if(attr == "viewBox"){
                	var curpos=cur + speed;
                	// if(speed >0 &&  curpos>iTarget)  curpos=iTarget;
                	// if(speed <0 &&  curpos<iTarget)  curpos=iTarget;
                	obj.attr(attr,curpos+" "+viewboxextend);
                }else{
                	obj.attr(attr,cur + speed + "px");
                }
		 	}
		 	if (bStop) {
		 		Util.moving=false;
	            clearInterval(obj.timer);
	            if (fnEnd) fnEnd();
	        }
		 },30);
		}
	},
	//缓存相关方法
	// 设置cache
	getLocalKey:function(src){
		var s='SPA_'+ (src.indexOf('?')>-1 ? src.substr(0,src.indexOf('?')) : src);
		return {
			data:s+"_data",
			time:s+"_time"
		};
	},
	setCache : function(src, data) {
		var time = Util.getStamp(), key;
		if (Util.support.storage) {
			Util.removeCache(src);
			key = Util.getLocalKey(src);
			localStorage.setItem(key.data, data);
			localStorage.setItem(key.time, time);
		}
	},
	removeCache:function(src){
		if (Util.support.storage) {
			var key = Util.getLocalKey(src);
			localStorage.removeItem(key.data);
			localStorage.removeItem(key.time);
			localStorage.removeItem(key.title);
		}
	},
	getCache:function(src,time){ //附加过期时间 ，，time 时间戳
		var item, vkey, tkey, tval;
		time = Util.toInt(time);
		if (Util.support.storage) { // 从localStorage里查询
			var l = Util.getLocalKey(src);
			vkey = l.data;
			tkey = l.time;
			item = localStorage.getItem(vkey);
			if (item) {
				tval = Util.toInt(localStorage.getItem(tkey));
				if ((tval + time * 1000) > Util.getStamp()) {
					return {
						data : item
					};
				} else {
					localStorage.removeItem(vkey);
					localStorage.removeItem(tkey);
				}
			}
		}
		return null;
	},
	// 清除所有的cache
	removeAllCache : function() {
		if (!Util.support.storage)
			return;
		for ( var name in localStorage) {
			if ((name.split('_') || [ '' ])[0] === 'SPA') {
				delete localStorage[name];
			}
		}
	},
	getUrlParams:function(url,reparam){
		var params=url.substring(url.indexOf('?')+1),paramsarr=params.split('&');
		for(var ci=0;ci<paramsarr.length;ci++){
			if(paramsarr[ci].split('=')[0] == reparam){
				return paramsarr[ci].split('=')[1];
			}
		}
	},
	showloadbox:function(type){//默认不显示 load
		$(".i-loading").show();
		if (Util.os.android) {
			var verson = Util.os.version;
			if (verson.split(".")[0] < 4) {
				type = false;
			}
		}
		if (type) {
			$(".iloadwrap").show();
		} else {
			$(".iloadwrap").hide();
		}
	},hideloadbox:function(){
		$(".i-loading").hide();
	},"svgns":"http://www.w3.org/2000/svg"
	,"ATTR_MAP":{"className": "class","svgHref": "href"},
	makeSVG:function(tag,attributes){
		var elem = document.createElementNS(Util.svgns, tag);
	    for (var attribute in attributes) {
	        var name =  (attribute in this.ATTR_MAP ? this.ATTR_MAP[attribute] : attribute);
	        var value = attributes[attribute];
	        elem.setAttribute(name, value);
	    }
	    return elem;
	}
}
Date.prototype.format = function(format){ 
	var o = { 
		"M+" : this.getMonth()+1, //month 
		"d+" : this.getDate(), //day 
		"h+" : this.getHours(), //hour 
		"m+" : this.getMinutes(), //minute 
		"s+" : this.getSeconds(), //second 
		"q+" : Math.floor((this.getMonth()+3)/3), //quarter 
		"S" : this.getMilliseconds() //millisecond 
	} 
	if(/(y+)/.test(format)) { 
		format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
	} 
	for(var k in o) { 
		if(new RegExp("("+ k +")").test(format)) { 
			format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
		} 
	} 
	return format; 
}
String.prototype.template=function(data){
	return this.replace(/@\{(.*?)\}/g, function($0, $1, $2, $3, D){
		var A =  $1.split('.'), F = A.slice(1).join('.'), D = D || data;
		return F ? arguments.callee($0, F, $2, $3, D[A[0]]) : D[$1] || $0;
	});
}