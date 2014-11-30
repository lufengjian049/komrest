var dataUrl={
	//domain:"http://192.168.4.202:8280/komrestservice",
	// domain:"http://192.168.150.2:8280/komrestservice",
	//domain:"http://42.121.116.149:8280/komrestservice",
	domain:"http://42.120.17.217:8280/komrestservice",
	statisUrl:"/other/statis",
	getareaurl:"/area/subareas",
	myareaurl:"/area/myareas"
},dataObj={
	chartHeightPec:0.55,//图表区的比例
	rectWidth:30,    //矩形模块中每个矩形的宽度
	marginWidth:30, //矩形模块之间的空白间距
	rectMaxHeight:250, //通过计算获取
	year:new Date().getFullYear(),
	month:new Date().getMonth(),
	currQu:0,
	dataTabWrapper:null,  //tab切换项的wrapper
	timeobj:{
		q:{type:"thisquarter",kind:"1"},
		m:{type:"month",kind:"2"},
		w:{type:"week",kind:"3"}
	},
	svgHeight:0,paddingbottom:14,//可能显示 点
	posbottom:37, //最下面的坐标 距svg bottom的预留高度
	bgposobjarr:[],  //背景坐标数据
	posArr:[">500","400","300","200","100","0"],
	timeUnit:{q:"季度",m:"月",w:"周"},
	nwidth:2, // 请求返回参数上下跨度 n → [-n,n]
	rectSwipeWidth:null,  //手势 滑动的距离
	cloneSVG:null,
	params:null,
	cloneSVGbg:null
};
$(function(){
	window.location = "objc://setmainflag/" + JSON.stringify({flag: false});
	dataObj.currQu=Util.getQuarter(dataObj.month);//获取当前季度
	dataObj.dataTabWrapper=$("#datatabWrapper");
	var curUrl=location.href,token=Util.getUrlParams(curUrl,"token");
	$("#hiddentoken").val(token);
	setPageDivHeight();
	//
	var dataTabWidth=setDataTabWidth(),tabSwipeWidth=dataTabWidth-$("body").width();
	//读取默认配置信息，没有则添加默认配置信息
	var cacheinfo=Util.getCache(curUrl,Util.getStamp());
	cacheinfo= cacheinfo ? cacheinfo.data : "";
	if(!cacheinfo){
		cacheinfo="q-92";
		Util.setCache(curUrl,cacheinfo);
	}
	var cacheinfoarr=cacheinfo.split('-'),status=cacheinfoarr[1],time=cacheinfoarr[0],
	datatabs=dataObj.dataTabWrapper.find("a");
	dataObj.params={areaid:0,token:token,status:status};
	//处理默认时间 季 月 周
	setParams(time);
	// .before();
	datatabs.eq(0).before(dataObj.dataTabWrapper.find("a[status='"+status+"']"));
	dataObj.dataTabWrapper.find("a").removeClass("active").eq(0).addClass("active");
	//tab区 滑动
	$(document).on("swipeLeft","#datatabWrapper",function(e){
		var _this=$(this),
		curX=(Util.parseTranslateMatrix(_this.css("-webkit-transform"))).x
		,swipewidth=-(Math.abs(curX)+40);
		if(Math.abs(swipewidth)>tabSwipeWidth){
			swipewidth=-(tabSwipeWidth+2);
		}
		$(this).css("transform","translateX("+swipewidth+"px)");
	})
	$(document).on("swipeRight","#datatabWrapper",function(e){
		var _this=$(this),
		curX=(Util.parseTranslateMatrix(_this.css("-webkit-transform"))).x,
		swipewidth=-(Math.abs(curX)-40);
		if(swipewidth>=0){
			swipewidth=0;
		}
		$(this).css("transform","translateX("+swipewidth+"px)");
	})
	//tab区 滑动 end
	$(document).on("swipeRight","#qrectsvg",function(){
		var _this=$(this),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])-dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3];
		Util.startMove(_this,{viewBox:viewboxatt},function(){
			_this.find("g.active").removeClass("active").prev().addClass("active");
		});
	})
	$(document).on("swipeLeft","#qrectsvg",function(){
		var _this=$(this),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])+dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3];
		Util.startMove(_this,{viewBox:viewboxatt},function(){
			_this.find("g.active").removeClass("active").next().addClass("active");
		});
	})
	//tab 切换 事件
	$("#datatabWrapper>a").on("tap",function(){
		var _this=$(this),tmp=$("#contenttmp").html(),tabContentWrap=$("#tabcontent"),
		index=_this.index(),contents=tabContentWrap.children("div"),content=contents.eq(index),
		lastIndex=_this.parent().find(".active").index();
		dataObj.params.status=_this.attr("status");
		if(!_this.hasClass("active")){
			_this.siblings().removeClass("active");
			_this.addClass("active");
			content.html("");
			// if(!content.find(".chartTips").length){ //tab 已有内容
			tmp=tmp.template({num:2,ordreamount:32.31,reciveamount:532.12});
			content.append(tmp);
			content.find(".chart").append(dataObj.cloneSVG);
			contents.eq(lastIndex).addClass("out");
			setTimeout(function(){
				contents.eq(lastIndex).removeClass().addClass("datachart");
				content.addClass("in");
				setTimeout(function(){
					content.removeClass("in").addClass("active");
				},400);
			},400);
		}
		return false;
	});
	//管辖地区 选择事件  -- 根地区
	$(document).on("change","#rootarea",function(){
		//获取子地区 数据
		$("#subarea").html('<option selected>全部</option>');
		$.mypost(dataUrl.domain+dataUrl.getareaurl,true,{token:$("#hiddentoken").val(),areaid:$(this).val()},function(result){
			setareainfo("subarea",result.data);
		},"GET");
	})
	//管辖地区 选择事件  -- 子地区
	$(document).on("change","#subarea",function(){

	})
	//搜索地区 选择事件
	$(document).on("tap",".searchdivdata",function(e){
		if(e.target == $("#searchIconDel")[0]) return;
		var _this=$(this),wholeselectops=$("#wholearea").find("option");
		if(wholeselectops.length){
			wholeselectops.removeClass("mui-hidden");
			$("#searchIconDel").removeClass("mui-hidden").show();
			$("#wholearea").next().hide();
			wholeselectops.eq(0).attr("selected","selected");
		}else{
			$.mypost(dataUrl.domain+dataUrl.myareaurl,true,{token:$("#hiddentoken").val()},function(result){
				var arealist=result.data.arealist,options="";
				for(var i=0;i<arealist.length;i++){
					options+="<option value='"+arealist[i].areaid+"'>"+arealist[i].areaname+"</option>";
				}
				_this.find("select").append(options).next().hide();
				$("#searchIconDel").removeClass("mui-hidden");
			},"GET");
		}
	})
	//搜索 的 删除按钮
	$(document).on("tap","#searchIconDel",function(){
		$("#wholearea>option").addClass("mui-hidden");
		$(this).hide().prev().show();
		$("#wholearea").val("");
	});
	$(document).on("tap",".mui-action-backup",function(){
		$.back();
	})
	$(document).on("tap","#setDataInfo",function(){
		layer.open({
		    type: 1,
		    content: '空间任意发挥，这里可传入html',
		    style: 'width:240px; height:180px; padding:10px; background-color:#F05133; color:#fff; border:none;'
		});
	})
	drawBg();
	//$(".chartAni").addClass("in");
	//drawRect({"0":"","1":"","2":"","-1":"","-2":""},time);
	getstatisdata(time);
	drawBg2(time);
	//new IScroll($(".scrollviewcontent"));
	new IScroll($(".datatab"),{scrollX: true, scrollY: false});
});
$.back=function(){
	window.location = "objc://goback";
}
//获取 统计数据，并负责绘制矩形
function getstatisdata(time,params){
	params=params || dataObj.params;
	$.mypost(dataUrl.domain+dataUrl.statisUrl,true,params,function(result){
		var resultdata=result.data;
		$(".chartAni").addClass("in");
		drawRect(resultdata,time);
	},"GET");
}
function setParams(time){
	dataObj.params.kind=dataObj.timeobj[time].kind;
	var typetimeobj=Util.gettimebytype(dataObj.timeobj[time].type);
	dataObj.params.start=typetimeobj.startdate;
	dataObj.params.end=typetimeobj.enddate;
}
function setPageDivHeight(){
	Util.getOs();
	var height=Util.os.height;
	// if(height<580 && height>480){
	// 	dataObj.chartHeightPec=0.6;
	// }
	// if(height<680 && height>=580 ){
	// 	dataObj.chartHeightPec=0.65;
	// }
	if(height > 480){
		$(".dropdownsearch>div").css({height:"40px","line-height":"40px"});
		$("#dataBottomSearchDiv").height("130px");
		var chartdivheight=height-44-42-150;
	}
	else{
		$("#dataBottomSearchDiv").height("110px");
		var chartdivheight=height-44-42-130;
	}
	var width=Util.os.width;
	// chartdivheight=parseInt(height*dataObj.chartHeightPec),
	$("#tabcontent").height(chartdivheight);
	dataObj.svgHeight=chartdivheight-25;
	$(".posSys").attr({"width":width,"height":chartdivheight-25,"viewBox":"0 0 "+width+" "+dataObj.svgHeight});
	// if(dataObj.chartHeightPec > 0.55){
	// 	$(".dropdownsearch>div").css({height:"40px","line-height":"40px"});
	// }
}
function setDataTabWidth(){
	var tabwidth=0;
	$("a",dataObj.dataTabWrapper).each(function(){
		tabwidth+=$(this).width();
	});
	dataObj.dataTabWrapper.width(tabwidth+5);
	return tabwidth;
}
//绘制背景的坐标1
function drawBg(){
	var bgobj1=$("#bgPanel")[0],posheight=dataObj.svgHeight-dataObj.posbottom,item=parseInt((posheight-30)/5),
	t1=Util.makeSVG("text",{y:10,x:10});
	dataObj.rectMaxHeight=posheight;
	t1.textContent="(单位:万元)";
	bgobj1.appendChild(t1);
	for(var i=0;i<=5;i++){
		var line,bgposobjitem={};
		if(i==0){
			bgposobjitem={x1:0,y1:30,x2:Util.os.width,y2:30};
			line=Util.makeSVG("line",bgposobjitem);
		}else{
			var curlinepos=(30+item*i);
			(i==5) && (curlinepos=posheight);
			bgposobjitem={x1:0,y1:curlinepos,x2:Util.os.width,y2:curlinepos};
			line=Util.makeSVG("line",bgposobjitem);
		}
		dataObj.bgposobjarr.push(bgposobjitem);
		bgobj1.appendChild(line);
	}
	//玻璃片
	var filterlayobj=$(".chart").before("<div class='filterlay'></div>").parent().find(".filterlay"),
	laywidth=(dataObj.rectWidth+15)*2;
	filterlayobj.css({width:laywidth,left:Util.os.width/2-laywidth/2,top:35,height:posheight+13});
	dataObj.cloneSVG=$("#svgObjDiv").clone();
}
function drawBg2(time){
	var bgobj2=$("#bgPanel2")[0],posheight=dataObj.svgHeight-dataObj.posbottom,
	rect=Util.makeSVG("rect",{y:14,x:0,width:30,height:dataObj.svgHeight-16,fill:"#fff"});
	bgobj2.appendChild(rect);
	for(var i=0;i<dataObj.bgposobjarr.length;i++){
		dataObj.bgposobjarr[i].x2=30;
		var line=Util.makeSVG("line",dataObj.bgposobjarr[i]);
		bgobj2.appendChild(line);
		var text=Util.makeSVG("text",{x:5,y:dataObj.bgposobjarr[i].y1-5});
		text.textContent=dataObj.posArr[i];
		bgobj2.appendChild(text);
	}
	var t=Util.makeSVG("text",{x:5,y:posheight+15});
	t.textContent=dataObj.timeUnit[time];
	bgobj2.appendChild(t);
}
//绘制矩形
function drawRect(data,time){
	var rectsvgdoc=$("#qrectsvg");
	var rectTem=$("#chartRectTem").html(),recthtml="",
	rectInfo={rect:{}},centerX=Util.os.width/2-dataObj.rectWidth,
	rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth;//两个矩形模块 同顶点之间的间距
	dataObj.rectSwipeWidth=rectMarginWidth,
	paramsarr=Util.getArrByN(dataObj.nwidth);
	updateproinfo(data["0"]);
	for(var i=0;i<paramsarr.length;i++){
		var index=paramsarr[i],curDataInfo=data[index],curRectInfo={
			fx:centerX+rectMarginWidth*index,fheight:40,sheight:100,width:dataObj.rectWidth
		};
		curRectInfo.fy=dataObj.rectMaxHeight-curRectInfo.fheight;
		curRectInfo.sx=curRectInfo.fx+dataObj.rectWidth;
		curRectInfo.sy=dataObj.rectMaxHeight-curRectInfo.sheight;
		var group=Util.makeSVG("g",{className:(index == 0) && "active"});
		if(curDataInfo.pasum !=0){
			var rect1=Util.makeSVG("rect",{rx:"4",ry:"4",x:curRectInfo.fx,y:curRectInfo.fy,width:curRectInfo.width,
			height:curRectInfo.fheight,className:"orderRect"});
			group.appendChild(rect1);
		}
		if(curDataInfo.recesum !=0){
			var rect2=Util.makeSVG("rect",{rx:"4",ry:"4",x:curRectInfo.sx,y:curRectInfo.sy,width:curRectInfo.width,
			height:curRectInfo.sheight,className:"reciveRect"});
			group.appendChild(rect2);
		}
		var textDesc=Util.makeSVG("text",{className:"posWord",y:dataObj.rectMaxHeight+15,x:curRectInfo.sx});
		textDesc.textContent=getRectTextDesc(time,index);
		group.appendChild(textDesc);
		rectsvgdoc[0].appendChild(group);
	}
	setareainfo("rootarea",data.rootareas);
}
//更新项目数 等信息
function updateproinfo(data){
	$("#tabcontent .active").find(".chartTips span").each(function(){
		var curparam=$(this).attr("param");
		if(curparam == "num")
			$(this).html(data[curparam]);
		else
			$(this).html((data[curparam]/10000).toFixed(2));
	})
}
function getRectTextDesc(type,index){
	var str="";
	if(type=="q"){
		var qarr=[1,2,3,4],cindex=dataObj.currQu+index,sq=cindex,sy=0;
		if(cindex >4){
			sq=cindex-4;sy=parseInt(cindex/4);
		}
		if(cindex <=0){
			sq=cindex+4;sy=-parseInt(cindex/4);
		}
		str=(dataObj.year+sy) + "Q"+sq;
	}
	if(type == "m"){
		var cmindex=dataObj.month+index;
		str=(dataObj.year+parseInt(cmindex/12))+"M"+cmindex%12;
	}
	if(type == "w"){

	}
	return str;
}
function setareainfo(wrapid,areas){
	var rootarea=$("#"+wrapid),ophtml="";
	if(rootarea.find("option").length ==1){
		for(var i=0;i<areas.length;i++){
			ophtml+="<option value='"+areas[i].areaid+"'>"+areas[i].areaname+"</option>"
		}
		rootarea.append(ophtml);
	}
}

;(function($, window){
  $.mypost=function(url,async,data,callback,type,errorback){
   		 // 同步为 false
	    type= type || "POST";
	    errorback=errorback|| function(){Util.popbox("","请求出错,请联系管理员");};
	    $.ajax({
	      type:type,
	      url:url,
	      async:async,
	      dataType:"json",
	      data:data,
	      success:callback,
	      error:errorback 
	    });
  }
})(Zepto, window)