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
	posdivheight:0,
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
	cloneSVGbg:null,
	maxPosHeight:null
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
	//设置默认选项的设定
	$(".setTime").filter(".time"+time).attr("checked",'');
	$(".setStatus").filter(".status"+status).attr("checked",'');
	//处理默认时间 季 月 周
	setParams(time);
	// .before();
	datatabs.eq(0).before(dataObj.dataTabWrapper.find("a[status='"+status+"']"));
	dataObj.dataTabWrapper.find("a").removeClass("active").eq(0).addClass("active");
	//tab区 滑动
	// $(document).on("swipeLeft","#datatabWrapper",function(e){
	// 	var _this=$(this),
	// 	curX=(Util.parseTranslateMatrix(_this.css("-webkit-transform"))).x
	// 	,swipewidth=-(Math.abs(curX)+40);
	// 	if(Math.abs(swipewidth)>tabSwipeWidth){
	// 		swipewidth=-(tabSwipeWidth+2);
	// 	}
	// 	$(this).css("transform","translateX("+swipewidth+"px)");
	// })
	// $(document).on("swipeRight","#datatabWrapper",function(e){
	// 	var _this=$(this),
	// 	curX=(Util.parseTranslateMatrix(_this.css("-webkit-transform"))).x,
	// 	swipewidth=-(Math.abs(curX)-40);
	// 	if(swipewidth>=0){
	// 		swipewidth=0;
	// 	}
	// 	$(this).css("transform","translateX("+swipewidth+"px)");
	// })
	//tab区 滑动 end
	//图表区滑动
	$(document).on("swipeRight","#svgObjDiv",function(){
		var _this=$(this).find("#qrectsvg"),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])-dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3],
		prevobjs=_this.find("g.active").prev();
		if(prevobjs.index() == 1){ //前面 只有一个数据的情况下，在请求数据
			var postext=prevobjs.find("text").html(),textarr=postext.split("Q"),smonth=(textarr[1]-1)*3; //
			dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
			dataObj.params.end=(new Date(textarr[0],smonth+3,-1)).format("yyyy-MM-dd");
			$.mypost(dataUrl.domain+dataUrl.statisUrl,true,dataObj.params,function(result){
				var resultdata=result.data;
				drawSingleRect(_this,resultdata,"q",true);
			},"GET");
		}else{
			var sdata={pasum:prevobjs.attr("pasum"),recesum:prevobjs.attr("recesum"),num:prevobjs.attr("num")};
			updateproinfo(sdata);
		}
		Util.startMove(_this,{viewBox:viewboxatt},function(){
			_this.find("g.active").removeClass("active").prev().addClass("active");
		});
	})
	$(document).on("swipeLeft","#svgObjDiv",function(){
		var _this=$(this).find("#qrectsvg"),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])+dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3],
		nextobjs=_this.find("g.active").next();
		if((_this.find("g").length-nextobjs.index()) == 2){
			var postext=nextobjs.find("text").html(),textarr=postext.split("Q"),smonth=(parseInt(textarr[1])-1)*3; //
			dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
			dataObj.params.end=(new Date(textarr[0],smonth+3,-1)).format("yyyy-MM-dd");
			$.mypost(dataUrl.domain+dataUrl.statisUrl,true,dataObj.params,function(result){
				var resultdata=result.data;
				drawSingleRect(_this,resultdata,"q",false);
			},"GET");
		}else{
			var sdata={pasum:nextobjs.attr("pasum"),recesum:nextobjs.attr("recesum"),num:nextobjs.attr("num")};
			updateproinfo(sdata);
		}
		Util.startMove(_this,{viewBox:viewboxatt},function(){
			_this.find("g.active").removeClass("active").next().addClass("active");
		});
	})

	//手势 放大 缩小 事件  pinchIn pinchOut
	$(document).on("doubleTap","#svgObjDiv",function(){
		var activeG=$("#qrectsvg>g.active"),textdesc=activeG.find("text").html();
		if(textdesc.indexOf("Q") > 0){ //当前是季度
			var textarr=textdesc.split("Q"),smonth=(parseInt(textarr[1])-1)*3;
			dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
			dataObj.params.end=(new Date(textarr[0],smonth+3,-1)).format("yyyy-MM-dd");
			dataObj.params.kind=dataObj.timeobj['m'].kind;
			$("#qrectsvg").html();
			$("#bgPanel2").html();
			getstatisdata("m");
		}else{
			if(textdesc.indexOf("M") > 0){

			}else{

			}
		}
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
			content.append(tmp);
			contents.eq(lastIndex).addClass("out");
			setTimeout(function(){
				contents.eq(lastIndex).html("");
				contents.eq(lastIndex).removeClass().addClass("datachart");
				content.addClass("in");
				content.find(".chart").append(dataObj.cloneSVG);
				getstatisdata(time);
				setTimeout(function(){
					content.removeClass("in").addClass("active");
				},400);
			},400);
		}
		return false;
	});
	//管辖地区 选择事件  -- 根地区
	$(document).on("change","#rootarea",function(){
		dataObj.params.areaid=$(this).val();
		getstatisdata(time);
		//获取子地区 数据
		$("#subarea").html('<option selected>全部</option>');
		$.mypost(dataUrl.domain+dataUrl.getareaurl,true,{token:$("#hiddentoken").val(),areaid:$(this).val()},function(result){
			setareainfo("subarea",result.data);
		},"GET");
	})
	//管辖地区 选择事件  -- 子地区
	$(document).on("change","#subarea",function(){
		dataObj.params.areaid=$(this).val();
		getstatisdata(time);
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
	$(document).on("change","input[type=radio]",function(){
		var _this=$(this);
		if(_this.is(":checked")){
			$("input[type=radio][name='"+_this.attr("name")+"']").removeAttr("checked");
		}
	})
	$(document).on("tap","#setDataInfo",function(){
		var curindex=layer.open({
		    type: 1,
		    content: $("#popbox").html(),
		    title:['设置默认信息',"text-align:center;"],
		    style: 'width:80%; height:435px;border-radius:10px;'
		});
		$(".layermend").on("tap",function(){
			var ctime=$(".setTime:checked").val(),cstatus=$(".setStatus:checked").val(),
			newcacheinfo=ctime+'-'+cstatus;
			if(newcacheinfo != cacheinfo){
				//更新页面的信息
				dataObj.params.status=cstatus;
				setParams(ctime);
				if(cstatus!=cacheinfo.split("-")[1]){
					datatabs.eq(0).before(dataObj.dataTabWrapper.find("a[status='"+status+"']"));
					dataObj.dataTabWrapper.find("a").removeClass("active").eq(0).addClass("active").trigger("tap");
				}else{
					getstatisdata(ctime);
				}
				Util.setCache(curUrl,newcacheinfo);
			}
		})
	})
	drawBg();
	//$(".chartAni").addClass("in");
	//drawRect({"0":"","1":"","2":"","-1":"","-2":""},time);
	getstatisdata(time);
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
	$("#tabcontent").height(chartdivheight);
	dataObj.svgHeight=chartdivheight-25;
	$(".posSys").attr({"width":width,"height":chartdivheight-25,"viewBox":"0 0 "+width+" "+dataObj.svgHeight});
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
	var bgobj1=$("#bgPanel",$(".datachart").eq($("#datatabWrapper>a.active").index()))[0],
	posheight=dataObj.svgHeight-dataObj.posbottom,item=parseInt((posheight-30)/5),
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
	dataObj.posdivheight=dataObj.bgposobjarr[5].y1-30;
	//玻璃片
	var filterlayobj=$(".chart").before("<div class='filterlay'></div>").parent().find(".filterlay"),
	laywidth=(dataObj.rectWidth+15)*2;
	filterlayobj.css({width:laywidth,left:Util.os.width/2-laywidth/2,top:35,height:posheight+13});
	dataObj.cloneSVG=$("#svgObjDiv").clone();
}
function drawBg2(time){
	var bgobj2=$("#bgPanel2",$(".datachart").eq($("#datatabWrapper>a.active").index())),
	posheight=dataObj.svgHeight-dataObj.posbottom,
	rect=Util.makeSVG("rect",{y:14,x:0,width:30,height:dataObj.svgHeight-16,fill:"#fff"});
	bgobj2.html("");
	bgobj2=bgobj2[0];
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
function drawSingleRect(curobj,data,time,isfirst){
	var rectsvgdoc=curobj,dindex="",
	gobjs=curobj.find("g"),startx=null,rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth,
	index=null;
	if(isfirst){
		dindex="-2";
		startx=gobjs.eq(0).attr("rectx")-rectMarginWidth;
		index=gobjs.eq(0).attr("rindex")-1;
	}else{
		dindex="2";
		startx=parseInt(gobjs.last().attr("rectx"))+rectMarginWidth;
		index=parseInt(gobjs.last().attr("rindex"))+1;
	}
	var curdata=data[dindex];
	updateproinfo(data['0']);
	var group=Util.makeSVG("g",{rectx:startx,rindex:index,pasum:curdata.pasum,recesum:curdata.recesum,num:curdata.num});
	if(curdata.pasum >0){
		var rect1height=((curdata.pasum/10000)/dataObj.maxPosHeight)*dataObj.posdivheight,
		rect1=Util.makeSVG("rect",{rx:"4",ry:"4",x:startx,y:dataObj.rectMaxHeight-rect1height,width:curRectInfo.width,
			height:rect1height,className:"orderRect"});
			group.appendChild(rect1);
	}
	if(curdata.recesum >0){
		var rect2height=((curdata.recesum/10000)/dataObj.maxPosHeight)*dataObj.posdivheight,
		rect2=Util.makeSVG("rect",{rx:"4",ry:"4",x:startx+dataObj.rectWidth,y:dataObj.rectMaxHeight-rect2height,width:curRectInfo.width,
			height:rect2height,className:"reciveRect"});
			group.appendChild(rect2);
	}
	var textDesc=Util.makeSVG("text",{className:"posWord",y:dataObj.rectMaxHeight+15,x:startx+dataObj.rectWidth});
	textDesc.textContent=getRectTextDesc(time,index);
	group.appendChild(textDesc);
	if(isfirst)
		rectsvgdoc.prepend($(group));
	else
		rectsvgdoc[0].appendChild(group);
}
//绘制矩形
function drawRect(data,time){
	var rectsvgdoc=$("#qrectsvg",$(".datachart").eq($("#datatabWrapper>a.active").index()));
	var rectTem=$("#chartRectTem").html(),recthtml="",
	rectInfo={rect:{}},centerX=Util.os.width/2-dataObj.rectWidth,
	rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth;//两个矩形模块 同顶点之间的间距
	rectsvgdoc.html("");
	dataObj.rectSwipeWidth=rectMarginWidth,
	paramsarr=Util.getArrByN(dataObj.nwidth),maxamount=(data.ordermax > data.recemax) ? data.ordermax :data.recemax,
	maxposy=getPosArr(maxamount);
	updateproinfo(data["0"]);
	dataObj.maxPosHeight=maxposy;
	for(var i=0;i<paramsarr.length;i++){
		var index=paramsarr[i],curDataInfo=data[index],curRectInfo={
			fx:centerX+rectMarginWidth*index,fheight:40,sheight:100,width:dataObj.rectWidth
		};
		curRectInfo.fheight= ((curDataInfo.pasum/10000)/maxposy)*dataObj.posdivheight;
		curRectInfo.sheight= ((curDataInfo.recesum/10000)/maxposy)*dataObj.posdivheight;
		curRectInfo.fy=dataObj.rectMaxHeight-curRectInfo.fheight;
		curRectInfo.sx=curRectInfo.fx+dataObj.rectWidth;
		curRectInfo.sy=dataObj.rectMaxHeight-curRectInfo.sheight;
		var group=Util.makeSVG("g",{className:(index == 0) && "active",rectx:curRectInfo.fx,rindex:index,pasum:curDataInfo.pasum,recesum:curDataInfo.recesum,num:curDataInfo.num});
		if(curDataInfo.pasum >0){
			var rect1=Util.makeSVG("rect",{rx:"4",ry:"4",x:curRectInfo.fx,y:curRectInfo.fy,width:curRectInfo.width,
			height:curRectInfo.fheight,className:"orderRect"});
			group.appendChild(rect1);
		}
		if(curDataInfo.recesum >0){
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
	drawBg2(time);
}
//更新项目数 等信息
function updateproinfo(data){
	$(".datachart").eq($("#datatabWrapper>a.active").index()).find(".chartTips span").each(function(){
		var curparam=$(this).attr("param");
		if(curparam == "num")
			$(this).html(data[curparam]);
		else
			$(this).html((data[curparam]/10000).toFixed(2));
	})
}
function getPosArr(max){
	var qtw=false; //大于10000
	if(max > 10000){
		max=parseInt(max/10000);
		qtw=true;
	}
	var length=(max+"").length,arrfirst=5*(Math.pow(10,(length-1))),maxposarr=0;
	if(max  > arrfirst){
		maxposarr=arrfirst*2;
	}else{
		maxposarr=arrfirst;
	}
	if(!qtw){
		maxposarr=maxposarr/10000;
		var count=(maxposarr+"").split(".")[1].length;
	}
	var positem=maxposarr/5;
	for(var i=0;i<=5;i++){
		if(i==0)
			dataObj.posArr[i]=">"+maxposarr;
		else{
			if(count)
				dataObj.posArr[i]=(maxposarr-positem*i)== 0 ? 0 : (maxposarr-positem*i).toFixed(count);
			else
				dataObj.posArr[i]=maxposarr-positem*i;
		}
	}
	return maxposarr;
}
//获取 坐标栏 矩形区间的描述信息
function getRectTextDesc(type,index){
	var str="";
	if(type=="q"){
		str=(new Date(dataObj.year,dataObj.month+index*3,1)).format("yyyy-MM");
		strarr=str.split("-");
		str=strarr[0]+"Q"+Util.getQuarter(strarr[1]-1);
	}
	if(type == "m"){
		var cmindex=dataObj.month+index;
		str=(new Date(dataObj.year,dataObj.month+index,1)).format("yyyy-MM");
		str=str.replace("-","M");
	}
	if(type == "w"){
		var timestamp=(new Date())*1 + (7*24*60*60*1000)*index;
		var sobj=Util.getweekdate((new Date(timestamp)).format("yyyy-MM-dd"));
		str=sobj.start.format("yy/M/d")+"~"+sobj.end.format("yy/M/d");
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