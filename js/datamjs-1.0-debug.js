var dataUrl={
	//domain:"http://192.168.4.202:8280/komrestservice",
	// domain:"http://192.168.150.2:8280/komrestservice",
	//domain:"http://42.121.116.149:8280/komrestservice",
	domain:"http://42.120.17.217:8280/komrestservice",
	statisUrl:"/other/statis"
},dataObj={
	chartHeightPec:0.55,//图表区的比例
	rectWidth:30,    //矩形模块中每个矩形的宽度
	marginWidth:30, //矩形模块之间的空白间距
	rectMaxHeight:250, //通过计算获取
	year:new Date().getFullYear(),
	month:new Date().getMonth(),
	dataTabWrapper:null,  //tab切换项的wrapper
	timeobj:{
		q:{type:"thisquarter",kind:"1"},
		m:{type:"month",kind:"2"},
		w:{type:"week",kind:"3"}
	},
	svgHeight:0,paddingbottom:14,//可能显示 点
	posbottom:37, //最下面的坐标 距svg bottom的预留高度
	bgposobjarr:[],  //背景坐标数据
	posArr:["400","300","200","100","0"],
	timeUnit:{q:"季度",m:"月",w:"周"},
	nwidth:2, // 请求返回参数上下跨度 n → [-n,n]
	rectSwipeWidth:null  //手势 滑动的距离
};
$(function(){
	dataObj.currQu=Util.getQuarter(dataObj.month);
	dataObj.dataTabWrapper=$("#datatabWrapper");
	var curUrl=location.href,token=Util.getUrlParams(curUrl,"token");
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
	datatabs=dataObj.dataTabWrapper.find("a"),params={areaid:0,token:token,status:status};
	// .before();
	datatabs.eq(0).before(dataObj.dataTabWrapper.find("a[status='"+status+"']"));
	dataObj.dataTabWrapper.find("a").removeClass("active").eq(0).addClass("active");
	//处理默认时间 季 月 周
	params.kind=dataObj.timeobj[time].kind;
	var typetimeobj=Util.gettimebytype(dataObj.timeobj[time].type);
	params.start=typetimeobj.startdate;
	params.end=typetimeobj.enddate;
	// $.mypost(dataUrl.domain+dataUrl.statisUrl,true,params,function(result){
	// 	var resultdata=result.data;
	// 	$(".chartAni").addClass("in");
	// 	drawRect(resultdata);
	// });
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
	drawBg();
	$(".chartAni").addClass("in");
	drawRect({"0":"","1":"","2":"","-1":"","-2":""});
	drawBg2(time);
});
function setPageDivHeight(){
	Util.getOs();
	var height=Util.os.height;
	if(height<580 && height>480){
		dataObj.chartHeightPec=0.6;
	}
	if(height<680 && height>=580 ){
		dataObj.chartHeightPec=0.65;
	}
	var chartdivheight=parseInt(height*dataObj.chartHeightPec),width=Util.os.width;
	$("#dataChartDiv").height(chartdivheight);
	dataObj.svgHeight=chartdivheight-25;
	$(".posSys").attr({"width":width,"height":chartdivheight-25,"viewBox":"0 0 "+width+" "+dataObj.svgHeight});
	if(dataObj.chartHeightPec > 0.55){
		$(".dropdownsearch>div").css({height:"40px","line-height":"40px"});
	}
}
function setDataTabWidth(){
	var tabwidth=0;
	$("a",dataObj.dataTabWrapper).each(function(){
		tabwidth+=$(this).width();
	});
	dataObj.dataTabWrapper.width(tabwidth);
	return tabwidth;
}
//绘制背景的坐标1
function drawBg(){
	var bgobj1=$("#bgPanel")[0],posheight=dataObj.svgHeight-dataObj.posbottom,item=parseInt((posheight-30)/4),
	t1=Util.makeSVG("text",{y:10,x:10});
	dataObj.rectMaxHeight=posheight;
	t1.textContent="(单位:万元)";
	bgobj1.appendChild(t1);
	for(var i=0;i<5;i++){
		var line,bgposobjitem={};
		if(i==0){
			bgposobjitem={x1:0,y1:30,x2:Util.os.width,y2:30};
			line=Util.makeSVG("line",bgposobjitem);
		}else{
			var curlinepos=(30+item*i);
			(i==4) && (curlinepos=posheight);
			bgposobjitem={x1:0,y1:curlinepos,x2:Util.os.width,y2:curlinepos};
			line=Util.makeSVG("line",bgposobjitem);
		}
		dataObj.bgposobjarr.push(bgposobjitem);
		bgobj1.appendChild(line);
	}
	//玻璃片
	var filterlayobj=$("#chart").before("<div class='filterlay'></div>").parent().find(".filterlay"),
	laywidth=(dataObj.rectWidth+15)*2;
	filterlayobj.css({width:laywidth,left:Util.os.width/2-laywidth/2,top:35,height:posheight+13});
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
function drawRect(data){
	var rectsvgdoc=$("#qrectsvg");
	var rectTem=$("#chartRectTem").html(),recthtml="",
	rectInfo={rect:{}},centerX=Util.os.width/2-dataObj.rectWidth,
	rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth;//两个矩形模块 同顶点之间的间距
	dataObj.rectSwipeWidth=rectMarginWidth,
	paramsarr=Util.getArrByN(dataObj.nwidth);
	for(var i=0;i<paramsarr.length;i++){
		var index=paramsarr[i],curDataInfo=data[index],curRectInfo={
			fx:centerX+rectMarginWidth*index,fheight:40,sheight:100,width:dataObj.rectWidth
		};
		curRectInfo.fy=dataObj.rectMaxHeight-curRectInfo.fheight;
		curRectInfo.sx=curRectInfo.fx+dataObj.rectWidth;
		curRectInfo.sy=dataObj.rectMaxHeight-curRectInfo.sheight;
		var group=Util.makeSVG("g",{className:(index == 0) && "active"}),
		rect1=Util.makeSVG("rect",{rx:"4",ry:"4",x:curRectInfo.fx,y:curRectInfo.fy,width:curRectInfo.width,
			height:curRectInfo.fheight,className:"orderRect"}),
		rect2=Util.makeSVG("rect",{rx:"4",ry:"4",x:curRectInfo.sx,y:curRectInfo.sy,width:curRectInfo.width,
			height:curRectInfo.sheight,className:"reciveRect"}),
		textDesc=Util.makeSVG("text",{className:"posWord",y:dataObj.rectMaxHeight+15,x:curRectInfo.sx});
		textDesc.textContent="2014Q"+(dataObj.currQu+parseInt(index));
		group.appendChild(rect1);
		group.appendChild(rect2);
		group.appendChild(textDesc);
		rectsvgdoc[0].appendChild(group);
	}
}
//更新项目数 等信息
function updateproinfo(data){

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