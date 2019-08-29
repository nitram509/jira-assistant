/*
 Copyright (c) 2012-2018 Open Lab
 Written by Roberto Bicchierai and Silvia Chelazzi http://roberto.open-lab.com
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


 todo For compatibility with IE and SVGElements.getElementsByClassName not implemented changed every find starting from SVGElement (the other works fine)
 .find(".classname"))  -> .find("[class*=classname])
 */

import $ from "jquery"
import { unselectable, clearUnselectable } from './utils'

/**
 * Allows drag and drop and extesion of task boxes. Only works on x axis
 * @param opt
 * @return {*}
 */
$.fn.dragExtedSVG = function (svg, opt) {

    //doing this can work with one svg at once only
    var target;
    var svgX;
    var offsetMouseRect;

    var options = {
        canDrag: true,
        canResize: true,
        resizeZoneWidth: 5,
        minSize: 10,
        startDrag: function (e) {
        },
        drag: function (e) {
        },
        drop: function (e) {
        },
        startResize: function (e) {
        },
        resize: function (e) {
        },
        stopResize: function (e) {
        }
    };

    $.extend(options, opt);

    this.each(function () {
        var el = $(this);
        svgX = svg.parent().offset().left; //parent is used instead of svg for a Firefox oddity
        if (options.canDrag)
            el.addClass("deSVGdrag");

        if (options.canResize || options.canDrag) {
            el.bind("mousedown.deSVG", function (e) {

                    if ($(e.target).is("image")) {
                        e.preventDefault();
                    }

                    target = $(this);
                    var x1 = parseFloat(el.find("[class*=taskLayout]").offset().left);
                    var x2 = x1 + parseFloat(el.attr("width"));
                    var posx = e.pageX;

                    unselectable($("body"));

                    //start resize end
                    if (options.canResize && Math.abs(posx - x2) <= options.resizeZoneWidth) {
                        //store offset mouse x2
                        offsetMouseRect = x2 - e.pageX;
                        target.attr("oldw", target.attr("width"));
                        var one = true;

                        //bind event for start resizing
                        $(svg).bind("mousemove.deSVG", function (e) {
                            //hide link circle
                            $("[class*=linkHandleSVG]").hide();

                            if (one) {
                                //trigger startResize
                                options.startResize.call(target.get(0), e);
                                one = false;
                            }

                            //manage resizing
                            var nW = e.pageX - x1 + offsetMouseRect;

                            target.attr("width", nW < options.minSize ? options.minSize : nW);
                            //callback
                            options.resize.call(target.get(0), e);
                        });

                        //bind mouse up on body to stop resizing
                        $("body").one("mouseup.deSVG", stopResize);


                        //start resize start
                    } else if (options.canResize && Math.abs(posx - x1) <= options.resizeZoneWidth) {
                        //store offset mouse x1
                        offsetMouseRect = parseFloat(target.attr("x"));
                        target.attr("oldw", target.attr("width")); //todo controllare se è ancora usato oldw

                        var one = true;

                        //bind event for start resizing
                        $(svg).bind("mousemove.deSVG", function (e) {
                            //hide link circle
                            $("[class*=linkHandleSVG]").hide();

                            if (one) {
                                //trigger startResize
                                options.startResize.call(target.get(0), e);
                                one = false;
                            }

                            //manage resizing
                            var nx1 = offsetMouseRect - (posx - e.pageX);
                            var nW = (x2 - x1) + (posx - e.pageX);
                            nW = nW < options.minSize ? options.minSize : nW;
                            target.attr("x", nx1);
                            target.attr("width", nW);
                            //callback
                            options.resize.call(target.get(0), e);
                        });

                        //bind mouse up on body to stop resizing
                        $("body").one("mouseup.deSVG", stopResize);


                        // start drag
                    } else if (options.canDrag) {
                        //store offset mouse x1
                        offsetMouseRect = parseFloat(target.attr("x")) - e.pageX;
                        target.attr("oldx", target.attr("x"));

                        var one = true;
                        //bind event for start dragging
                        $(svg).bind("mousemove.deSVG", function (e) {
                            //hide link circle
                            $("[class*=linkHandleSVG]").hide();
                            if (one) {
                                //trigger startDrag
                                options.startDrag.call(target.get(0), e);
                                one = false;
                            }

                            //manage resizing
                            target.attr("x", offsetMouseRect + e.pageX);
                            //callback
                            options.drag.call(target.get(0), e);

                        }).bind("mouseleave.deSVG", drop);

                        //bind mouse up on body to stop resizing
                        $("body").one("mouseup.deSVG", drop);

                    }
                }
            ).bind("mousemove.deSVG",
                function (e) {
                    var el = $(this);
                    var x1 = el.find("[class*=taskLayout]").offset().left;
                    var x2 = x1 + parseFloat(el.attr("width"));
                    var posx = e.pageX;

                    //set cursor handle
                    //if (options.canResize && (x2-x1)>3*options.resizeZoneWidth &&((posx<=x2 &&  posx >= x2- options.resizeZoneWidth) || (posx>=x1 && posx<=x1+options.resizeZoneWidth))) {
                    if (options.canResize && (Math.abs(posx - x1) <= options.resizeZoneWidth || Math.abs(posx - x2) <= options.resizeZoneWidth)) {
                        el.addClass("deSVGhand");
                    } else {
                        el.removeClass("deSVGhand");
                    }
                }
            ).addClass("deSVG");
        }
    });
    return this;


    function stopResize(e) {
        $(svg).unbind("mousemove.deSVG").unbind("mouseup.deSVG").unbind("mouseleave.deSVG");
        if (target && target.attr("oldw") != target.attr("width"))
            options.stopResize.call(target.get(0), e); //callback
        target = undefined;
        clearUnselectable($("body"));
    }

    function drop(e) {
        $(svg).unbind("mousemove.deSVG").unbind("mouseup.deSVG").unbind("mouseleave.deSVG");
        if (target && target.attr("oldx") != target.attr("x"))
            options.drop.call(target.get(0), e); //callback
        target = undefined;
        clearUnselectable($("body"));
    }

};
