/*
 Copyright (c) 2012-2017 Open Lab
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import $ from "jquery"
var alertOnUnload = require('./forms').alertOnUnload;

var confirm = undefined; // bad hack to make the compiler happy

var __popups = [];
export function createModalPopup(width, height, onCloseCallBack, cssClass, element, popupOpener) {
  
  // if (typeof(disableUploadize)=="function")
  //   disableUploadize();

  // se non diversamenete specificato l'openere è la window corrente;
  popupOpener = popupOpener || window;

	if (!width)
    width = "80%";

  if (!height)
    height = "80%";

  var localWidth=width,localHeight=height;

  if (typeof (width)=="string" && width.indexOf("%")>0 ) {
    localWidth = function () {return ($(window).width() * parseFloat(width)) / 100};
  }

	if (typeof (height)=="string" && height.indexOf("%")>0)
    localHeight = function(){return ($(window).height() *  parseFloat(height)) / 100};

	var popupWidth = localWidth, popupHeight = localHeight;

	if(typeof localWidth == "function")
		popupWidth = localWidth();

	if(typeof localHeight == "function")
		popupHeight = localHeight();

	popupWidth = parseFloat(popupWidth);
	popupHeight = parseFloat(popupHeight);

	if (typeof onCloseCallBack == "string")
		cssClass = onCloseCallBack;

	//$("#__popup__").remove();

	var popupN = __popups.length+1;
	__popups.push("__popup__" + popupN);

	var isInIframe = isIframe();

	var bg = $("<div>").prop("id", "__popup__" + popupN);
	bg.addClass("modalPopup" + (isInIframe ? " inIframe" : "")).hide();

	if (cssClass)
		bg.addClass(cssClass);

	function getMarginTop(){
		var mt = ($(window).height() - popupHeight)/2 - 100;
		return mt < 0 ? 10 : mt;
	}

	var internalDiv=$("<div>").addClass("bwinPopupd").css({ width:popupWidth, minHeight:popupHeight, marginTop: getMarginTop(), maxHeight:$(window).height()-20, overflow: "auto" });

	$(window).off("resize.popup"+popupN).on("resize.popup"+popupN, function(){

		if(typeof localWidth == "function")
			popupWidth = localWidth();

		if(typeof localHeight == "function")
			popupHeight = localHeight();

		internalDiv.css({ width:popupWidth, minHeight:popupHeight });

		var w = internalDiv.outerWidth() > $(window).width()-20 ? $(window).width()-20 : popupWidth;
		var h = internalDiv.outerHeight() > $(window).height()-20 ? $(window).height()-20 : popupHeight;

    internalDiv.css({ marginTop: getMarginTop(), minHeight: h, maxHeight:$(window).height()-20,minWidth: w });

	});

	bg.append(internalDiv);

	var showBG = function(el, time, callback){

		if (isInIframe) {
			internalDiv.css({marginTop: -50 });
			el.show();
			internalDiv.animate({marginTop: 0}, (time/2), callback);
		} else {
			internalDiv.css({opacity: 0, top: -50}).show();
			el.fadeIn(time, function () {
				internalDiv.animate({top: 0, opacity: 1}, time/3, callback);
			});
		}

		return this;
	};

	if(!element)
		$("#twMainContainer").addClass("blur");

	showBG(bg, 300, function(){})
	bg.on("click",function(event){
		if ($(event.target).closest(".bwinPopupd").length <= 0)
			bg.trigger("close");
	});

	var close = $("<span class=\"teamworkIcon close popUpClose\" style='cursor:pointer;position:absolute;'>x</span>");
	internalDiv.append(close);

	close.click(function () {
		bg.trigger("close");
	});

	$("body").css({overflowY:"hidden"});

	if(!element){
		$("body").append(bg);
	}else{
		element.after(bg);
	}

	//close call callback
	bg.on("close", function () {
		var callBackdata = $(this).data("callBackdata");
    var ndo=bg;

		var alertMsg;
    var ifr=bg.find("iframe");

    if (ifr.length>0){
      try {
        alertMsg = ifr.get(0).contentWindow.alertOnUnload();
      }catch (e){}
    } else {
      alertMsg=alertOnUnload(ndo);
    }

    if (alertMsg){
      if (!confirm(alertMsg))
        return;
    }

    bg.fadeOut(100, function () {

      $(window).off("resize.popup"+popupN);
      bg.remove();
      __popups.pop();

      if (__popups.length == 0)
        $("#twMainContainer").removeClass("blur");

      if (typeof(onCloseCallBack) == "function")
        onCloseCallBack(callBackdata);

      $("body").css({overflowY: "auto"});
    });

	});

	//destroy do not call callback
	bg.on("destroy", function () {
		bg.remove();
		$("body").css({overflowY: "auto"});
	});

  //rise resize event in order to show buttons
  $("body").oneTime(1000,"br",function(){$(this).resize();}); // con meno di 1000 non funziona


  //si deposita l'popupOpener sul bg. Per riprenderlo si usa getBlackPopupOpener()
  bg.data("__opener",popupOpener);

  return internalDiv;
}

function getBlackPopup() {
	var ret=$([]);
	if (__popups.length>0) {
		var id = __popups[__popups.length - 1];
		ret = $("#" + id);
	}
	if (ret.length==0 && window!=window.top) {
		ret = window.parent.getBlackPopup();
	}
	return ret;
}


export function closeBlackPopup(callBackdata) {
	
	var bp = getBlackPopup();

	if (callBackdata)
		bp.data("callBackdata",callBackdata);
	bp.trigger("close");
}

//returns a jquery object where to write content

function isIframe() {
	var isIframe = false;
	try{
		//try to access the document object
		if (this.location.href != window.top.location.href)
			isIframe = true;
	}catch(e) {
		//We don't have access, it's cross-origin!
		isIframe = true;
	}
	return isIframe;
};

