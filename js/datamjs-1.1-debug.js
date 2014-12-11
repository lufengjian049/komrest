var dataUrl={
	//domain:"http://192.168.4.202:8280/komrestservice",
	// domain:"http://192.168.150.2:8280/komrestservice",
	//domain:"http://42.121.116.149:8280/komrestservice",
	domain:"http://42.120.17.217:8280/komrestservice",
	statisUrl:"/other/statis",
	getareaurl:"/area/subareas",
	myareaurl:"/area/myareas"
},dataObj={
	dataType:1,//实时数据 1 or 历史数据 0
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
	timeobj2:{
		kind1:"q",kind2:"m",kind3:"w"
	},
	svgHeight:0,paddingbottom:14,//可能显示 点
	posbottom:37, //最下面的坐标 距svg bottom的预留高度
	bgposobjarr:[],  //背景坐标数据
	posArr:[">500","400","300","200","100","0"],
	timeUnit:{q:"季度",m:"月",w:"周"},
	nwidth:1, // 请求返回参数上下跨度 n → [-n,n]  默认为1，历史数据为2
	rectSwipeWidth:null,  //手势 滑动的距离
	cloneSVG:null,
	params:null,
	cloneSVGbg:null,
	maxPosHeight:null
},datatabscrollobj=null;
$(function(){
	window.location = "objc://setmainflag/" + JSON.stringify({flag: false});
	dataObj.currQu=Util.getQuarter(dataObj.month);//获取当前季度
	dataObj.dataTabWrapper=$("#datatabWrapper");
	var curUrl=location.href,token=Util.getUrlParams(curUrl,"token"),showcover=Util.getUrlParams(curUrl,"firstshow");
	if(showcover == 1){
		$("#coverDiv").show().on("swipeLeft",function(){
			var wrapdiv=$(this),curdiv=wrapdiv.find("div.cover_current");
			if(wrapdiv.find(".cover_next").length){
				curdiv.addClass("out");
				curdiv.next().addClass("in");
				$(".tipswrap>div").removeClass("active").eq(curdiv.next().index()).addClass("active");
				setTimeout(function(){
					curdiv.removeClass().addClass("cover_prev");
					if(!curdiv.next().hasClass("covertips_bottom"))
						curdiv.next().removeClass().addClass("cover_current");
				},600);
			}
		}).on("swipeRight",function(){
			var wrapdiv=$(this),curdiv=wrapdiv.find("div.cover_current");
			if(wrapdiv.find(".cover_prev").length){
				curdiv.addClass("outright");
				curdiv.prev().addClass("in");
				$(".tipswrap>div").removeClass("active").eq(curdiv.prev().index()).addClass("active");
				setTimeout(function(){
					curdiv.removeClass().addClass("cover_next");
					curdiv.prev().removeClass().addClass("cover_current");
				},600);
			}
		});
		$(".cover_btn").on("tap",function(){
			$("#coverDiv").hide();
		})
	}
	$("#hiddentoken").val(token);
	setPageDivHeight();
	//
	var dataTabWidth=setDataTabWidth(),tabSwipeWidth=dataTabWidth-$("body").width(),
	status="10",time="q",datatabs=dataObj.dataTabWrapper.find("a");
	dataObj.params={areaid:0,token:token,status:status,now:dataObj.dataType};
	//处理默认时间 季 月 周
	setParams(time);
	//fix android 4.4.x bug
	$(document).on("touchmove",function(e){
		e.preventDefault();
	})
	//----------------图表区滑动
	$(document).on("swipeRight","#svgObjDiv",function(){
		var _this=$(this).find("#qrectsvg"),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])-dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3],
		prevobjs=_this.find("g.active").prev();
		if(prevobjs.length>0){
			if(prevobjs.index() == 1 && dataObj.dataType == 0){ //前面 只有一个数据的情况下，在请求数据
				getDataBySwipeObj(prevobjs,_this,true,true);
			}else{
				getDataBySwipeObj(prevobjs,_this,true);
				var sdata={pasum:prevobjs.attr("pasum"),recesum:prevobjs.attr("recesum"),num:prevobjs.attr("num")};
				updateproinfo(sdata);
			}
			Util.startMove(_this,{viewBox:viewboxatt},function(){
				_this.find("g.active").removeClass("active").prev().addClass("active");
			});
		}
	})
	$(document).on("swipeLeft","#svgObjDiv",function(){
		var _this=$(this).find("#qrectsvg"),
		viewbox=_this.attr("viewBox"),viewboxarr=viewbox.split(" "),
		x=parseInt(viewboxarr[0])+dataObj.rectSwipeWidth,
		viewboxatt=x+" "+viewboxarr[1]+" "+viewboxarr[2]+" "+viewboxarr[3],
		nextobjs=_this.find("g.active").next();
		if(nextobjs.length>0){
			if((_this.find("g").length-nextobjs.index()) == 2 && dataObj.dataType == 0){
				getDataBySwipeObj(nextobjs,_this,false,true);
			}else{
				if(dataObj.dataType ==1 && nextobjs.find("text").attr("ihtml").indexOf("~")>=0 && !dataObj.curmonthover){
					//月份需要进行滑动请求数据
					getDataBySwipeObj(nextobjs,_this,false,true);
				}else{
					getDataBySwipeObj(nextobjs,_this,false);
					var sdata={pasum:nextobjs.attr("pasum"),recesum:nextobjs.attr("recesum"),num:nextobjs.attr("num")};
					updateproinfo(sdata);
				}
			}
			Util.startMove(_this,{viewBox:viewboxatt},function(){
				_this.find("g.active").removeClass("active").next().addClass("active");
			});
		}
	})
	//手势 放大 缩小 事件  pinchIn pinchOut
	$(document).on("pinchOut","#svgObjDiv",function(){ //doubleTap,
		pinOutFn();
	})
	$(document).on("pinchIn","#svgObjDiv",function(){  //longTap,
		pineInFn();
	})
	$(document).on("doubleTap","#svgObjDiv",function(){ //doubleTap,
		pinOutFn();
	})
	$(document).on("longTap","#svgObjDiv",function(){  //longTap,
		pineInFn();
	})
	//tab 切换 事件
	$("#datatabWrapper>a").on("tap",function(){
		var _this=$(this),tmp=$("#contenttmp").html(),tabContentWrap=$("#tabcontent"),
		contents=tabContentWrap.children("div"),content=contents.eq(0);
		dataObj.params.status=_this.attr("status");
		if(!_this.hasClass("active")){
			Util.showloadbox(true);
			_this.siblings().removeClass("active");
			_this.addClass("active");
			content.addClass("out");
			setTimeout(function(){
				content.children().remove();
				content.append(tmp);
				content.removeClass().addClass("datachart");
				content.addClass("in");
				content.find(".chart").append(dataObj.cloneSVG);
				dataObj.curmonthover=false;
				getSetArrByparams(dataObj.params);
				getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
				resetviewbox();
				setTimeout(function(){
					content.removeClass("in").addClass("active");
					//Util.hideloadbox();
				},400);
			},400);
		}
		return false;
	});
	//管辖地区 选择事件  -- 根地区
	$(document).on("change","#rootarea",function(){
		Util.showloadbox();
		if(!$("#searchIconDel").hasClass("mui-hidden")){
			$("#searchIconDel").trigger("tap");
		}
		var areaid=parseInt($(this).val());
		if(areaid){
			dataObj.params.areaid=$(this).val();
		}else{
			dataObj.params.areaid=0;
		}
		getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
		resetviewbox();
		//获取子地区 数据
		$("#subarea").html('<option selected>全部</option>');
		if(areaid)
			$.mypost(dataUrl.domain+dataUrl.getareaurl,true,{token:$("#hiddentoken").val(),areaid:areaid},function(result){
				if(result.data)
					setareainfo("subarea",result.data);
			},"GET");
	})
	//管辖地区 选择事件  -- 子地区
	$(document).on("change","#subarea",function(){
		Util.showloadbox();
		var areaid=parseInt($(this).val());
		if(areaid){
			dataObj.params.areaid=$(this).val();
		}else{
			dataObj.params.areaid=$("#rootarea>option").getSelected();
		}
		getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
		resetviewbox();
	})
	$(document).on("change","#wholearea",function(){
		Util.showloadbox();
		var areaid=parseInt($(this).val());
		if(areaid){
			dataObj.params.areaid=$(this).val();
		}else{
			dataObj.params.areaid=$("#rootarea>option").getSelected();
		}
		getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
		resetviewbox();
	})
	//搜索地区 选择事件
	$(document).on("tap",".searchdivdata",function(e){
		if(e.target == $("#searchIconDel")[0]) return;
		if(e.target == $("#wholearea")[0]) return;
		var _this=$(this),wholeselect=$("#wholearea");
		wholeselect.prev().hide();
		wholeselect.show().trigger("tap").next().hide();
		$("#searchIconDel").removeClass("mui-hidden").show();
	})
	//搜索 的 删除按钮
	$(document).on("tap","#searchIconDel",function(){
		$("#wholearea").hide().prev().show();
		$(this).hide().prev().show();
		$("#wholearea").val("");
		dataObj.params.areaid=0;
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
	$(document).on("change",".popover input",function(){
		var _this=$(this),thisvalue=_this.val();
		if(_this.is(":checked")){
			if(thisvalue == 1){//实时
				dataObj.oldParamsHis=$.extend({},dataObj.params);
				dataObj.params=$.extend({},dataObj.oldParamsNow,{areaid:dataObj.params.areaid});
				$("#setDataInfo").hide();
				dataObj.dataType=1;
				dataObj.nwidth=1;
				$("#mainhead").html("实时数据统计");
				$("#datatabWrapper").find(".history").hide();
				$("#datatabWrapper").find(".realtime").show();
				setDataTabWidth();
				datatabscrollobj.refresh();
				var reallength=dataObj.dataTabWrapper.find("a.history").length,statsuaobj=dataObj.dataTabWrapper.find("a").removeClass("active").filter("a.realtime[status='"+dataObj.params.status+"']"),
				curindex=statsuaobj.index()-reallength;
				statsuaobj.addClass("active");
				if(curindex>=4){
					datatabscrollobj.scrollTo(-(curindex-3)*80,0,1000);
				}else{
					datatabscrollobj.scrollTo(10,0,1000);
				}
				//$("#datatabWrapper").find("a.realtime[status='"+dataObj.params.status+"']").addClass("active");
				getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
				resetviewbox();
				$("#maintitle").trigger("tap");
			}else{//历史
				dataObj.oldParamsNow=$.extend({},dataObj.params);
				(dataObj.oldParamsHis)&& (dataObj.params=$.extend({},dataObj.oldParamsHis,{areaid:dataObj.params.areaid}));
				$("#setDataInfo").show();
				$("#mainhead").html("历史数据统计");
				dataObj.dataType=0;
				dataObj.nwidth=2;
				$("#datatabWrapper").find(".history").show();
				$("#datatabWrapper").find(".realtime").hide();
				setDataTabWidth();
				datatabscrollobj.refresh();
				dataObj.params.now=dataObj.dataType;
				var datatabs=dataObj.dataTabWrapper.find("a");
				if(!dataObj.oldParamsHis){
					//读取默认配置信息，没有则添加默认配置信息
					var cacheinfo=Util.getCache(curUrl,Util.getStamp());
					cacheinfo= cacheinfo ? cacheinfo.data : "";
					if(!cacheinfo){
						cacheinfo="q-92";
						Util.setCache(curUrl,cacheinfo);
					}
					var cacheinfoarr=cacheinfo.split('-'),status=cacheinfoarr[1],time=cacheinfoarr[0];
					dataObj.params.status=status;
					//设置默认选项的设定
					$(".setTime").filter(".time"+time).attr("checked",'');
					$(".setStatus").filter(".status"+status).attr("checked",'');
					//处理默认时间 季 月 周
					setParams(time);
				}
				// .before(); ----修改
				var statsuaobj=dataObj.dataTabWrapper.find("a").removeClass("active").filter("a.history[status='"+dataObj.params.status+"']"),
				curindex=statsuaobj.index();
				if(curindex>=4){
					datatabscrollobj.scrollTo(-(curindex-3)*80,0,1000);
				}else{
					datatabscrollobj.scrollTo(10,0,1000);
				}
				statsuaobj.addClass("active");
				if(!dataObj.oldParamsHis)
					getstatisdata(time);
				else{

					getstatisdata(dataObj.timeobj2["kind"+dataObj.params.kind],dataObj.params.start);
				}
				resetviewbox();
				$("#maintitle").trigger("tap");
			}
		}
	})
	$(document).on("tap",".dropdowntip",function(){
		$(this).prev().children().focus();
	})
	//设置默认信息
	$(document).on("tap","#setDataInfo",function(){
		var cacheinfo2=Util.getCache(curUrl,Util.getStamp()),
		cacheinfoarr2=cacheinfo2.data.split('-'),status2=cacheinfoarr2[1],time2=cacheinfoarr2[0];
		//设置默认选项的设定
		$(".setTime","#popbox").filter(".time"+time2).attr("checked",'');
		$(".setStatus","#popbox").filter(".status"+status2).attr("checked",'');
		var curindex=layer.open({
		    type: 1,
		    content: $("#popbox").html(),
		    title:['设置默认信息',"text-align:center;"],
		    style: 'width:80%; height:420px;border-radius:10px;'
		});
		
		$(".layermend").on("tap",function(){
			var ctime=$(".setTime:checked").val(),cstatus=$(".setStatus:checked").val(),
			newcacheinfo=ctime+'-'+cstatus;
			datatabs=dataObj.dataTabWrapper.find("a");
			cacheinfo=(Util.getCache(curUrl,Util.getStamp())).data;
			if(newcacheinfo != cacheinfo){
				//更新页面的信息
				dataObj.params.status=cstatus;
				setParams(ctime);
				if(cstatus!=cacheinfo.split("-")[1]){//默认状态也改变
					datatabs.eq(0).before(dataObj.dataTabWrapper.find("a[status='"+cstatus+"']"));
					dataObj.dataTabWrapper.find("a").removeClass("active").eq(0).trigger("tap");
					// getstatisdata(ctime);
				}else{//状态没改变
					getstatisdata(ctime);
					resetviewbox();
				}
				Util.setCache(curUrl,newcacheinfo);
				layer.close(curindex);
			}else{
				layer.close(curindex);
			}
		})
	})
	$(document).on("tap","#maintitle",function(){
		var spanobj=$(this).find("span");
		if(!spanobj.hasClass("popovertipshow")){
			spanobj.removeClass("popovertiphide").addClass("popovertipshow");
			var popobj=$(".popover").show();
			setTimeout(function(){ //隐藏的元素 必须要这样
				popobj.find("ul").replaceClass("hide","show");
			},0);
		}else{
			spanobj.removeClass("popovertipshow").addClass("popovertiphide");
			$(".popover").find("ul").replaceClass("show","hide");
			setTimeout(function(){
				spanobj.removeClass("popovertiphide");
				$(".popover").hide();
			},600);
		}
	})
	drawBg();
	getstatisdata(time);
	datatabscrollobj=new IScroll($(".datatab"),{scrollX: true, scrollY: false,probeType: 3});
	datatabscrollobj.on("scroll",function(){
		//console.log(this.x);console.log(this.distX);console.log("over");
		if(Math.abs(this.x)>=Math.abs(this.maxScrollX)){
			$(".datatab_tips_right").hide();
		}
		if(this.directionX == 1){
			$(".datatab_tips_left").show();
		}
		if(this.directionX <0){
			$(".datatab_tips_right").show();
		}
		if(this.x >=0){
			$(".datatab_tips_left").hide();
		}
	})
	getSearchlistdata();
});
$.back=function(){
	window.location = "objc://goback";
}
function resetviewbox(){
	//重置模板的 位移
	var vboxarr=$("#qrectsvg").attr("viewBox").split(' ');
	$("#qrectsvg").attr("viewBox","0 "+vboxarr.slice(1).join(" "));
}
//放大缩小过场动画
function pinchback(holdback){
	$(".chartAni").addClass("out");
	setTimeout(function(){
		$(".chartAni").removeClass("in").removeClass("out");
		resetviewbox();
		holdback();
	},400);
}
$.fn.getSelected=function(){
	var revalue;
	$(this).each(function(){
		if($(this).attr("selected")){
			revalue=$(this).val();
			return false;
		}
	})
	return revalue;
}
//获取搜索 的地区信息
function getSearchlistdata(){
	$.mypost(dataUrl.domain+dataUrl.myareaurl,true,{token:$("#hiddentoken").val()},function(result){
		if(result.data) {
			var arealist=result.data.arealist,options="";
			for(var i=0;i<arealist.length;i++){
				options+="<option  value='"+arealist[i].areaid+"'>"+arealist[i].areaname+"</option>";
			}
			$("#wholearea").append(options).hide();
		}
		//$("#searchIconDel").removeClass("mui-hidden");
	},"GET");
}
//获取 统计数据，并负责绘制矩形
function getstatisdata(time,startdate,action,params){
	params=params || dataObj.params;
	$.mypost(dataUrl.domain+dataUrl.statisUrl,true,params,function(result){
		var resultdata=result.data;
		if(action){
			action(function(){
				drawRect(resultdata,time,startdate);
				$(".chartAni").addClass("in");
			});
		}else{
			drawRect(resultdata,time,startdate);
			$(".chartAni").addClass("in");
		}
		Util.hideloadbox();
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
		tabwidth+=$(this).width()+4;
	});
	dataObj.dataTabWrapper.width(tabwidth+5);
	return tabwidth;
}
//左右滑动时根据 前后 对象 获取时间相关信息
function getDataBySwipeObj(swipeObj,cursvgobj,isfirst,update){
	var postext=swipeObj.find("text").attr("ihtml"),time;
	if(postext.indexOf("Q") > 0){
		var textarr=postext.split("Q"),smonth=(parseInt(textarr[1])-1)*3; //
		dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
		dataObj.params.end=(new Date(textarr[0],smonth+3,-1)).format("yyyy-MM-dd");
		time="q";
	}else{
		if(postext.indexOf("M") > 0){
			var textarr=postext.split("M"),smonth=(parseInt(textarr[1])-1);
			dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
			dataObj.params.end=(new Date(textarr[0],smonth+1,-1)).format("yyyy-MM-dd");
			time="m";
		}else{
			var textarr=postext.split("~");
			dataObj.params.start=(new Date("20"+textarr[0])).format("yyyy-MM-dd");
			dataObj.params.end=(new Date("20"+textarr[1])).format("yyyy-MM-dd");
			time="w";
		}
	}
	if(update)
		$.mypost(dataUrl.domain+dataUrl.statisUrl,true,dataObj.params,function(result){
			var resultdata=result.data;
			drawSingleRect(cursvgobj,resultdata,time,isfirst,dataObj.params.start);
		},"GET");
}
//绘制背景的坐标1
function drawBg(){
	var bgobj1=$("#bgPanel")[0],
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
	var bgobj2=$("#bgPanel2"),
	posheight=dataObj.svgHeight-dataObj.posbottom,
	rect=Util.makeSVG("rect",{y:14,x:0,width:30,height:dataObj.svgHeight-16,fill:"#fff"});
	bgobj2.children().remove();
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
function drawSingleRect(curobj,data,time,isfirst,startdate){
	var rectsvgdoc=curobj,dindex="",
	gobjs=curobj.find("g"),startx=null,rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth,
	index=null;
	if(isfirst){
		dindex="-2";
		startx=gobjs.eq(0).attr("rectx")-rectMarginWidth;
		index=-2;
	}else{
		dindex="2";
		startx=parseInt(gobjs.last().attr("rectx"))+rectMarginWidth;
		index=2;
	}
	var curdata=data[dindex];
	updateproinfo(data['0']);
	var group=Util.makeSVG("g",{rectx:startx,rindex:index,pasum:curdata.pasum,recesum:curdata.recesum,num:curdata.num});
	if(curdata.pasum >0){
		var rect1height=((curdata.pasum/10000)/dataObj.maxPosHeight)*dataObj.posdivheight;
		if(rect1height >dataObj.posdivheight )
			rect1height=dataObj.posdivheight+10;
		var rect1=Util.makeSVG("rect",{rx:"4",ry:"4",x:startx,y:dataObj.rectMaxHeight-rect1height,width:dataObj.rectWidth,
			height:rect1height,className:"orderRect"});
			group.appendChild(rect1);
	}
	if(curdata.recesum >0){
		var rect2height=((curdata.recesum/10000)/dataObj.maxPosHeight)*dataObj.posdivheight;
		if(rect2height >dataObj.posdivheight )
			rect2height=dataObj.posdivheight+10;
		var rect2=Util.makeSVG("rect",{rx:"4",ry:"4",x:startx+dataObj.rectWidth,y:dataObj.rectMaxHeight-rect2height,width:dataObj.rectWidth,
			height:rect2height,className:"reciveRect"});
			group.appendChild(rect2);
	}
	var ihtml=getRectTextDesc(time,index,startdate);
	if(time=="w")
		var textDesc=Util.makeSVG("text",{className:"posWord_w",y:dataObj.rectMaxHeight+15,x:startx+dataObj.rectWidth,ihtml:ihtml});
	else
		var textDesc=Util.makeSVG("text",{className:"posWord",y:dataObj.rectMaxHeight+15,x:startx+dataObj.rectWidth,ihtml:ihtml});
	textDesc.textContent=ihtml;
	group.appendChild(textDesc);
	if(isfirst)
		rectsvgdoc.prepend($(group));
	else
		rectsvgdoc[0].appendChild(group);
}
//绘制矩形
function drawRect(data,time,startdate){
	var rectsvgdoc=$("#qrectsvg");
	var rectTem=$("#chartRectTem").html(),recthtml="",
	rectInfo={rect:{}},centerX=Util.os.width/2-dataObj.rectWidth,
	rectMarginWidth=dataObj.rectWidth*2+dataObj.marginWidth;//两个矩形模块 同顶点之间的间距
	rectsvgdoc.children().remove();
	dataObj.rectSwipeWidth=rectMarginWidth,
	paramsarr=Util.getArrByN(dataObj.nwidth),maxamount=(data.ordermax > data.recemax) ? data.ordermax :data.recemax,
	maxposy=getPosArr(maxamount);
	updateproinfo(data["0"]);
	dataObj.maxPosHeight=maxposy;
	if(dataObj.dataType == 1)
		paramsarr=dataObj.nowparamsarr || paramsarr;
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
		var ihtml=getRectTextDesc(time,index,startdate);
		if(time =="w")
			var textDesc=Util.makeSVG("text",{className:"posWord_w",y:dataObj.rectMaxHeight+15,x:curRectInfo.sx,ihtml:ihtml});
		else
			var textDesc=Util.makeSVG("text",{className:"posWord",y:dataObj.rectMaxHeight+15,x:curRectInfo.sx,ihtml:ihtml});
		textDesc.textContent=ihtml;
		group.appendChild(textDesc);
		rectsvgdoc[0].appendChild(group);
	}
	setareainfo("rootarea",data.rootareas);
	drawBg2(time);
}
//实时数据---切换tab时，根据当前的params，重置取值数组
function getSetArrByparams(params){
	if(params.now ==1){
		if(params.kind == 1){//季度
			var paramstartdate=new Date(params.start),curstartdate=new Date();
			if(paramstartdate>curstartdate){
				dataObj.nowparamsarr=[-2,-1,0];
			}
			if(paramstartdate<curstartdate){
				dataObj.nowparamsarr=[0,1,2];
			}
			if(paramstartdate<curstartdate && new Date(params.end) > curstartdate){
				dataObj.nowparamsarr=[-1,0,1];
			}
		}
		if(params.kind == 2){//月份
			var paramstarM=(new Date(params.start)).getMonth(),
			curq=Util.getQuarter(paramstarM),curQMonth=(curq-1)*3;
			if(curQMonth==paramstarM){
				dataObj.nowparamsarr=[0,1,2];
			}
			if((paramstarM-curQMonth) ==1){
				dataObj.nowparamsarr=[-1,0,1];
			}
			if((paramstarM-curQMonth) ==2){
				dataObj.nowparamsarr=[-2,-1,0];
			}
		}
		if(params.kind == 3){
			var nextday=(new Date(params.end))*1+24*60*60*1000,
			nextmonth=(new Date(nextday)).getMonth(),startdate=(new Date(params.start)),
			curMonth=startdate.getMonth(),curyear=startdate.getFullYear(),
			nextwday=(new Date(params.end))*1+24*60*60*1000*14;
			if(nextmonth == curMonth){
				dataObj.nowparamsarr=[-1,0,1];
				if((new Date(nextwday)).getMonth()==curMonth){
					dataObj.nowparamsarr=[-1,0,1,2];
				}
			}else{
				dataObj.nowparamsarr=[-2,-1,0];
			}
			if((new Date(curyear,curMonth,1)).format("yyyy-MM-dd") == startdate.format("yyyy-MM-dd") )
				dataObj.nowparamsarr=[0,1,2];
			

		}
	}
}
//更新项目数 等信息
function updateproinfo(data){
	$(".chartTips span").each(function(){
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
		maxposarr=5;
		//var count=(maxposarr+"").split(".")[1].length;
		var count=0;
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
function getRectTextDesc(type,index,startdate){
	var str="",dataObj1=startdate ? {year:(new Date(startdate)).getFullYear(),month:(new Date(startdate)).getMonth()}: dataObj;

	if(type=="q"){
		str=(new Date(dataObj1.year,dataObj1.month+index*3,1)).format("yyyy-MM");
		strarr=str.split("-");
		str=strarr[0]+"Q"+Util.getQuarter(strarr[1]-1);
	}
	if(type == "m"){
		var cmindex=dataObj1.month+index;
		str=(new Date(dataObj1.year,dataObj1.month+index,1)).format("yyyy-MM");
		str=str.replace("-","M");
	}
	if(type == "w"){
		var wsdate=startdate ? new Date(startdate): new Date(),timestamp=(wsdate)*1 + (7*24*60*60*1000)*index;
		var sobj=Util.getweekdate(timestamp,dataObj.dataType,dataObj.nowmonth);
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
// 进入的 方法
function pinOutFn(){
	var activeG=$("#qrectsvg>g.active"),textdesc=activeG.find("text").attr("ihtml");
	if(textdesc.indexOf("~")>0) return;
		activeG.find("rect").addClass("rectscale");
		setTimeout(function(){
			if(textdesc.indexOf("Q") > 0){ //当前是季度
				var textarr=textdesc.split("Q"),smonth=(parseInt(textarr[1])-1)*3;
				dataObj.nowparamsarr=[0,1,2];
				if(dataObj.month-smonth<=3 && dataObj.dataType ==0){
					dataObj.params.start=(new Date(textarr[0],dataObj.month,1)).format("yyyy-MM-dd");
					dataObj.params.end=(new Date(textarr[0],dataObj.month+1,-1)).format("yyyy-MM-dd");
				}else{
					dataObj.params.start=(new Date(textarr[0],smonth,1)).format("yyyy-MM-dd");
					dataObj.params.end=(new Date(textarr[0],smonth+1,-1)).format("yyyy-MM-dd");
				}
				dataObj.params.kind=dataObj.timeobj['m'].kind;
				getstatisdata("m",dataObj.params.start,function(holdback){
						pinchback(holdback);
					});
			}else{
				if(textdesc.indexOf("M") > 0){ //当前月
					var textarr=textdesc.split("M"),sweekm=parseInt(textarr[1])-1;
					dataObj.curmonthover=false;
					dataObj.nowparamsarr=[0,1,2];
					if(dataObj.month == sweekm && dataObj.dataType == 0){//当前月
						var dateobjsm=Util.gettimebytype("week");
					}else{
						var dateobjsm=Util.gettimebytype("week",new Date(textarr[0],sweekm,1));
					}
					dataObj.params.start=dateobjsm.startdate;
					dataObj.params.end=dateobjsm.enddate;
					if(dataObj.dataType ==1){
						dataObj.nowmonth=sweekm;
						var newsdate=new Date(dateobjsm.startdate),newstartdatem=(newsdate).getMonth(),
						newedate=new Date(dateobjsm.enddate),newenddatem=newedate.getMonth();
						if(newstartdatem == sweekm-1){
							dataObj.params.start=(new Date(textarr[0],sweekm,1)).format("yyyy-MM-dd");
						}
						if(newenddatem == sweekm+1){
							dataObj.params.end=(new Date(textarr[0],sweekm,0)).format("yyyy-MM-dd");
						}
					}
					dataObj.params.kind=dataObj.timeobj['w'].kind;
					getstatisdata("w",dateobjsm.startdate,function(holdback){
						pinchback(holdback);
					});
				}
			}
		},600);
}
//回退的方法
function pineInFn(){
	var activeG=$("#qrectsvg>g.active"),textdesc=activeG.find("text").attr("ihtml");
	if(textdesc.indexOf("Q")>0) return;
		activeG.find("rect").addClass("rectscale2");
		setTimeout(function(){
			if(textdesc.indexOf("M") > 0){
				var textarr=textdesc.split("M"),squm=Util.getQuarterStartMonth(parseInt(textarr[1])-1),
				newdateobj=Util.gettimebytype("thisquarter",new Date(textarr[0],parseInt(textarr[1])-1,1));
				dataObj.nowparamsarr=[-1,0,1];
				dataObj.params.start=newdateobj.startdate;
				dataObj.params.end=newdateobj.enddate;
				dataObj.params.kind=dataObj.timeobj['q'].kind;
				getstatisdata("q",dataObj.params.start,function(holdback){
					pinchback(holdback);
				});
			}else if(textdesc.indexOf("~") > 0){
				var textarr=textdesc.split("~"),countdate=new Date("20"+textarr[0]),
				newdateobj=Util.gettimebytype("month",countdate),curmonth=countdate.getMonth(),
				mtnq=Util.getQuarter(curmonth),sindex=3-(curmonth-(mtnq-1)*3+1),arrall=Util.getArrByN(2);
				dataObj.nowparamsarr=arrall.slice(sindex,3+sindex);
				dataObj.params.start=newdateobj.startdate;
				dataObj.params.end=newdateobj.enddate;
				dataObj.params.kind=dataObj.timeobj['m'].kind;
				getstatisdata("m",dataObj.params.start,function(holdback){
					pinchback(holdback);
				});
			}
		},600);
}
function golastpage(){
	$.back();
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
  $.fn.replaceClass=function(oldClass,newClass){
  	var _this=$(this);
  	if(_this.hasClass(oldClass)){
  		var className=_this.attr("class"),reg=new RegExp(oldClass);
  		className=className.replace(reg,newClass);
  		_this.attr("class",className);
  	}else{
  		_this.addClass(newClass);
  	}
  }
})(Zepto, window)