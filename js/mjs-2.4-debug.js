var hrefobj = {
		//domain:"http://192.168.4.202:8280/komrestservice",
		// domain:"http://192.168.150.2:8280/komrestservice",
		domain:"http://42.121.116.149:8280/komrestservice",
	//	domain: "http://42.120.17.217:8280/komrestservice",
		comanageurl: "/quote/comanage", //commit-order管理 统计 页面(首页)
		listurl: "/quote/coquery", //commit-order 列表地址
		areaurl: "/other/arealist", //管辖地区地址
		detailurl: "/order/orderdetail", //commit-order 状态详情地址
		loseorderurl: "/order/missorder" //已丢单 链接
	},
	opobj = {
		viewscrollobj: null,
		curli: null,
		curbtnobj: null,
		btnop: false,
		formparams: null,
		lasttotal: null,
		ajaxerrorinfo: "请求出错,请联系管理员",
		datesobj: {
			"c60": "丢单时间",
			"c0": "报价终审时间",
			"c1": "Commit申请时间",
			"o1": "预计Sell Out时间",
			"o2": "实际Sell Out时间"
		},
		curdateobj: null,
		res: null,
		totalPrice: null,
		currentPrice: null
	},
	starttime = null,
	endtime = null;
$(function() {
	Util.removeAllCache(); //------------开发测试用 正式 删除该方法
	//--------------------页面初始化----------------
	$("div.mui-content").initEntryDataZ({
		callback: function(data, nopjax) {
			initentrydata(data, nopjax);
		}
	});
	Util.getOs();
	document.addEventListener('touchmove', function(e) {
		e.preventDefault();
	}, false);
	//----------------注册的事件---------------
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
	//右侧菜单按钮事件
	$(document).on("tap", "#extenddivmenu", function() {
		var slidemenu = $(".slidemenu");
		if (slidemenu.hasClass("show2")) {
			slidemenu.removeClass("show2").addClass("hide2");
			$("div.current").css({
				"-webkit-transform": "translate(0,0) translateZ(0)",
				"-webkit-transition": "-webkit-transform 400ms"
			});
			$(this).removeData("swipe");
			setTimeout(function() {
				slidemenu.removeClass("hide2").hide();
				$("div.current").css({
					"-webkit-transform": "dsds",
					"-webkit-transition": "dsds"
				});
				$("#detailmask").hide();
			}, 400);
		} else {
			slidemenu.removeClass("hide2").addClass("show2").show();
			$("div.current").css({
				"-webkit-transform": "translate(-80%,0) translateZ(0)",
				"-webkit-transition": "-webkit-transform 400ms"
			});
			$("#detailmask").show();
			(new IScroll($(".slidemenu>.scrollviewcontent")));
			$(this).data("swipe", true);
		}
	})
	$("#popbtns").on("tap", "span", function() {
		btntapevent(this);
	})
	$(document).on("tap", "div.haslink", function() {
		var id = $(this).data("channelid"),
			sendparams = {
				tab: $(this).attr("type"),
				id: id
			};
		window.location.href = "objc://loaddetailwin/" + JSON.stringify(sendparams);
	});
	$(document).on("tap", "#detailsearch", function() {
		opobj.searched = true;
		searchlistdata();
	});
	$(window).on("swipeLeft", function(e) {
		var extendbtn = $("#extenddivmenu"),
			cview = extendbtn.closest(".view");
		if ($(".view").index(cview) == 2 && cview.hasClass("current")) {
			if (!extendbtn.data("swipe")) {
				extendbtn.trigger("tap");
				extendbtn.data("swipe", true);
			}
		}
		e.stopImmediatePropagation();
		return false;
	});
	$(window).on("swipeRight", function(e) {
		var extendbtn = $("#extenddivmenu");
		if (extendbtn.data("swipe")) {
			(extendbtn.css("display") != "none") && extendbtn.trigger("tap");
			extendbtn.removeData("swipe");
		} else {
			$.back();
		}
		e.stopImmediatePropagation();
		return false;
	});

	$(document).on("tap", ".kom-entry", function() {
		var _this = $(this),
			url = "";
		showloadbox(true);
		if (_this.hasClass("entry-dis")) {
			hideloadbox();
		} else {
			var curstatusn = _this.text(),
				remark = _this.find("div.otherinfo").html(),
				badge = _this.find(".mui-badge").html(),
				url = "";
			curstatusn = curstatusn.replace(remark, "").replace(badge, "");
			if (_this.hasClass("kom-entry-harf")) {
				if (_this.hasClass("harf-left")) curstatusn = "产品" + curstatusn;
				else curstatusn = "服务" + curstatusn;
			}
			if (_this.closest(".slidemenu").length) {
				$("#extenddivmenu").trigger("tap");
				$(".view").eq(2).find(".mui-title").html(curstatusn);
				$("#typehidden").val(_this.data("entry"));
				loaddatalist($("div.mui-loading"));
			} else {
				url = "viewdetail.html?ran=" + Math.random() + "&title=" + encodeURIComponent(curstatusn) + "&type=" + _this.data("entry");
				_this.closest(".view").loadNextPage(url, function(url) {
					viewdataload(url);
				});
			}
		}
	})
	$(document).on("tap", ".pjaxitem", function() {
			var costatus = $("#typehidden").val(),
				type = '',
				pstaus = costatus.substr(0, 1),
				status = costatus.substr(1),
				ordertype = '-1',
				title = '订单详情',
				_this = $(this),
				url = "";
			opobj.currentPrice = _this.attr("oldprice");
			if ($(status).indexOf('-')) {
				var statusarr = status.split('-');
				ordertype = statusarr[1];
				status = statusarr[0];
			}
			opobj.curli = _this.index();
			if (pstaus == "c") {
				if (status == "0")
					type = "pricedetail";
				else
					type = "commitdetail";
			} else {
				if (status == "0")
					type = "commitdetail";
			}
			var sendparams = {
				id: _this.attr("priceid"),
				applystatus: 2,
				tab: type,
				stauts: status,
				type: ordertype
			};
			if (type) {
				window.location.href = "objc://getkinddetail/" + JSON.stringify(sendparams);
			} else {
				url = "orderinfo.html?ran=" + Math.random() + "&title=" + title + "&myreview=" + _this.hasClass("reviewitem") + "&orderid=" + _this.attr("orderid") + "&p_manage=" + _this.attr("btnmanager") + "&status=" + $("#typehidden").val() + "&priceid=" + _this.attr("priceid") + "&p_busimeb=" + _this.attr("busimeb");
				_this.closest(".view").loadNextPage(url, function(url) {
					orderdetailload(url);
					//iscroll
				});
			}
		})
		//搜索下拉 按钮事件
	$(document).on("tap", "#clickdownwrap", function() {
			var _this = $(this);
			$("#detailmask").show();
			$("#othersearch").show();
			_this.prev().find("button").hide().eq(1).next().css("right", "10px").siblings("input").css({
				"width": "100%",
				"text-align": "left"
			}).next().hide();
			_this.hide();
			$("#clickdownwrapup").show();
			$(".searchdiv input").each(function() {
				if (!$(this).val()) {
					$(this).focus();
					return false;
				}
			});
			var ddlobj;
			$("div.mui-input-row").each(function() {
				var _this = $(this);
				if (_this.data("dropdownlist")) {
					ddlobj = _this;
					_this.find("input[type='text']").on("input", function() {
						if (_this.next().is("ul")) {
							_this.next().show();
							vaguesearch($(this));
						}
					})
					return false; //break
				}
			});
			createddllist(ddlobj);
		})
		//搜索结束 关闭 事件
	$(document).on("tap", "#clickdownwrapup", function() {
		$("#othersearch").hide();
		$(this).hide();
		var projectinputobj = $("#clickdownwrap").show().prev().find("input");
		if (projectinputobj.val()) {
			projectinputobj.focus().css({
				"width": "70%",
				"text-align": "left"
			});
			projectinputobj.siblings("button").show().eq(1).next().css({
				"right": "94px"
			});
		} else
			projectinputobj.css({
				"width": "100%",
				"text-align": "center"
			}).next().show();
		$("#detailmask").hide();
	})

	$(document).on("tap", "#selecttime", function() {

			var _thisb = $(this),
				ddtype = _thisb.attr("dtype"),
				sendparams = {
					max: '',
					min: ''
				};

			window.location.href = "objc://pickdate/" + JSON.stringify(sendparams);


		})
		//--------------------------------注册的事件 over
		// history.pushState({url:location.href},"Commit & Sell out管理",location.href);

});
//共用方法 && 自定义
$.back = function() {
		var curview = $(".view").filter(".current"),
			prevoview = curview.prev(),
			cindex = $(".view").index(curview);
		if (prevoview.length && !prevoview.hasClass("slidemenu")) {
			if (cindex == 2) {
				var flag3 = {
					flag: true
				};
				window.location = "objc://setmainflag/" + JSON.stringify(flag3);
			}
			if (opobj.btnop2) {
				deleteliop();
				opobj.btnop2 = false;
			}
			curview.addClass("backout");
			prevoview.addClass("backin");
			setTimeout(function() {
				if (cindex == 2 && opobj.btnop)
					reloadmaindata();
				curview.removeClass().addClass("view").addClass("next");
				prevoview.removeClass().addClass("view").addClass("current");
			}, 800);
		} else {
			window.location = "objc://goback";
		}
	}
	//kom-entry 块数据的加载与显示
$.fn.initEntryDataZ = function(options) {
		var _this = $(this),
			token = Util.getUrlParams(location.href, "token"),
			url = hrefobj["domain"] + hrefobj.comanageurl + "?token=" + token;
		if (_this.data("initajax")) {
			$("#huserid").val(token);
			$("#hcommitpre").val(Util.getUrlParams(location.href, "commitshow"));
			$("#horderpre").val(Util.getUrlParams(location.href, "ordershow"));
			$.mypost($.setRanUrl(url), false, {}, function(data) {
				options.callback(data['data']);
			}, 'GET');
		}
		return _this;
	}
	//新框架  加载下一页 数据
$.fn.loadNextPage = function(url, callback) {
	var viewobj = $(this);
	if (!viewobj.next().hasClass("next")) {
		viewobj.after("<div class='view next'></div>"); //没有动画效果？？？
	}
	var newviewovj = viewobj.next();
	newviewovj.myLoad(url, {}, function(curobj) {
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
$.setRanUrl = function(url) {
		if (url) {
			var ranstr = "ran=" + Math.random();
			url = url.indexOf("?") > -1 ? (url + "&" + ranstr) : (url + "?" + ranstr);
		}
		return url;
	}
	//操作按钮的处理

function btntapevent(obj, url) {
		var curstatus = $("#typehidden").val(),
			curitemparams = $("#itemparams").val(),
			sendparams = {
				applystatus: 2,
				tab: $(obj).attr("type"),
				type: $(obj).attr("typep") || 0
			};
		opobj.curbtnobj = $(obj);
		if (!curitemparams) {
			var idp = Util.getUrlParams(url, "priceid"),
				ido = Util.getUrlParams(url, "orderid"),
				curid = ido || idp;
			curitemparams = {
				id: curid,
				pid: idp
			};
		} else {
			curitemparams = JSON.parse(curitemparams);
		}
		sendparams = $.extend(sendparams, curitemparams);
		if (sendparams.tab == "loseorder") {
			window.location.href = "objc://gotomissorder/" + JSON.stringify(sendparams);
		} else if (sendparams.tab == "editorder") {

			var url2 = "editorderstatus.html?ran=" + Math.random() + "&title=编辑订单状态&myreview=0&orderid=" + ido + "&p_manage=0&status=30&priceid=" + idp + "&p_busimeb=0";
			$(obj).closest(".view").loadNextPage(url2, function(url2) {
				orderdetailload(url2);
				//iscroll
			});
		} else {
			if ($(obj).attr("confirminfo")) {
				sendparams.commitstatus = 1;
				window.location.href = "objc://openwin/" + JSON.stringify(sendparams);
			} else {
				sendparams.commitstatus = 0;
				window.location.href = "objc://openwin/" + JSON.stringify(sendparams);
			}
		}
	}
	//创建下拉数据

function createddllist(curObj) {
		var ulhtml = "<ul class='ddllist' style='display:none'>",
			loadurl = hrefobj.domain + hrefobj[curObj.attr("loadurl")];
		//请求获取数据
		loadurl += "?token=" + $("#huserid").val();
		if (sessionStorage.arealisthtml) {
			curObj.after(sessionStorage.arealisthtml);
			initDdlEvent(curObj.next());
		} else {
			$.mypost(loadurl, true, {}, function(result) {
				if (result.data.total > 0) {
					var dlist = result.data.arealist;
					for (var i = 0; i < dlist.length; i++) {
						ulhtml += "<li alt='" + dlist[i]["areaid"] + "'>" + dlist[i]["areaname"] + "</li>"
					}
					ulhtml += "</ul>";
					curObj.after(ulhtml);
					sessionStorage.arealisthtml = ulhtml;
					initDdlEvent(curObj.next());
				}
			}, "GET");
		}
	}
	//注册ddl的选择数据事件

function initDdlEvent(ulobj) {
		$("li", ulobj).on("tap", function() {
			var _this = $(this),
				inputs = _this.parent().prev().find("input");
			inputs.eq(0).val(_this.attr("alt"));
			inputs.eq(1).val(_this.html());
			_this.parent().hide();
		})
	}
	//加载列表数据 ---状态详细页面

function loaddatalist(loadObj) {
		var loadurl = hrefobj.domain + hrefobj[loadObj.attr("loadurl")],
			formid = loadObj.attr("formid"),
			itemTemp = $("#itemtemp").html(),
			page = 1,
			token = $("#huserid").val(),
			typesh = $("#typehidden").val(),
			secstatus = typesh.substring(1),
			status = secstatus,
			type = "0",
			total = "",
			minheight = (Util.os.height - 110 + 8) + "px";
		if (secstatus.indexOf('-') > 0) {
			status = secstatus.split('-')[0];
			type = secstatus.split('-')[1];
		}
		params = {
			kind: typesh.substr(0, 1),
			status: status,
			type: type,
			token: token,
			size: 10
		};
		var getparams = parseUrlStr(params);
		loadurl += "?" + getparams + "&page=" + page;
		opobj.formparams = getparams;
		$.mypost($.setRanUrl(loadurl), true, {}, function(result) {
			total = result.data.total;
			$("#projectnumsum").html(total);
			var totalprice = (parseFloat(result.data.totalPrice) / 10000).toFixed(2)
			$("#orderpricesum").html(totalprice);
			opobj.totalPrice = result.data.totalPrice;
			loadObj.next().remove();
			if (total > 0) {
				var ulhtml = "<ul class='mui-table-view' style='min-height:" + minheight + "'>";
				ulhtml += setitemlist(result.data.list);
				ulhtml += "</ul>";
				loadObj.data("page", page + 1);
				loadObj.after(ulhtml);
				loadObj.hide();
				//---------------------------iscroll-----------------------------
				pulldownupex(total);
				//window.location.href="objc://loadmask/"+JSON.stringify({show:0});
			} else { //没有数据
				$("#pulldown").hide();
				loadObj.after("<div class='emptydatadiv' style='text-align: center;height:" + Util.os.height + "px'>没有任何数据</div>");
				loadObj.hide();
			}
			hideloadbox();
		})
		return total;
	}
	//初始化  块数据

function initentrydata(ajaxdata, nopjax) {
		$("div.kom-entry", $(".view").eq(1)).each(function() {
			var _this = $(this),
				entrystr = _this.data("entry"),
				param = _this.attr("param"),
				commitshow = $("#hcommitpre").val(),
				ordershow = $("#horderpre").val();
			if (entrystr) {
				var entryfirst = entrystr.substr(0, 1),
					entryother = entrystr.substr(1),
					endis = false;
				if (entryfirst == "c" && commitshow != "1") {
					endis = true;
				}
				if (entryfirst == "o" && ordershow != "1") {
					endis = true;
				}
				if (endis) {
					_this.addClass("entry-dis");
					_this.find("span").hide();
					return true; //continue
				}
				var data = ajaxdata[entrystr];
				if (!data && _this.data("settotal")) {
					var emptyd = {
							num: 0,
							pasum: 0
						},
						d1 = ajaxdata[entrystr + "-0"] || emptyd,
						d2 = ajaxdata[entrystr + "-1"] || emptyd;
					data = {
						num: parseInt(d1.num) + parseInt(d2.num),
						pasum: parseFloat(d1.pasum) + parseFloat(d2.pasum)
					};
				}
				if (data) {
					//if(parseInt(data.num) <=0) return;
					var otherobj = _this.find(".otherinfo"),
						amout = (parseFloat(data.pasum) / 10000).toFixed(2);
					if (otherobj.length) {
						otherobj.html(data.num + "|" + amout);
					} else {
						_this.append("<div class='otherinfo'>" + data.num + "|" + amout + "</div>");
					}
				} else {
					var otherobj = _this.find(".otherinfo");
					otherobj.length && otherobj.html("0|0.00");
				}
				if (param) {
					var paramnum = ajaxdata[param];
					if (parseInt(paramnum) > 0) {
						_this.find("span").show().html(paramnum);
					} else {
						_this.find("span").hide();
					}
				}
			}
		})
		hideloadbox();
		$("#slidemenu").html("").append($(".view").eq(1).find(".mui-content-padded").clone());

		if (!nopjax) {
			$(".scrollviewcontent").each(function() {
				if (!$(this).parent().hasClass("slidemenu"))
					new IScroll($(this));
			})
		}
	}
	//加载 viewdetail

function viewdataload(url) {
	//data-loading
	//window.location.href="objc://loadmask/"+JSON.stringify({show:1});
	$("#typehidden").val(Util.getUrlParams(decodeURIComponent(url), "type"));
	var total = 0;
	total = loaddatalist($("div.mui-loading"));
	backfn(total);
}

function backfn(total) {
		if (!$("#ajaxform").length) return;
		//data-dropdownlist
		opobj.lasttotal = total;
		$(".isearch .mui-icon-search").on("tap", function() {
			var _this = $(this),
				inputobj = _this.siblings("input");
			if (inputobj.val()) {
				searchlistdata();
				_this.next().trigger("tap");
			} else {
				inputobj.css("border-color", "red");
			}
		})
		$(".isearch .mui-icon-close").on("tap", function() {
				var _this = $(this);
				_this.hide().prev().hide().siblings("input").val("").css({
					"width": "100%",
					"text-align": "center",
					"border-color": "#ccc"
				}).next().show();
				_this.next().hide().css("right", "10px");
			})
			// -----viewdetail.html
		$("#ultalble").on("longTap", "li", function() {
			var sheight = Util.os.height,
				curstatus = $("#typehidden").val(),
				hastwo = [],
				itemparams = {
					id: $(this).attr("priceid"),
					pid: $(this).attr("priceid")
				},
				reviewstatus = ['c1', 'o1-0', 'o1-1'],
				orderid = $(this).attr("orderid"),
				showitems = $(""),
				_thisp = $(this);
			(orderid != "undefined") && (itemparams.id = orderid);
			// if(reviewstatus.indexOf(curstatus) >=0 && !$(this).hasClass("reviewitem")){
			// 	return;
			// }
			$("#popbtns span").each(function() {
				var _this = $(this);
				if (_this.attr("nosee")) {
					if (_this.attr("nosee").indexOf(curstatus) >= 0)
						_this.hide();
					else {
						if (_thisp.attr("btnmanager") == 1 || _thisp.attr("busimeb") == 1) {
							_this.show();
							showitems = showitems.add(_this);
						} else {
							_this.hide();
						}
					}
				} else {
					if (_this.attr("showstatus").indexOf(curstatus) == -1) {
						_this.hide();
					} else { //xian shi
						if (_thisp.attr("btnmanager") == 1 || _thisp.hasClass("reviewitem")) {
							var sessionright = _this.attr("sessionright");
							if (sessionright) {
								var rights = JSON.parse(sessionStorage[_this.attr("showstatus") + '-' + itemparams.id]);
								if (rights[sessionright] == 0) {
									_this.show();
									showitems = showitems.add(_this);
									hastwo.push(_this.hasClass("tworow") ? "1" : "0");
								} else {
									_this.hide();
								}
							} else {
								if (!_thisp.hasClass("reviewitem") && reviewstatus.indexOf(curstatus) >= 0)
									_this.hide();
								else {
									_this.show();
									showitems = showitems.add(_this);
									hastwo.push(_this.hasClass("tworow") ? "1" : "0");
								}
							}
						} else {
							_this.hide();
						}
					}
				}
			})
			if (hastwo.indexOf("1") >= 0)
				showitems.css("line-height", "16px");
			else
				showitems.css("line-height", "32px");
			if (showitems.length >= 0) {
				if (showitems.length == 3) {
					showitems.eq(0).addClass("btnspanbr").css("width", "32%");
					showitems.eq(1).addClass("btnspanbr").css("width", "32%");
					showitems.eq(2).css("width", "32%").removeClass("btnspanbr");
				}
				if (showitems.length == 2) {
					showitems.eq(0).addClass("btnspanbr").css("width", "49%");
					showitems.eq(1).css("width", "49%").removeClass("btnspanbr");
				}
				if (showitems.length == 1) {
					showitems.eq(0).css("width", "97%").removeClass("btnspanbr");
				}
				if (showitems.length == 0) {
					return;
				}
			}
			opobj.curli = _thisp.index();
			$("#popbtns").css("margin-top", (sheight / 2 - 25) + "px");
			$(".mask").show().one("tap", function() {
				$(this).hide();
			});
			$("#itemparams").val(JSON.stringify(itemparams));
			opobj.currentPrice = $(this).attr("oldprice");
		})
		$(".isearch>span").on("tap", function() {
				var _this = $(this);
				_this.hide();
				_this.prev().focus().css({
					"width": "70%",
					"text-align": "left"
				});
				_this.next().show().next().show().next().css({
					"right": "30%"
				});
			})
			//时间查询按钮事件
		$(".btnsrow").on("tap", "span", function() {
				var _this = $(this),
					index = _this.index(),
					otherdates = _this.parent().next().find("input"),
					type = _this.attr("type"),
					inputdates = _this.parent().find("input");
				if (_this.hasClass("active")) {
					return
				} else {
					_this.addClass("active").siblings().removeClass("active");
					if (index == 3) { // other
						otherdates.removeAttr("disabled");
						inputdates.remove();
					} else {
						var dateobj = gettimebytype(type);
						inputdates.remove();
						_this.parent().append('<input type="hidden" name="startdate" value="' + dateobj.startdate + '"><input type="hidden" name="enddate" value="' + dateobj.enddate + '">');
						otherdates.attr("disabled", "disabled");
					}
				}
			})
			//pulldownupex(total);
		$(".searchdiv input").inputinit();
	}
	//订单详情页面 加载数据

function orderdetailload(url) {
		var viewdetailgroup = $("#viewdetailgroup"),
			loadurl = hrefobj.domain + hrefobj[viewdetailgroup.attr("loadurl")];
		loadurl += "?token=" + $("#huserid").val() + "&orderid=" + Util.getUrlParams(url, "orderid");
		var comm = {
			ordertype: {
				"0": "产品",
				"1": "服务"
			},
			orderstatus: {
				'0': '待sell out',
				'1': '审核中',
				'10': '已审未签',
				'20': '审核拒绝',
				'30': '已sell out',
				'35': '发货中',
				'36': '实施中',
				'40': '已提货',
				'50': '已完成',
				'60': '已丢单'
			}
		};
		showloadbox(true);
		$.mypost(loadurl, false, {}, function(result) {
			var data = result.data;
			viewdetailgroup.find(".mui-item").each(function() {
				var _this = $(this),
					params = _this.attr("param"),
					paramarr = [],
					pvalue = "",
					curvtype = "";
				if (params.indexOf(".") >= 0) {
					paramarr = params.split(".");
					if (data[paramarr[0]]) {
						pvalue = data[paramarr[0]][paramarr[1]];
						(pvalue == null) && (pvalue = "");
					}
				} else {
					pvalue = data[params];
					(pvalue == null) && (pvalue = "");
				}
				curvtype = typeof pvalue;
				pvalue += "";
				if (pvalue) {
					if (_this.hasClass("haslink")) {
						_this.find("span").eq(0).html(pvalue);
						var paramex = _this.attr("paramex"),
							paramexarr = [];
						if (paramex.indexOf(".") >= 0) {
							paramexarr = paramex.split(".");
							_this.data("channelid", data[paramexarr[0]][paramexarr[1]]) + "";
						} else {
							_this.data("channelid", data[paramex] + "");
						}
					} else {
						var changetype = _this.attr("changetype");
						if (changetype) {
							pvalue = comm[changetype][pvalue];
						}
						if (curvtype == "number" && _this.attr("valuetype") == "date") {
							var changed = new Date(parseInt(pvalue));
							pvalue = formatDate(changed, false);
						}
						_this.find("span").html(pvalue);
					}
				} else {
					//				_this.hide();
				}
			})
			hideloadbox();
		}, "GET");
		var p_manage = Util.getUrlParams(url, "p_manage"),
			status = Util.getUrlParams(url, "status"),
			myreview = Util.getUrlParams(url, "myreview"),
			p_busimeb = Util.getUrlParams(url, "p_busimeb");
		if (p_manage == "1" || myreview == 'true' || p_busimeb == "1") {
			$("#viewdetailbtngroup button").each(function() {
				var btnobj = $(this),
					btnstatus = btnobj.attr("showstatus");
				if (!btnstatus) {
					if (btnobj.attr("nosee").indexOf(status) < 0)
						(p_manage == "1" || p_busimeb == "1") && btnobj.show();
				} else {
					if (btnstatus.indexOf(status) >= 0) {
						if (myreview == 'false' && btnobj.html() == "审核")
							btnobj.hide();
						else if (p_manage == "0" && p_busimeb == "0" && btnobj.html() != "审核")
							btnobj.hide();
						else
							btnobj.show();
					} else {
						btnobj.hide();
					}
				}
			})
		}

		// if(p_manage =="1" || myreview == 'true' || p_busimeb == "1"){
		// 	$("#viewdetailbtngroup button").each(function(){
		// 		var btnobj=$(this),btnstatus=btnobj.attr("showstatus");
		// 		if(!btnstatus){
		// 			if(btnobj.attr("nosee").indexOf(status) < 0)
		// 				(p_manage =="1" || p_busimeb == "1") && btnobj.show();
		// 		}else{
		// 			if(btnstatus.indexOf(status) >=0){
		// 				if(myreview == 'false' && btnobj.html() == "审核")
		// 					btnobj.hide();
		// 				else
		// 					btnobj.show();
		// 			}else{
		// 				btnobj.hide();
		// 			}
		// 		}
		// 	})
		// }
		new IScroll($("#viewdetailgroup").closest(".scrollviewcontent"));
		$("#viewdetailbtngroup").on("tap", "button", function() {
			btntapevent(this, url);
		})
	}
	// viewdetail 页面添加 下拉 上啦事件处理

function pulldownupex(total) {
	var loadobj = $(".mui-loading"),
		// loadurl=loadobj.attr("loadurl"),table=$('.mui-table-view'),
		pulldownAction = function() {
			searchlistdata();
			if (total > 10) {
				loadobj.removeData("lastdata");
				$("#pullup").find("span").eq(1).html("上拉加载更多...");
				$("#pullup").find("span").eq(0).show();
			}
		},
		pullupAction = null;
	if (parseInt(total) > 10) {
		pullupAction = function() {
			if (loadobj.data("lastdata")) {
				$("#pullup").find("span").eq(1).html("已是最后一条");
				$("#pullup").find("span").eq(0).hide();
			} else {
				var page = loadobj.data("page");
				searchlistdata(page, "nextpage");
			}
		}
	}
	opobj.viewscrollobj = $.scrollPull(loadobj.closest(".mui-content-padded"), pulldownAction, pullupAction);
}

function setitemlist(rows) {
		var itemtemp = $("#itemtemp").html(),
			returnstr = "",
			itemhtml = "";
		if (rows && rows.length > 0) {
			for (var i = 0; i < rows.length; i++) {
				var currow = rows[i],
					glclass = (currow.myapprove == 1) ? "reviewitem" : "",
					costatus = currow.kind + currow.status,
					statusobj = {
						statusorder: currow.statusorder,
						statusservice: currow.statusservice
					};
				if (currow.myapprove == 1) {
					glclass = "reviewitem";
				} else {
					if ((currow.p_busimeb == 1 || currow.p_manage == 1) && currow.status != 50 && currow.statusorder != 60)
						glclass = "opitem";
				}
				if (costatus == "c0")
					sessionStorage[(costatus + '-' + currow.priceid)] = JSON.stringify(statusobj);
				var $data = currow.applyer ? currow.applyer + " " + currow.applytime : "无",
					amount = currow.price ? (parseFloat(currow.price) / 10000).toFixed(2) : "0.00";
				// (parseFloat(data.pasum)/10000).toFixed(2)
				itemhtml = itemtemp.replace("$oldprice$", (currow.price || '0')).replace("$glitem$", glclass).replace("$amount$", amount).replace("$p_busimeb$", currow.p_busimeb).replace("$btnmanager$", currow.p_manage).replace("$orderid$", currow.orderid).replace("$priceid$", currow.priceid).replace("$proname$", currow.projectname).replace("$num$", currow.pricenum).replace("$date$", $data);
				returnstr += itemhtml;
				// $(".mui-pull-bottom-pocket").find("span").eq(0).html("上拉显示更多");
			}
		} else {
			// $(".mui-pull-bottom-pocket").find("span").eq(0).html("已是最后一条数据");
		}
		return returnstr;
	}
	//获取搜索参数 返回 参数对象

function getformparams() {
	var obj = "";
	$("#ajaxform input").each(function() {
		var _this = $(this);
		if (!_this.attr("disabled")) {
			//obj[$(this).attr("name")]=$(this).val();
			var thisvalue = $(this).val();
			thisvalue = thisvalue.indexOf("时间") >= 0 ? "" : thisvalue;
			obj += $(this).attr("name") + "=" + thisvalue + "&";
		}
	})
	return obj.slice(0, -1);
}

function parseUrlStr(obj) {
		var str = "";
		if (obj) {
			for (var item in obj) {
				str += item + "=" + obj[item] + "&";
			}
			str = str.slice(0, -1);
		}
		return str;
	}
	// viewdetail 搜索、刷新方法

function searchlistdata(page, type) {
		var loadobj = $(".mui-loading"),
			loadurl = hrefobj.domain + hrefobj[loadobj.attr("loadurl")],
			params = {},
			pagei = page || "1",
			minheight = (Util.os.height - 110) + "px";
		//params=$.extend($("#ajaxform").data("params"),getformparams());
		loadurl += "?" + opobj.formparams + "&page=" + pagei;
		if (opobj.searched) {
			loadurl += "&" + getformparams();
		}
		showloadbox();
		$.mypost(loadurl, true, {}, function(result) {
			var loadObj = $(".mui-loading");
			$("#projectnumsum").html(result.data.total);
			var totalprice = (parseFloat(result.data.totalPrice) / 10000).toFixed(2)
			$("#orderpricesum").html(totalprice);
			opobj.totalPrice = result.data.totalPrice;
			if (result.data.total > 0) {
				$(".emptydatadiv").remove();
				var ulhtml = "<ul class='mui-table-view' style='min-height:" + minheight + "'>";
				if (type == "nextpage") {
					ulhtml = "";
					ulhtml += setitemlist(result.data.list);
					if (!result.data.list) loadobj.data("lastdata", "true");
					loadObj.next().append(ulhtml);
				} else {
					ulhtml += setitemlist(result.data.list);
					ulhtml += "</ul>";
					loadObj.next().remove();
					loadObj.after(ulhtml);
				}
				loadObj.data("page", parseInt(pagei) + 1);
				$("#clickdownwrapup").trigger("tap");
			} else { //没有数据
				loadObj.next().remove();
				loadObj.after("<div class='emptydatadiv' style='text-align: center;height:" + Util.os.height + "px'>没有任何数据</div>");
				loadObj.hide();
			}
			opobj.viewscrollobj.refresh();
			$("#clickdownwrapup").trigger("tap");
			hideloadbox();
		})
	}
	//根据不同的类型获取时间 对象 {开始时间，结束时间}

function gettimebytype(type) {
		var reobj = {},
			nowdate = new Date(),
			nowyear = nowdate.getFullYear(),
			nowmonth = nowdate.getMonth(),
			nowday = nowdate.getDate(),
			mstart, mend, qsm;
		switch (type) {
			case 'month':
				mstart = new Date(nowyear, nowmonth, 1);
				mend = new Date(nowyear, nowmonth, getMonthDays(nowyear, nowmonth));
				break;
			case 'week':
				mstart = new Date(nowyear, nowmonth, nowday - nowdate.getDay() + 1);
				mend = new Date(nowyear, nowmonth, nowday + (6 - nowdate.getDay()) + 1);
				break;
			case 'thisyear':
				mstart = new Date(nowyear, "1", "1");
				mend = new Date(nowyear, "12", "31");
				break;
			case 'thisquarter':
				qsm = getQuarterStartMonth(nowmonth);
				mstart = new Date(nowyear, qsm, 1);
				mend = new Date(nowyear, qsm + 2, getMonthDays(nowyear, qsm + 2));
				break;
			case 'lastquarter':
				qsm = getQuarterStartMonth(nowmonth);
				var lqsm = qsm - 3;
				if (lqsm < 0) {
					lqsm = 9;
					nowyear -= 1;
				}
				mstart = new Date(nowyear, lqsm, 1);
				mend = new Date(nowyear, lqsm + 2, getMonthDays(nowyear, lqsm + 2));
				break;
		}
		if (mstart && mend) {
			reobj.startdate = formatDate(mstart);
			reobj.enddate = formatDate(mend);
		}
		return reobj;
	}
	//获取某月的天数

function getMonthDays(year, month) {
		var monthstartdate = new Date(year, month, 1),
			monthenddate = new Date(year, month + 1, 1);
		return (monthenddate - monthstartdate) / (1000 * 60 * 60 * 24);
	}
	//获取本季度的开始月份

function getQuarterStartMonth(month) {
		return parseInt(month / 3) * 3;
	}
	//格式化 时间

function formatDate(date, type) {
	var year = date.getFullYear(),
		month = date.getMonth() + 1,
		day = date.getDate(),
		rdatestr = "";
	if (month < 10)
		month = "0" + month;
	if (day < 10)
		day = "0" + day;
	rdatestr = year + "-" + month + "-" + day;
	if (type) {
		var hour = date.getHours(),
			minute = date.getMinutes(),
			second = date.getSeconds();
		rdatestr += " " + (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
	}
	return rdatestr;
}

function showloadbox(type) { //默认不显示 load
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
}

function hideloadbox() {
		$(".i-loading").hide();
	}
	//管辖地区模糊查询

function vaguesearch(obj) {
		var ulist = $(obj).parent().next(),
			lilist = ulist.find("li"),
			index = 0,
			value = $(obj).val(),
			sitems = lilist.length;
		if (value) {
			lilist.each(function(i) {
				var _this = $(this);
				if (_this.text().indexOf(value) >= 0) {
					index = i;
					_this.show();
					$("#nodataliobj").remove();
				} else {
					sitems--;
					_this.hide();
				}
			})
			if (sitems == 0) {
				ulist.append("<li id='nodataliobj'>没有任何数据</li>");
			}
		} else {
			lilist.show();
		}
	}
	//返回更新 主页面信息

function reloadmaindata() {
		var token = $("#huserid").val(),
			url = hrefobj["domain"] + hrefobj.comanageurl + "?token=" + token;
		showloadbox(true);
		$.mypost($.setRanUrl(url), false, {}, function(data) {
			initentrydata(data['data'], true);
			opobj.btnop = false;
		}, 'GET');
	}
	//---------------交互--method
	//丢单方法

function missorderfn(sendparams) { //sendparams
	$(".i-loading").show();
	var url = hrefobj.domain + hrefobj.loseorderurl + "?token=" + $("#huserid").val() + "&priceid=" + sendparams.pid;
	//popbox("title",opobj.ajaxerrorinfo);
	$.mypost(url, false, {}, function(result) {
		if (result.data) {
			$(".i-loading").hide();
			if ($("#viewdetailgroup").length)
				$.back();
			deleteliop();
			opobj.btnop2 = true;
			opobj.btnop = true;
		}
	}, "GET");
}

function deleteliop() {
	$(".mui-table-view li").eq(opobj.curli).remove();
	if ($(".mui-table-view li").length == 0) {
		$(".mui-table-view").parent().append("<div class='emptydatadiv' style='text-align: center;height:" + Util.os.height + "px'>没有任何数据</div>");
	}
}

function osmethod(methodname, paramsobj) {
	// window.location.href="objc://"+methodname+"/"+JSON.stringify(paramsobj);
}

function popbox(title, content) {
	var sendparams = {
		title: title,
		info: encodeURIComponent(content)
	};
	window.location.href = encodeURI("objc://openpopbox/" + JSON.stringify(sendparams));
	// JSON.stringify(sendparams)
}

function showbackinfo(info) {
	//alert(info);
}

function hideload() {
	$(".i-loading").hide();
}

function applycallback(status) {
	opobj.btnop2 = true;
	opobj.btnop = true;
	deleteliop();
	updatesundata();
	opobj.curbtnobj.hide();
}

function reviewcallback(status) {
	opobj.btnop2 = true;
	opobj.btnop = true;
	deleteliop();
	updatesundata();
	opobj.curbtnobj.hide();
}

function pickdatecallback(backobj) {
	opobj.curdateobj.val(formatDate(new Date(backobj.date)));
}

function updatesundata() {
	var projectnumboj = $("#projectnumsum"),
		priceobj = $("#orderpricesum");
	projectnumboj.html(parseInt(projectnumboj.html()) - 1);
	opobj.totalPrice = opobj.totalPrice - opobj.currentPrice;
	priceobj.html((parseFloat(opobj.totalPrice) / 10000).toFixed(2));
}

// extend
;
(function($, window) {
	$.fn.inputinit = function() {
		this.each(function() {
			var _this = $(this),
				parentnode = _this.parent(),
				dtype = _this.attr("dtype");
			if (_this.hasClass("mui-input-clear")) {
				var cspanel = $("<span class='mui-icon mui-icon-clear mui-hidden'></span>");
				parentnode.append(cspanel);
				_this.on("keyup", function() {
					if (_this.val()) {
						cspanel.removeClass("mui-hidden").show();
					} else {
						cspanel.addClass("mui-hidden");
					}
				});
				cspanel.on("tap", function() {
					// _this.val("");
					_this.parent().find("input").val("").filter("input[name='areaid']").val("-1");
					$(this).addClass("mui-hidden");
				})
			}
			if (dtype) { //处理日期
				var curstatus = $("#typehidden").val(),
					statusf = curstatus.substr(0, 1),
					placeh = "";
				(curstatus.indexOf("-") >= 0) && (curstatus = curstatus.split('-')[0]);
				if (statusf == "c") {
					placeh = opobj.datesobj[curstatus];
				} else {
					if (curstatus.substr(1) < 30)
						placeh = opobj.datesobj["o1"];
					else
						placeh = opobj.datesobj["o2"];
				}
				(dtype == "start") && _this.attr("value", placeh + "(起)");
				(dtype == "end") && _this.attr("value", placeh + "(止)");
				_this.on("tap", function() {
					if (!$(this).attr("disabled")) {
						var _thisb = $(this),
							ddtype = _thisb.attr("dtype"),
							sendparams = {
								max: '',
								min: ''
							};
						opobj.curdateobj = $(this), thisvalue = _thisb.val(), prevvalue = _thisb.prev().val(),
							nextvalue = _thisb.next().val();
						if (ddtype == "start") {
							sendparams.min = "";
							sendparams.max = nextvalue.indexOf("时间") >= 0 ? "" : Date.parse(nextvalue);
						} else {
							sendparams.min = prevvalue.indexOf("时间") >= 0 ? "" : Date.parse(prevvalue);
							sendparams.max = "";
						}
						window.location.href = "objc://pickdate/" + JSON.stringify(sendparams);
					}
				});
			}
		})
		return this;
	}
	$.mypost = function(url, async, data, callback, type, errorback) {
		// 同步为 false
		type = type || "POST";
		errorback = errorback || function() {
			popbox("", opobj.ajaxerrorinfo);
		};
		$.ajax({
			type: type,
			url: url,
			async: async,
			dataType: "json",
			data: data,
			success: callback,
			error: errorback
		});
	}
	$.fn.myLoad = function(url, data, callback, async) {
		var _this = $(this);
		async = async || false, cachedata = Util.getCache(url, Util.getStamp());
		if (cachedata) {
			_this.html(cachedata.data);
			if (callback)
				callback(_this);
		} else {
			$.ajax({
				url: url,
				data: data,
				async: async,
				dataType: "text",
				error: function() {
					// box.alert(kmsg.ajaxerrorMsg);
				},
				success: function(rehtml) {
					if (rehtml) {
						_this.html(rehtml);
						Util.setCache(url, rehtml);
						if (callback)
							callback(_this);
					}
				}
			});
		}
		return this;
	}
	$.scrollPull = function(wrapper, pulldownAction, pullupAction, opts, pullText) {
		var $wrapper;
		if (typeof wrapper === 'string') {
			$wrapper = $(wrapper);
		} else if (typeof wrapper === 'object') {
			$wrapper = wrapper;
		}

		var pulldownRefresh = '下拉刷新...',
			pullupLoadingMore = '上拉加载更多...',
			releaseToRefresh = '释放刷新...',
			releaseToLoading = '释放加载...',
			loading = '正在加载...';

		var $pulldown = $wrapper.find('#pulldown'),
			$pullup = $wrapper.find('#pullup'),
			pullupOffset = 0,
			pulldownOffset = 0;

		if ($pulldown.length > 0) {
			pulldownOffset = $pulldown.offset().height;
			$pulldown.find('#pulldown-label').html(pulldownRefresh);
		}

		if ($pullup.length > 0) {
			pullupOffset = $pullup.offset().height;
			$pullup.find('#pullup-label').html(pullupLoadingMore);
		}
		var options = {
			probeType: 3,
			startY: -pulldownOffset
		};
		$.extend(true, options, opts);
		var scrollObj = new IScroll($wrapper, options);
		//滚动刷新触发的事件
		scrollObj.on('refresh', function() {
			if ($pulldown.length > 0 && $pulldown.hasClass('loading')) {
				$pulldown.removeClass();
				$pulldown.find('#pulldown-label').html(pulldownRefresh);
				this.scrollTo(0, -pulldownOffset);
			} else if ($pullup.length > 0) {
				$pullup.find('#pullup-icon').show();
				if ($pullup.hasClass('loading')) {
					$pullup.find('#pullup-icon').show();
					$pullup.removeClass();
					$pullup.find('#pullup-label').html(pullupLoadingMore);
				}
			}
		});
		scrollObj.on('scrollStart', function() {
			if ($pulldown.length > 0) {
				$pulldown.css("visibility", "visible");
			}
			if ($pullup.length > 0 && pullupAction)
				$pullup.css("visibility", "visible");
		});
		//滚动的时候触发的事件
		scrollObj.on('scroll', function() {
			// if ($pulldown.length>0 && this.y < 5 && !$pulldown.hasClass('flip')) {
			// 	this.scrollTo(0, -pulldownOffset,500);
			// }
			if ($pulldown.length > 0 && this.y > 5 && !$pulldown.hasClass('flip')) {
				$pulldown.removeClass().addClass('flip');
				$pulldown.find('#pulldown-label').html(releaseToRefresh);
				// this.startY = 0;
			} else if ($pulldown.length > 0 && this.y < 5 && $pulldown.hasClass('flip') && this.initiated) {
				$pulldown.removeClass();
				$pulldown.find('#pulldown-label').html(pulldownRefresh);
				this.scrollTo(0, -pulldownOffset, 500);
				// this.startY = -pulldownOffset;
				//this.y < this.minScrollY代表是上拉,以防下拉的时候未拉到尽头时进入上拉的逻辑中
			} else if ($pullup.length > 0 && this.y < this.startY && this.y < (this.maxScrollY - 5) && !$pullup.hasClass('flip')) {
				$pullup.removeClass().addClass('flip');
				$pullup.find('#pullup-label').html(releaseToLoading);
				// this.maxScrollY = this.maxScrollY;

			} else if ($pullup.length > 0 && (this.y > (this.maxScrollY + 5)) && $pullup.hasClass('flip') && this.initiated) {
				$pullup.removeClass();
				$pullup.find('#pullup-label').html(pullupLoadingMore);
				// this.maxScrollY = pullupOffset;
			}
		});

		//滚动结束之后触发的事件
		scrollObj.on('scrollEnd', function() {
			if ($pulldown.length > 0 && $pulldown.hasClass('flip')) {
				$pulldown.removeClass().addClass('loading');
				$pulldown.find('#pulldown-label').html(loading);
				if (typeof pulldownAction === 'function') {
					pulldownAction.call(scrollObj);
				}
			} else if ($pullup.length > 0 && $pullup.hasClass('flip')) {
				$pullup.removeClass().addClass('loading');
				$pullup.find('#pullup-label').html(loading);
				if (typeof pullupAction === 'function' && $pullup.parent().length > 0) {
					pullupAction.call(scrollObj);
				}
			}
		});
		return scrollObj;
	}
})(Zepto, window)