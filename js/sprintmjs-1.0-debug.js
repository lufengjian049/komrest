var sprintUrl={
	//domain:"http://192.168.4.202:8280/komrestservice",
	// domain:"http://192.168.150.2:8280/komrestservice",
	//domain:"http://42.121.116.149:8280/komrestservice",
	domain:"http://42.120.17.217:8280/komrestservice",
	loadSprint:"/sprint/gettarget",  //加载冲刺管理数据,包括 验证 是否有当季目标
	addSprint:"/sprint/addtarget", //新增
	editSprint:"/sprint/updatetarget",//编辑
	loadRankinfo:"/sprint/myranking", //获取排名方法
	areaRank:"/sprint/listmag",//大区排名
	agencyRank:"/sprint/listagency" //办事处排名
},sprinttipsarr=[10,30,50,70,100,150,99999999999],sprinttips={
	'10':['万里长征第一步，能迈出第一脚，后面就顺了~','干啥呢，别在打瞌睡了，乌龟也已经跑老远了~','还在等大单呢，Boss该找你谈心了~'],
	'30':['好的开始是成功的一半，继续加油冲啊~','还在等大单呢，Boss该找你谈心了~','有希望就别放弃，丢脸事小，家里还等米下锅呢~'],
	'50':['Good job，胜利在向你招手~','赶紧冲呀，时间不等人，大家都靠你了~','赶紧加油了，Boss的催命电话要来了~'],
	'70':['牛掰呀，这次有机会拿大奖了，再加再励~','呦西，挽起袖子，搓搓手，再努把劲吧~','赶紧加油了，Boss的催命电话要来了~'],
	'100':['太牛掰了，大奖非你莫属了，等着Boss的热情之吻吧~','啧啧，目标完成大半，加把劲，争取拿第一~','就差一点点了，不要给自己留遗憾~'],
	'150':['你真是太厉害了，为自己鼓掌叫好吧！'],
	'99999999999':['恭喜恭喜，SuperStar，等着老贺给你发大红包吧！']
},todoArr=[],todoArrcon=[],qmindex=0,smallangle=0,scrollMainObj,currentdivobj=null;
$(function(){
	//cover
	//判断有无季度目标
	Util.removeAllCache();
	Util.getOs();
	var date=new Date(), year=date.getFullYear(),month=date.getMonth(),quarter=Util.getQuarter(month),loadurl=sprintUrl.domain+sprintUrl.loadSprint,token=Util.getUrlParams(location.href,"token"),scrollMainObj=null;//当前季度第几个月
	qmindex=(month-(quarter-1)*3);
	$("#hiddentoken").val(token);
	//页面加载，先进行验证 是否有当季目标，并初始化数据
	Util.showloadbox();
	$.mypost(loadurl,true,{token:token,year:year,quarter:quarter},function(result){
		var data=result.data;
		if(data.targetvalue){//有目标
			$(".cover").hide();
			$(".current").show();
			sprintDataManager(data);
		}else{//没有目标
			var innerdivh=240;
			$(".cover>div").css("margin-top",(Util.os.height-innerdivh)/2);
			$(".cover").show();
		}
		Util.hideloadbox();
	},"GET");
	
	//绑定事件
	$(document).on("tap","#sprintTaptoinput",function(){
		$(this).hide().next().show().focus().on("keyup",function(e){
			//console.log(e.keyCode);
			if($(this).val()){
				$("#countparam").show();
				$(".sprintGoOp").addClass("go");
				$(this).attr("oldValue",$(this).val());
			}else{
				//$(".sprintGoOp").removeClass("go");
				if(e.keyCode == 8) {
					$(this).attr("oldValue","");$(".sprintGoOp").removeClass("go");
				}
				$(this).val(($(this).attr("oldValue") || ''));
			}
		});
	})
	//填写完目标 点击 Go
	$(document).on("tap",".sprintStartGo",function(){
		if(!$(this).hasClass("go")) return;
		var quartertargetval= Util.toFloat($("#thisQuartertarget").val())*10000,addUrl=sprintUrl.domain+sprintUrl.editSprint;
		Util.showloadbox(true);
		$.mypost(addUrl,true,{token:token,year:year,quarter:quarter,targetvalue:quartertargetval},function(result){
			$(".cover").addClass("hide");
			setTimeout(function(){
				$(".cover").removeClass("hide").hide();
				$(".current").show();
				sprintDataManager(result.data);
				Util.hideloadbox();
			},400);
		},"GET");
	})
	$(document).on("tap","#loadOrderDetail",function(){
		var infourl="sprintRankinfo.html?ran="+Math.random()+"&token="+token;
		$(this).closest(".view").loadNextPage(infourl,function(url){
			loadDetailRankInfo(url);
		})
	});
	$(document).on("tap","#sprintRankTab>a",function(){
		if(!$(this).hasClass("mui-active")){
			$(this).addClass("mui-active").siblings().removeClass("mui-active");
			$($(this).attr("href")).addClass("mui-active").siblings(".scrollviewcontent").removeClass("mui-active");
			if($($(this).attr("href")).find("table>tbody>tr").length == 0){
				loadDetailRankInfo();
			}
		}
	})
	$(window).on("swipeRight", function(e) {
		$.back();
		e.stopImmediatePropagation();
		return false;
	});
	$(document).on("tap", ".mui-action-backup", function(e) {
		if ($(this).data("backtop") == "1") {
			if (true) {
				window.location = "objc://goback";
			}
		} else {
			$.back();
		}
		return false;
	});
	//编辑
	$(document).on("tap","#editTargetbtn",function(){
		//$(".current").hide();
		var curindex=layer.open({
			closeNone:true,
		    type: 1,
		    content: $("#popbox").html(),
		    title:['编辑冲刺目标',"text-align:center;padding-left: 50px;"],
		    style: 'width:80%; height:153px;border-radius:10px;',
		    btn:["确认","取消"],
		    success:function(){
		    	$("#newtargetvalue",$(".layermbox")).attr("autofocus","autofocus");
		    },
		    yes:function(){
		    	var targetvaluenew=$("#newtargetvalue",$(".layermbox")).val();
		    	if(targetvaluenew){
		    		var quartertargetval=Util.toFloat(targetvaluenew)*10000,addUrl=sprintUrl.domain+sprintUrl.editSprint;
		    		Util.showloadbox(true);
		    		$.mypost(addUrl,true,{token:token,year:year,quarter:quarter,targetvalue:quartertargetval},function(result){
						sprintDataManager(result.data,'update');
						//$("canvas").show();
						Util.hideloadbox();
						layer.close(curindex);
					},"GET");
		    	}
		    },no:function(){

		    }
		});
		
		// var targetvaluenew=prompt("请输入新的季度目标(万)"),quartertargetval=Util.toFloat(targetvaluenew)*10000,
		// addUrl=sprintUrl.domain+sprintUrl.editSprint;
		// Util.showloadbox(true);
		// if(targetvaluenew){
		// 	$.mypost(addUrl,true,{token:token,year:year,quarter:quarter,targetvalue:quartertargetval},function(result){
		// 		sprintDataManager(result.data,'update');
		// 		//$("canvas").show();
		// 		Util.hideloadbox();
		// 	},"GET");
		// }else{
		// 	Util.hideloadbox();
		// }
		
	})
	$(document).on("tap",".modalClose",function(){
		$("#editpopbox").removeClass().addClass("view").addClass("popbox");
		// $(".current").show();
		currentdivobj.addClass("current");
	})
	$(document).on("tap",".modalOK",function(){
		var newtarget=$("#newtargetvalue"),quartertargetval=Util.toFloat(newtarget.val())*10000,
		addUrl=sprintUrl.domain+sprintUrl.editSprint;
		//Util.showloadbox(true);
		if(newtarget.val()){
			$.mypost(addUrl,true,{token:token,year:year,quarter:quarter,targetvalue:quartertargetval},function(result){
				$(".modalClose").trigger("tap");
				sprintDataManager(result.data,'update');
				//$("canvas").show();
				//Util.hideloadbox();
			},"GET");
		}else{
			//Util.hideloadbox();
		}
	})
})
$.back = function() {
	var curview = $(".view").filter(".current"),
		prevoview = curview.prev(),
		cindex = $(".view").index(curview);
	if (prevoview.length && !prevoview.hasClass("cover")) {
		if (cindex == 2) {
			var flag3 = {
				flag: true
			};
			window.location = "objc://setmainflag/" + JSON.stringify(flag3);
		}
		curview.addClass("backout");
		prevoview.addClass("backin");
		setTimeout(function() {
			curview.removeClass().addClass("view").addClass("next").hide();
			prevoview.removeClass().addClass("view").addClass("current");
		}, 800);
	} else {
		window.location = "objc://goback";
	}
}
function sprintDraw(data){
	$("#firstcanvas").remove();
	$("#desStatus").append("<canvas id='firstcanvas'></canvas>");
}
//页面 图表 数据初始化方法
function sprintDataManager(data,type){
	var commitsum=data['c1']+data['c10'],//commit 总金额
	selloutw=data['o1']+data['o10']+data['o21']+data['o25']+data['o30'],//待sell out
	sellouted=data['o45']+data['o50'],//已Sellout.
	targetvalue=data['targetvalue'],//目标值
	targetpert=Math.round(sellouted/targetvalue*100),//目标达成率
	totalamount=commitsum+selloutw+sellouted,
	pretarget=Math.round((totalamount)/targetvalue*100),//预计目标达成率
	tipsstring='';//提示文字
	for(var i=0;i<sprinttipsarr.length;i++){
		if(targetpert<sprinttipsarr[i]){
			if(targetpert > 100) qmindex=0;
			tipsstring=sprinttips[sprinttipsarr[i]][qmindex];
			break;
		}
	}//获取提示性文字
	$("#targetSpan").html((targetvalue/10000).toFixed(2));//目标值
	$("#pretargetPre").html(pretarget+"%");//预计完成率
	$("#totalamountspan").html((totalamount/10000).toFixed(2));
	if(!type){
		$(".linear-gradient-div").each(function(){
			var _this=$(this),headheight=_this.find(".statusHeader").height();
			_this.find("canvas").attr("width",_this.width()-10).attr("height",_this.height()-headheight-10);
		});
	}
	//第一部分 canvas
	var firstcanvas=$("#firstcanvas"),ctx=firstcanvas[0].getContext("2d"),fcanvawidth=firstcanvas.width(),
	mainBgImgObj=$("#firstMainBg"),imgX=(fcanvawidth-140)/2,mainstartAngle=Math.PI*0.752,
	mainendAngle=Math.PI*2.246,targetEndAngle=(targetpert/150)*(mainendAngle-mainstartAngle)+mainstartAngle;
	(targetEndAngle>mainendAngle) && (targetEndAngle=mainendAngle);
	var mainitemangle=(targetEndAngle-mainstartAngle)/10;
	if(type=="update"){
		ctx.clearRect(0,0,fcanvawidth,firstcanvas.height());
		$("#desStatus").find(".canvastext").remove();
		//$(".canvastext").remove();
	}
	ctx.drawImage(mainBgImgObj[0],imgX,6);
	//绘制进度条 -- 目标达成率 > 0
	if(targetpert >0){
		var g=ctx.createLinearGradient((fcanvawidth/2-50),firstcanvas.height(),(fcanvawidth/2+50),firstcanvas.height());
		g.addColorStop(0,"#fd08a8");
		g.addColorStop(0.4,"#ff1415");
		var timerendAngle=mainstartAngle+mainitemangle;
		var maintargetTimer=setInterval(function(){
			Util.drawpartarc(firstcanvas,ctx,{x:fcanvawidth/2,y:76,radius:70,startAngle:mainstartAngle,endAngle:timerendAngle,color:g});
			Util.drawarc(firstcanvas,ctx,{x:fcanvawidth/2,y:76,radius:64,color:"liner",startColor:"#C8D1D8",endColor:"#9AADB7"});//遮罩
			if(timerendAngle >= targetEndAngle){
				clearInterval(maintargetTimer);
			}
			timerendAngle+=mainitemangle;
			(timerendAngle >= mainendAngle) && (timerendAngle = mainendAngle);
		},100);
	}
	//绘制当前完成率 文字
	var currentper=0,itemtextdraw=parseInt((targetpert-currentper)/10);
	(itemtextdraw==0) && (itemtextdraw=1);
	Util.drawTextNew(firstcanvas,ctx,{text:['当前完成率'],baseX:fcanvawidth/2,baseY:78,fontsize:"13px"});
	Util.drawTextNew(firstcanvas,ctx,{text:['0%'],baseX:fcanvawidth/2+8,baseY:108,fontsize:"30px",textid:"targetperdiv"});
	var drawtexttimer=setInterval(function(){
		var drawtext=currentper+"%";
		$("#targetperdiv").html(drawtext);
		(currentper==targetpert) && (clearInterval(drawtexttimer));
		currentper+=itemtextdraw;
		if(currentper>=targetpert){
			currentper=targetpert;
		}
	},100);
	//绘制提示性文字
	Util.drawTextNew(firstcanvas,ctx,{text:[tipsstring],baseX:fcanvawidth/2,baseY:152,textwidth:100});
	if(type=="update"){
		return false;
	}
	//第二部分 总数据统计
	var seccanvas=$("#seccanvas"),ctx2=seccanvas[0].getContext("2d"),commitangle=(Math.PI*2)*(commitsum/totalamount),selloutwangle=(Math.PI*2)*(selloutw/totalamount),
	angleArrObj=[
	{start:0,end:commitangle,radius:(58+parseInt(Math.random()*10)),color:"#047bc1",text:"Commit",amount:Util.toTenThous(commitsum)},
	{start:commitangle,end:(commitangle+selloutwangle),radius:(58+parseInt(Math.random()*10)),color:"#fcbc13",text:"待Sell out",amount:Util.toTenThous(selloutw)},
	{start:(commitangle+selloutwangle),end:Math.PI*2,radius:(58+parseInt(Math.random()*10)),color:"#f35040",text:"已Sell out",amount:Util.toTenThous(sellouted)}
	];
	Util.drawarc(seccanvas,ctx2,{radius:70,shadow:true});
	Util.canvasMove(seccanvas,ctx2,angleArrObj,function(newanglearr,isend){
		for(var j=0;j<newanglearr.length;j++){
			if(newanglearr[j].amount== 0) continue;
			Util.drawpartarc(seccanvas,ctx2,{radius:newanglearr[j].radius,startAngle:newanglearr[j].start,endAngle:newanglearr[j].end,color:newanglearr[j].color,text:newanglearr[j].text,amount:newanglearr[j].amount,tocallback:isend});
		}
		Util.drawarc(seccanvas,ctx2,{radius:40,color:"liner",startColor:"#BEC9D1",endColor:"#A5B5BF"});//遮罩
	});
	
	if(Util.os.height > 550){
		//commit数据
		todoCommitData(data);
		todoArr=[todoSellOutWData,todoSellOutedData,todoLoadOrderData];
		todoArrcon=[false,false,false];
	}else{
		todoArr=[todoCommitData,todoSellOutWData,todoSellOutedData,todoLoadOrderData];
		todoArrcon=[false,false,false,false];
		(Util.os.android) && todoCommitData(data);
	}
	//滚动 初始化
	if(Util.os.android){
		todoSellOutWData(data);
		todoSellOutedData(data);
		todoLoadOrderData(data);
		scrollMainObj=new IScroll($(".scrollviewcontent"),{probeType: 3});
	}else{
		scrollMainObj=new IScroll($(".scrollviewcontent"),{probeType: 3});
		scrollMainObj.on("scroll",function(e){
			//console.log(this.directionY);
			if(this.directionY > 0){
				var scrollh=Math.abs(this.y)+100,index=parseInt(scrollh/200),todoarrLength=todoArr.length;
				if(index>=1 && !todoArrcon[index-1] && index <=todoarrLength ){
					todoArr[index-1](data);
					todoArrcon[index-1]=true;
				}
			}
		});
	}
}
function todoCommitData(data){
	//commit数据
	var thirdcanvas=$("#thirdcanvas"),ctx3=thirdcanvas[0].getContext("2d");
	Util.drawNewRec(thirdcanvas,ctx3,{color:"#f14b40",drawinfo:[{text:"审核中",amount:data['c1']},{text:"已审未sell out",amount:data['c10']}]});
}
//	//待Sell Out数据
function todoSellOutWData(data){
	var forthcanvas=$("#forthcanvas"),
		selloutw=data['o1']+data['o10']+data['o21']+data['o25']+data['o30'],
		ctx4=forthcanvas[0].getContext("2d"),o1angle=(data['o1']/selloutw)*(Math.PI*2),o10angle=(data['o10']/selloutw)*(Math.PI*2)+o1angle,o21angle=(data['o21']/selloutw)*(Math.PI*2)+o10angle,o25angle=(data['o25']/selloutw)*(Math.PI*2)+o21angle,
		forthAngleArr=[
		{start:0 ,end:o1angle,radius:(58+parseInt(Math.random()*10)),color:"#2796d9",text:"审核中",amount:Util.toTenThous(data['o1'])},
		{start:o1angle,radius:(58+parseInt(Math.random()*10)),end:o10angle,color:"#73964e",text:"已审未签",amount:Util.toTenThous(data['o10'])},
		{start:o10angle,radius:(58+parseInt(Math.random()*10)),end:o21angle,color:"#59a8b3",text:"签约中",amount:Util.toTenThous(data['o21'])},
		{start:o21angle,radius:(58+parseInt(Math.random()*10)),end:o25angle,color:"#ead038",text:"已签未付款",amount:Util.toTenThous(data['o25'])},
		{start:o25angle,radius:(58+parseInt(Math.random()*10)),end:Math.PI*2,color:"#ee9840",text:"已签未未发货",amount:Util.toTenThous(data['o30'])}
		],minradius=58;
		Util.drawarc(forthcanvas,ctx4,{radius:70,shadow:true});
		Util.canvasMove(forthcanvas,ctx4,forthAngleArr,function(newanglearr,isend){
			for(var j=0;j<newanglearr.length;j++){
				if( newanglearr[j].amount== 0) continue;
				Util.drawpartarc(forthcanvas,ctx4,{radius:newanglearr[j].radius,startAngle:newanglearr[j].start,endAngle:newanglearr[j].end,color:newanglearr[j].color,text:newanglearr[j].text,amount:newanglearr[j].amount,tocallback:isend});
			}
	//		ctx4.globalCompositeOperation="destination-out";
			Util.drawarc(forthcanvas,ctx4,{radius:40,color:"liner",startColor:"#BEC9D1",endColor:"#A5B5BF"});//遮罩
		});
}
//已Sell Out数据
function todoSellOutedData(data){
	var fivecanvas=$("#fivecanvas"),
	ctx5=fivecanvas[0].getContext("2d");
	Util.drawNewRec(fivecanvas,ctx5,{color:"#fcc125",drawinfo:[{text:"付款中",amount:data['o45']},{text:"完成收款",amount:data['o50']}]});
}
//加载 排名情况
function todoLoadOrderData(data){
	var url=sprintUrl.domain+sprintUrl.loadRankinfo+"?token="+$("#hiddentoken").val();
	$.mypost(url,true,{},function(result){
		result=result.data;
		if(result.areapos && !result.listmag){
			var tem=$("#mianOrderTem").html(),appendhtml="",theorderwrapper=$("#theorderwrapperid"),areaper=((result.areapos/result.areatotal).toFixed(2))*100;
			appendhtml=tem.replace("$name$","所属大区").replace("$typeclass$","areabg").replace("$bgwidth$","0%").replace("$numindex$","No."+result.areapos);
			theorderwrapper.append("<div>"+appendhtml+"</div>");
			var sexcanvas1=theorderwrapper.find("canvas"),ctx6=sexcanvas1[0].getContext("2d"),divindex=1;
			Util.drawOrderTips(sexcanvas1,ctx6,{});
			var areatimeritem=(100-areaper)/10,areabgdiv=theorderwrapper.find(".orderbg").eq(1),startwidtharea=0,
			areatimer=setInterval(function(){
				startwidtharea+=areatimeritem;
				areabgdiv.css("width",startwidtharea+"%");
				sexcanvas1.css("left",(100-startwidtharea-5)+"%");
				if(startwidtharea >= (100-areaper)){
					clearInterval(areatimer);
				}
			},100);
			sexcanvas1.next().css("left",(areaper-10)+"%").show();
			if(result.agencypos){//有办事处
				var currentdiv;
				for(var agencykey in result.agencypos){
					var agencyper=((result.agencypos[agencykey]/result.agencytotal).toFixed(2))*100;
					appendhtml=tem.replace("$name$",agencykey).replace("$typeclass$","bscbg").replace("$bgwidth$","0%").replace("$numindex$","No."+result.agencypos[agencykey]);
					theorderwrapper.append("<div>"+appendhtml+"</div>");
					currentdiv=theorderwrapper.children("div").eq(divindex),currentdiv.sexcanvas2=currentdiv.find("canvas"),currentdiv.ctx7=currentdiv.sexcanvas2[0].getContext("2d");
					Util.drawOrderTips(currentdiv.sexcanvas2,currentdiv.ctx7,{graSColor:"#2499d0",graEColor:"#2489c3"});
					currentdiv.agencybgdiv=currentdiv.find(".orderbg").eq(1),currentdiv.startwidthagency=0;
					currentdiv.agencyper=agencyper;
					// currentdiv.timer=setInterval(function(){
					// 	currentdiv.startwidthagency+=(100-currentdiv.agencyper)/10;
						currentdiv.agencybgdiv.css("width",(100-agencyper)+"%");
						currentdiv.sexcanvas2.css("left",(agencyper-5)+"%");
						// if(currentdiv.startwidthagency >= (100-currentdiv.agencyper)){
						// 	clearInterval(currentdiv.timer);
						// }
						//console.log(agencyper);
					//},100);
					var divnumpos=(agencyper-10) < -3 ?  -3 :(agencyper-10);
					currentdiv.sexcanvas2.next().css("left",divnumpos+"%").show();
					divindex++;
				}
			}
		}
		if(result.listmag){
			var rankinfotable=$("#rankinfotable"),tablehtml="",datalist=result.listmag;
			for(var i=0;i<result.listmag.length;i++){
				var targetvalueinner=(datalist[i].targetvalue==0 || datalist[i].finishvalue ==0) ? 0 :parseInt((datalist[i].finishvalue/datalist[i].targetvalue)*100);
				tablehtml+="<tr><td>"+datalist[i].username+"</td><td>"+(datalist[i].finishvalue/10000).toFixed(2)+"</td><td>"+targetvalueinner+"%</td></tr>";
			}
			rankinfotable.show().find("tbody").html(tablehtml);
		}
		scrollMainObj.refresh();
	},'GET');
}
//排名详情页 数据加载
function loadDetailRankInfo(url){
	Util.showloadbox(true);
	var activeTab=$("#sprintRankTab").find("a.mui-active"),url=sprintUrl.domain+sprintUrl[activeTab.attr("loadurl")]+"?token="+$("#hiddentoken").val(),activeTable=$(activeTab.attr("href")).find("table"),ttype=activeTable.attr("ttype");
	$.mypost(url,true,{},function(result){
		var datalist=result.data.list,tablehtml="";
		if(ttype == "area"){
			for(var i=0;i<datalist.length;i++){
				var targetvalueinner=(datalist[i].targetvalue==0 || datalist[i].finishvalue ==0) ? 0 :parseInt((datalist[i].finishvalue/datalist[i].targetvalue)*100);
				tablehtml+="<tr><td>"+datalist[i].username+"</td><td>"+(datalist[i].targetvalue/10000).toFixed(2)+"</td><td>"+(datalist[i].finishvalue/10000).toFixed(2)+"</td><td>"+targetvalueinner+"%</td></tr>";
			}
		}else{
			for(var i=0;i<datalist.length;i++){
				if(i<8){
					tablehtml+="<tr class='agencyfirst8'>";
				}else{
					if(datalist.length > 16 && i<(datalist.length-8)){
						tablehtml+="<tr class='agencyitem'>";
					}else{
						tablehtml+="<tr class='agencylast8'>";
					}
				}
				tablehtml+="<td>No."+(i+1)+"</td><td>"+datalist[i].areaname+"</td><td>"+((datalist[i].finishvalue/10000).toFixed(2))+"</td></tr>";
			}
		}
		activeTable.find("tbody").html(tablehtml);
		if(activeTable.next().length){
			activeTable.next().remove();
		}
		activeTable.parent().append("<div class='lastUpdatetime'>数据最后更新时间为:"+result.data.moditime+"</div>")
		if(ttype == "area")
			new IScroll($("#areadiv"));
		else
			new IScroll($("#agencydiv"));
		Util.hideloadbox();
	},"GET");
}

//交互
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
  $.fn.myLoad=function(url,data,callback,async){
		var _this=$(this);
		async=async||false,cachedata=Util.getCache(url,Util.getStamp());
		if(cachedata){
			_this.html(cachedata.data);
			if(callback)
				callback(_this);
		}else{
			$.ajax({url:url,data:data,async:async,dataType:"text",error:function(){
			// box.alert(kmsg.ajaxerrorMsg);
			},success:function(rehtml){
				if (rehtml) {
					_this.html(rehtml);
					Util.setCache(url,rehtml);
					if(callback)
						callback(_this);
				}
			}});
		}
		return this;
	}
  //新框架  加载下一页 数据
$.fn.loadNextPage = function(url, callback) {
	var viewobj = $(this);
	if (!viewobj.next().hasClass("next")) {
		viewobj.after("<div class='view next'></div>"); //没有动画效果？？？
	}
	var newviewovj = viewobj.next();
	newviewovj.show().myLoad(url, {}, function(curobj) {
		var flag3 = {
					flag: false
				};
		window.location = "objc://setmainflag/" + JSON.stringify(flag3);
		var title = decodeURIComponent(Util.getUrlParams(url, "title")),
			replaceobj = {
				title: title.trim()
			};
		curobj.find(".replaceitem").each(function() {
			$(this).html(replaceobj[$(this).attr("replaceitem")])
		})
		viewobj.addClass("out");
		newviewovj.addClass("in");
		setTimeout(function() {
			viewobj.removeClass().addClass("view");
			newviewovj.removeClass().addClass("view").addClass("current");
		}, 800);
		callback(url);
	}, true);
}
	
})(Zepto, window)