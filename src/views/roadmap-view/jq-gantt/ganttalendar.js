import { GanttMaster } from "./ganttMaster";
import $ from "jquery"

var isHoliday = require('./libs/date').isHoliday;
var getDurationInUnits = require('./ganttUtilities').getDurationInUnits;
var computeEndDate = require('./ganttUtilities').computeEndDate;
var computeStartDate = require('./ganttUtilities').computeStartDate;
var durationToString = require('./ganttUtilities').durationToString;
var showBaselineInfo = require('./ganttUtilities').showBaselineInfo;
var millisFromString = require('./libs/date').millisFromString;

export class Ganttalendar {

    constructor(startMillis, endMillis, master, minGanttSize) {
        // define the zoom level arrays
        this.zoomLevels = [];
        this.zoomDrawers = {};

        this.ganttMaster = master; // is the a GantEditor instance
        this.element = undefined; // is the jquery element containing ganttalendar

        this.svg = undefined; // instance of svg object containing ganttalendar
        this.tasksGroup = undefined; //instance of svg group containing tasks
        this.linksGroup = undefined; //instance of svg group containing links

        this.minGanttSize = minGanttSize;
        this.includeToday = false; //when true today is always visible. If false boundaries comes from tasks periods
        this.showCriticalPath = false; //when true critical path is highlighted

        this.initZoomlevels(); // initialite the zoom level definitions

        this.originalStartMillis=startMillis;
        this.originalEndMillis=endMillis;
        this.gridChanged=true; //witness for boundaries changed. Force to redraw ganttalendar grid
        this.element = this.createGanttGrid(); // fake

        this.linkOnProgress = false; //set to true when creating a new link

        this.taskHeight=20;
        this.resizeZoneWidth=5;
        this.taskVertOffset = 40; // TODO [nitram509] compute the correct offset;; previous value=(this.ganttMaster.rowHeight - this.taskHeight) / 2;
        this.rowHeight = master.rowHeight;
        this.rowHeight = 35;
    }

    addTask(task) {
        //currently do nothing
    };

    reset () {
        // TODO [nitram509]: what is this.element? needs to be proper initialized?
        // this.element.find("[class*=linkGroup]").remove();
        // this.element.find("[taskid]").remove();
    };

    synchHighlight() {
        
        if (this.ganttMaster.currentTask ){
            // take care of collapsed rows
            var ganttHighLighterPosition=this.ganttMaster.editor.element.find(".taskEditRow:visible").index(this.ganttMaster.currentTask.rowElement);
            this.ganttMaster.ganttalendar.element.find(".ganttLinesSVG").removeClass("rowSelected").eq(ganttHighLighterPosition).addClass("rowSelected");
        } else {
            $(".rowSelected").removeClass("rowSelected");
        }
    };

    zoomGantt  (isPlus) {
        var curLevel = this.zoom;
        var pos = this.zoomLevels.indexOf(curLevel + "");

        var centerMillis=this.getCenterMillis();
        var newPos = pos;
        if (isPlus) {
            newPos = pos <= 0 ? 0 : pos - 1;
        } else {
            newPos = pos >= this.zoomLevels.length - 1 ? this.zoomLevels.length - 1 : pos + 1;
        }
        if (newPos !== pos) {
            curLevel = this.zoomLevels[newPos];
            this.gridChanged=true;
            this.zoom = curLevel;
            this.storeZoomLevel(this.zoom);
            this.redraw();
            this.goToMillis(centerMillis);
        }
    };

    getStoredZoomLevelOrDefault(){
        const zoomLevelString = localStorage.getItem("TWPGanttSavedZooms") || "{ \"zoomLevel\":0 }";
        var savedZooms = JSON.parse(zoomLevelString);
        return savedZooms.zoomLevel;
    };

    storeZoomLevel(zoomLevel){
        var savedZooms = {zoomLevel: zoomLevel};
        localStorage.setItem("TWPGanttSavedZooms", JSON.stringify(savedZooms));
    }

    createHeadCell(level,zoomDrawer,rowCtx,lbl, span, additionalClass,start, end){
        // var x = (start.getTime() - this.startMillis)* zoomDrawer.computedScaleX;
        var th = $("<th>").html(lbl).attr("colSpan", span);
        if (level>1) { //set width on second level only
            var w = (end.getTime() - start.getTime()) * zoomDrawer.computedScaleX;
            th.width(w);
        }
        if (additionalClass)
            th.addClass(additionalClass);
        rowCtx.append(th);
    }

    createBodyCell(zoomDrawer,tr,span, isEnd, additionalClass) {
        var ret = $("<td>").html("").attr("colSpan", span).addClass("ganttBodyCell");
        if (isEnd)
            ret.addClass("end");
        if (additionalClass)
            ret.addClass(additionalClass);
        tr.append(ret);
    };

    createGanttGrid  () {
        

        var self = this;

        // get the zoomDrawer
        // if the desired level is not there uses the largest one (last one)
        var zoomDrawer=self.zoomDrawers[self.zoom] || self.zoomDrawers[self.zoomLevels[self.zoomLevels.length-1]];

        //get best dimension for ganttalendar
        var adjustedStartDate= new Date(this.originalStartMillis);
        var adjustedEndDate=new Date(this.originalEndMillis);
        zoomDrawer.adjustDates(adjustedStartDate,adjustedEndDate);

        self.startMillis = adjustedStartDate.getTime(); //real dimension of ganttalendar
        self.endMillis = adjustedEndDate.getTime();

        //this is computed by hand in order to optimize cell size
        var computedTableWidth= (self.endMillis - self.startMillis) * zoomDrawer.computedScaleX;

        //set a minimal width
        computedTableWidth = Math.max(computedTableWidth, self.minGanttSize);

        var table = $("<table cellspacing=0 cellpadding=0>");

        //loop for header1
        var start = new Date(self.startMillis);
        var tr1 = $("<tr>").addClass("ganttHead1");
        while (start.getTime() <= self.endMillis) {
            zoomDrawer.row1(start,tr1);
        }

        //loop for header2  e tbody
        start = new Date(self.startMillis);
        var tr2 = $("<tr>").addClass("ganttHead2");
        var trBody = $("<tr>").addClass("ganttBody");
        while (start.getTime() <= self.endMillis) {
            zoomDrawer.row2(start,tr2,trBody);
        }

        table.append(tr1).append(tr2);   // removed as on FF there are rounding issues  //.css({width:computedTableWidth});
        table.append(trBody).addClass("ganttTable");
        var height = self.ganttMaster.editor.element.height();
        table.height(height);

        var box = $("<div>");
        box.addClass("ganttalendar unselectable").attr("unselectable", "true").css({position:"relative", width:computedTableWidth});
        box.append(table);

        //create the svg
        box.svg({settings:{class:"ganttSVGBox"},
            onLoad:         function (svg) {
                

                //creates gradient and definitions
                var defs = svg.defs('myDefs');

                //create backgound
                var extDep = svg.pattern(defs, "extDep", 0, 0, 10, 10, 0, 0, 10, 10, {patternUnits:'userSpaceOnUse'});
                var img=svg.image(extDep, 0, 0, 10, 10, self.ganttMaster.resourceUrl +"hasExternalDeps.png",{opacity:.3});

                self.svg = svg;
                $(svg).addClass("ganttSVGBox");

                //creates grid group
                var gridGroup = svg.group("gridGroup");

                //creates links group
                self.linksGroup = svg.group("linksGroup");

                //creates tasks group
                self.tasksGroup = svg.group("tasksGroup");
                self.tasksGroup.setAttribute('class', 'colorByStatus'); // needed for coloring, was previously at the element '#TWGanttArea'

                //compute scalefactor fx
                //self.fx = computedTableWidth / (endPeriod - startPeriod);
                self.fx = zoomDrawer.computedScaleX;

            }
        });

        return box;
    };

//<%-------------------------------------- GANT TASK GRAPHIC ELEMENT --------------------------------------%>
    drawTask  (task, rowIndex) {
        
        var self = this;


        if (self.ganttMaster.showBaselines) {
            var baseline = self.ganttMaster.baselines[task.id];
            if (baseline) {
                
                var baseTask = $(_createBaselineSVG(task, baseline));
                baseTask.css("opacity", .5);
                task.ganttBaselineElement = baseTask;
            }
        }

        var taskBox = $(_createTaskSVG(task, rowIndex));
        task.ganttElement = taskBox;


        if (self.showCriticalPath && task.isCritical)
            taskBox.addClass("critical");

        if (this.ganttMaster.permissions.canWrite || task.canWrite) {

            //bind all events on taskBox
            taskBox
                .click(function (e) { // manages selection
                    e.stopPropagation();// to avoid body remove focused
                    self.element.find("[class*=focused]").removeClass("focused");
                    $(".ganttSVGBox .focused").removeClass("focused");
                    var el = $(this);
                    if (!self.resDrop)
                        el.addClass("focused");
                    self.resDrop = false; //hack to avoid select

                    $("body").off("click.focused").one("click.focused", function () {
                        $(".ganttSVGBox .focused").removeClass("focused");
                    })

                }).dblclick(function () {
                if (self.ganttMaster.permissions.canSeePopEdit)
                    self.ganttMaster.editor.openFullEditor(task,false);
            }).mouseenter(function () {
                //bring to top
                var el = $(this);
                if (!self.linkOnProgress) {
                    $("[class*=linkHandleSVG]").hide();
                    el.find("[class*=linkHandleSVG]").stopTime("hideLink").show();
                } else {
                    el.addClass("linkOver");
                }
            }).mouseleave(function () {
                var el = $(this);
                el.removeClass("linkOver").find("[class*=linkHandleSVG]").oneTime(500,"hideLink",function(){$(this).hide()});

            }).mouseup(function (e) {
                $(":focus").blur(); // in order to save grid field when moving task
            }).mousedown(function () {
                var task = self.ganttMaster.getTask($(this).attr("taskid"));
                task.rowElement.click();
            }).dragExtedSVG($(self.svg.root()), {
                canResize:  this.ganttMaster.permissions.canWrite || task.canWrite,
                canDrag:    !task.depends && (this.ganttMaster.permissions.canWrite || task.canWrite),
                resizeZoneWidth:self.resizeZoneWidth,
                startDrag:  function (e) {
                    $(".ganttSVGBox .focused").removeClass("focused");
                },
                drag:       function (e) {
                    $("[from=" + task.id + "],[to=" + task.id + "]").trigger("update");
                },
                drop:       function (e) {
                    self.resDrop = true; //hack to avoid select
                    var taskbox = $(this);
                    var task = self.ganttMaster.getTask(taskbox.attr("taskid"));
                    var s = Math.round((parseFloat(taskbox.attr("x")) / self.fx) + self.startMillis);
                    self.ganttMaster.beginTransaction();
                    self.ganttMaster.moveTask(task, new Date(s));
                    self.ganttMaster.endTransaction();
                },
                startResize:function (e) {
                    $(".ganttSVGBox .focused").removeClass("focused");
                    var taskbox = $(this);
                    var text = $(self.svg.text(parseInt(taskbox.attr("x")) + parseInt(taskbox.attr("width") + 8), parseInt(taskbox.attr("y")), "", {"font-size":"10px", "fill":"red"}));
                    taskBox.data("textDur", text);
                },
                resize:     function (e) {
                    //find and update links from, to
                    var taskbox = $(this);
                    var st = Math.round((parseFloat(taskbox.attr("x")) / self.fx) + self.startMillis);
                    var en = Math.round(((parseFloat(taskbox.attr("x")) + parseFloat(taskbox.attr("width"))) / self.fx) + self.startMillis);
                    var d = getDurationInUnits(computeStartDate(st), computeEndDate(en));
                    var text = taskBox.data("textDur");
                    text.attr("x", parseInt(taskbox.attr("x")) + parseInt(taskbox.attr("width")) + 8).html(durationToString(d));

                    $("[from=" + task.id + "],[to=" + task.id + "]").trigger("update");
                },
                stopResize: function (e) {
                    self.resDrop = true; //hack to avoid select
                    var textBox = taskBox.data("textDur");
                    if (textBox)
                        textBox.remove();
                    var taskbox = $(this);
                    var task = self.ganttMaster.getTask(taskbox.attr("taskid"));
                    var st = Math.round((parseFloat(taskbox.attr("x")) / self.fx) + self.startMillis);
                    var en = Math.round(((parseFloat(taskbox.attr("x")) + parseFloat(taskbox.attr("width"))) / self.fx) + self.startMillis);

                    //in order to avoid rounding issue if the movement is less than 1px we keep the same start and end dates
                    if (Math.abs(st-task.start)<1/self.fx) {
                        st = task.start;
                    }
                    if (Math.abs(en-task.end)<1/self.fx) {
                        en = task.end;
                    }

                    self.ganttMaster.beginTransaction();
                    self.ganttMaster.changeTaskDates(task, new Date(st), new Date(en));
                    self.ganttMaster.endTransaction();
                }
            });

            //binding for creating link
            taskBox.find("[class*=linkHandleSVG]").mousedown(function (e) {
                e.preventDefault();
                e.stopPropagation();
                var taskBox = $(this).closest(".taskBoxSVG");
                var svg = $(self.svg.root());
                var offs = svg.offset();
                self.linkOnProgress = true;
                self.linkFromEnd = $(this).is(".taskLinkEndSVG");
                svg.addClass("linkOnProgress");

                // create the line
                var startX = parseFloat(taskBox.attr("x")) + (self.linkFromEnd ? parseFloat(taskBox.attr("width")) : 0);
                var startY = parseFloat(taskBox.attr("y")) + parseFloat(taskBox.attr("height")) / 2;
                var line = self.svg.line(startX, startY, e.pageX - offs.left - 5, e.pageY - offs.top - 5, {class:"linkLineSVG"});
                var circle = self.svg.circle(startX, startY, 5, {class:"linkLineSVG"});

                //bind mousemove to draw a line
                svg.bind("mousemove.linkSVG", function (e) {
                    var offs = svg.offset();
                    var nx = e.pageX - offs.left;
                    var ny = e.pageY - offs.top;
                    var c = Math.sqrt(Math.pow(nx - startX, 2) + Math.pow(ny - startY, 2));
                    nx = nx - (nx - startX) * 10 / c;
                    ny = ny - (ny - startY) * 10 / c;
                    self.svg.change(line, { x2:nx, y2:ny});
                    self.svg.change(circle, { cx:nx, cy:ny});
                });

                //bind mouseup un body to stop
                $("body").one("mouseup.linkSVG", function (e) {
                    $(line).remove();
                    $(circle).remove();
                    self.linkOnProgress = false;
                    svg.removeClass("linkOnProgress");

                    $(self.svg.root()).unbind("mousemove.linkSVG");
                    var targetBox = $(e.target).closest(".taskBoxSVG");
                    

                    if (targetBox && targetBox.attr("taskid") != taskBox.attr("taskid")) {
                        var taskTo;
                        var taskFrom;
                        if (self.linkFromEnd) {
                            taskTo = self.ganttMaster.getTask(targetBox.attr("taskid"));
                            taskFrom = self.ganttMaster.getTask(taskBox.attr("taskid"));
                        } else {
                            taskFrom = self.ganttMaster.getTask(targetBox.attr("taskid"));
                            taskTo = self.ganttMaster.getTask(taskBox.attr("taskid"));
                        }

                        if (taskTo && taskFrom) {
                            var gap = 0;
                            var depInp = taskTo.rowElement.find("[name=depends]");
                            depInp.val(depInp.val() + ((depInp.val() + "").length > 0 ? "," : "") + (taskFrom.getRow() + 1) + (gap != 0 ? ":" + gap : ""));
                            depInp.blur();
                        }
                    }
                })
            });
        }
        //ask for redraw link
        self.redrawLinks();

        //prof.stop();


        function _createTaskSVG(task) {
            var svg = self.svg;

            var dimensions = {
                x     : Math.round((task.start - self.startMillis) * self.fx),
                y     : rowIndex * self.rowHeight + self.taskVertOffset,
                width : Math.max(Math.round((task.end - task.start) * self.fx), 1),
                height: (self.ganttMaster.showBaselines ? self.taskHeight / 1.3 : self.taskHeight)
            };
            var taskSvg = svg.svg(self.tasksGroup, dimensions.x, dimensions.y, dimensions.width, dimensions.height, {class:"taskBox taskBoxSVG taskStatusSVG", status:task.status, taskid:task.id,fill:task.color||"#eee" });

            //svg.title(taskSvg, task.name);
            //external box
            var layout = svg.rect(taskSvg, 0, 0, "100%", "100%", {class:"taskLayout", rx:"2", ry:"2"});
            //external dep
            if (task.hasExternalDep)
                svg.rect(taskSvg, 0, 0, "100%", "100%", {fill:"url(#extDep)"});

            //progress
            if (task.progress > 0) {
                var progress = svg.rect(taskSvg, 0, "20%", (task.progress > 100 ? 100 : task.progress) + "%", "60%", {rx:"2", ry:"2",fill:"rgba(0,0,0,.4)"});
                if (dimensions.width > 50) {
                    var textStyle = {fill:"#888", "font-size":"10px",class:"textPerc teamworkIcons",transform:"translate(5)"};
                    if (task.progress > 100)
                        textStyle["font-weight"]="bold";
                    if (task.progress > 90)
                        textStyle.transform = "translate(-40)";
                    svg.text(taskSvg, (task.progress > 90 ? 100 : task.progress) + "%", (self.rowHeight - 5) / 2, (task.progress > 100 ? "!!! " : "") + task.progress + "%", textStyle);
                }
            }

            if (task.isParent())
                svg.rect(taskSvg, 0, 0, "100%", 3, {fill:"#000"});

            if (task.startIsMilestone) {
                svg.image(taskSvg, -9, dimensions.height/2-9, 18, 18, self.ganttMaster.resourceUrl +"milestone.png")
            }

            if (task.endIsMilestone) {
                svg.image(taskSvg, "100%",dimensions.height/2-9, 18, 18, self.ganttMaster.resourceUrl +"milestone.png", {transform:"translate(-9)"})
            }

            //task label
            svg.text(taskSvg, "100%", 18, task.name, {class:"taskLabelSVG", transform:"translate(20,-5)"});

            //link tool
            if (task.level>0){
                svg.circle(taskSvg, -self.resizeZoneWidth,  dimensions.height/2,dimensions.height/3, {class:"taskLinkStartSVG linkHandleSVG", transform:"translate("+(-dimensions.height/3+1)+")"});
                svg.circle(taskSvg, dimensions.width+self.resizeZoneWidth,dimensions.height/2,dimensions.height/3, {class:"taskLinkEndSVG linkHandleSVG", transform:"translate("+(dimensions.height/3-1)+")"});
            }
            return taskSvg
        }


        function _createBaselineSVG(task, baseline) {
            var svg = self.svg;

            var dimensions = {
                x     : Math.round((baseline.startDate - self.startMillis) * self.fx),
                y     : task.rowElement.position().top + task.rowElement.offsetParent().scrollTop() + self.taskVertOffset + self.taskHeight / 2,
                width : Math.max(Math.round((baseline.endDate - baseline.startDate) * self.fx), 1),
                height: (self.ganttMaster.showBaselines ? self.taskHeight / 1.5 : self.taskHeight)
            };
            var taskSvg = svg.svg(self.tasksGroup, dimensions.x, dimensions.y, dimensions.width, dimensions.height, {class: "taskBox taskBoxSVG taskStatusSVG baseline", status: baseline.status, taskid: task.id, fill: task.color || "#eee" });

            //tooltip
            var label = "<b>" + task.name + "</b>";
            label += "<br>";
            label += "@" + new Date(self.ganttMaster.baselineMillis).format();
            label += "<br><br>";
            label += "<b>Status:</b> " + baseline.status;
            label += "<br><br>";
            label += "<b>Start:</b> " + new Date(baseline.startDate).format();
            label += "<br>";
            label += "<b>End:</b> " + new Date(baseline.endDate).format();
            label += "<br>";
            label += "<b>Duration:</b> " + baseline.duration;
            label += "<br>";
            label += "<b>Progress:</b> " + baseline.progress + "%";

            $(taskSvg).attr("data-label", label).on("click", function (event) {
                showBaselineInfo(event, this);
                //bind hide
            });

            //external box
            var layout = svg.rect(taskSvg, 0, 0, "100%", "100%", {class: "taskLayout", rx: "2", ry: "2"});


            //progress

            if (baseline.progress > 0) {
                var progress = svg.rect(taskSvg, 0, "20%", (baseline.progress > 100 ? 100 : baseline.progress) + "%", "60%", {rx: "2", ry: "2", fill: "rgba(0,0,0,.4)"});
                /*if (dimensions.width > 50) {
                 var textStyle = {fill:"#888", "font-size":"10px",class:"textPerc teamworkIcons",transform:"translate(5)"};
                 if (baseline.progress > 100)
                 textStyle["font-weight"]="bold";
                 if (baseline.progress > 90)
                 textStyle.transform = "translate(-40)";
                 svg.text(taskSvg, (baseline.progress > 90 ? 100 : baseline.progress) + "%", (self.rowHeight - 5) / 2, (baseline.progress > 100 ? "!!! " : "") + baseline.progress + "%", textStyle);
                 }*/
            }

            //if (task.isParent())
            //  svg.rect(taskSvg, 0, 0, "100%", 3, {fill:"#000"});


            //task label
            //svg.text(taskSvg, "100%", 18, task.name, {class:"taskLabelSVG", transform:"translate(20,-5)"});


            return taskSvg
        }

    };

//<%-------------------------------------- GANT DRAW LINK SVG ELEMENT --------------------------------------%>
//'from' and 'to' are tasks already drawn
    drawLink  (from, to, type) {
        
        var self = this;
        var peduncolusSize = 10;

        /**
         * Given an item, extract its rendered position
         * width and height into a structure.
         */
        function buildRectFromTask(task) {
            var self=task.master.gantt;
            var editorRow = task.rowElement;
            var top = editorRow.position().top + editorRow.offsetParent().scrollTop();
            var x = Math.round((task.start - self.startMillis) * self.fx);
            var rect = {left: x, top: top + self.taskVertOffset, width: Math.max(Math.round((task.end - task.start) * self.fx),1), height: self.taskHeight};
            return rect;
        }

        /**
         * The default rendering method, which paints a start to end dependency.
         */
        function drawStartToEnd(from, to, ps) {
            var svg = self.svg;

            //this function update an existing link
            function update() {
                var group = $(this);
                var from = group.data("from");
                var to = group.data("to");

                var rectFrom = buildRectFromTask(from);
                var rectTo = buildRectFromTask(to);

                var fx1 = rectFrom.left;
                var fx2 = rectFrom.left + rectFrom.width;
                var fy = rectFrom.height / 2 + rectFrom.top;

                var tx1 = rectTo.left;
                var tx2 = rectTo.left + rectTo.width;
                var ty = rectTo.height / 2 + rectTo.top;


                var tooClose = tx1 < fx2 + 2 * ps;
                var r = 5; //radius
                var arrowOffset = 5;
                var up = fy > ty;
                var fup = up ? -1 : 1;

                var prev = fx2 + 2 * ps > tx1;
                var fprev = prev ? -1 : 1;

                var image = group.find("image");
                var p = svg.createPath();

                if (tooClose) {
                    var firstLine = fup * (rectFrom.height / 2 - 2 * r + 2);
                    p.move(fx2, fy)
                        .line(ps, 0, true)
                        .arc(r, r, 90, false, !up, r, fup * r, true)
                        .line(0, firstLine, true)
                        .arc(r, r, 90, false, !up, -r, fup * r, true)
                        .line(fprev * 2 * ps + (tx1 - fx2), 0, true)
                        .arc(r, r, 90, false, up, -r, fup * r, true)
                        .line(0, (Math.abs(ty - fy) - 4 * r - Math.abs(firstLine)) * fup - arrowOffset, true)
                        .arc(r, r, 90, false, up, r, fup * r, true)
                        .line(ps, 0, true);
                    image.attr({x:tx1 - 5, y:ty - 5 - arrowOffset});

                } else {
                    p.move(fx2, fy)
                        .line((tx1 - fx2) / 2 - r, 0, true)
                        .arc(r, r, 90, false, !up, r, fup * r, true)
                        .line(0, ty - fy - fup * 2 * r + arrowOffset, true)
                        .arc(r, r, 90, false, up, r, fup * r, true)
                        .line((tx1 - fx2) / 2 - r, 0, true);
                    image.attr({x:tx1 - 5, y:ty - 5 + arrowOffset});
                }

                group.find("path").attr({d:p.path()});
            }


            // create the group
            var group = svg.group(self.linksGroup, "" + from.id + "-" + to.id);
            svg.title(group, from.name + " -> " + to.name);

            var p = svg.createPath();

            //add the arrow
            svg.image(group, 0, 0, 5, 10, self.ganttMaster.resourceUrl +"linkArrow.png");
            //create empty path
            svg.path(group, p, {class:"taskLinkPathSVG"});

            //set "from" and "to" to the group, bind "update" and trigger it
            var jqGroup = $(group).data({from:from, to:to }).attr({from:from.id, to:to.id}).on("update", update).trigger("update");

            if (self.showCriticalPath && from.isCritical && to.isCritical)
                jqGroup.addClass("critical");

            jqGroup.addClass("linkGroup");
            return jqGroup;
        }


        /**
         * A rendering method which paints a start to start dependency.
         */
        function drawStartToStart(from, to) {
            console.error("StartToStart not supported on SVG");
            var rectFrom = buildRectFromTask(from);
            var rectTo = buildRectFromTask(to);
        }

        var link;
        // Dispatch to the correct renderer
        if (type == 'start-to-start') {
            link = drawStartToStart(from, to, peduncolusSize);
        } else {
            link = drawStartToEnd(from, to, peduncolusSize);
        }

        // in order to create a dependency you will need permissions on both tasks
        if (this.ganttMaster.permissions.canWrite || ( from.canWrite && to.canWrite)) {
            link.click(function (e) {
                var el = $(this);
                e.stopPropagation();// to avoid body remove focused
                self.element.find("[class*=focused]").removeClass("focused");
                $(".ganttSVGBox .focused").removeClass("focused");
                var el = $(this);
                if (!self.resDrop)
                    el.addClass("focused");
                self.resDrop = false; //hack to avoid select

                $("body").off("click.focused").one("click.focused", function () {
                    $(".ganttSVGBox .focused").removeClass("focused");
                })

            });
        }


    };

    redrawLinks  () {
        
        var self = this;
        this.element.stopTime("ganttlnksredr");
        this.element.oneTime(10, "ganttlnksredr", function () {



            //remove all links
            $("#linksGroup").empty();

            var collapsedDescendant = [];

            //[expand]
            var collapsedDescendant = self.ganttMaster.getCollapsedDescendant();
            for (var i = 0; i < self.ganttMaster.links.length; i++) {
                var link = self.ganttMaster.links[i];

                if (collapsedDescendant.indexOf(link.from) >= 0 || collapsedDescendant.indexOf(link.to) >= 0) continue;

                var rowA=link.from.getRow();
                var rowB=link.to.getRow();

                //if link is out of visible screen continue
                if(Math.max(rowA,rowB)<self.ganttMaster.firstVisibleTaskIndex || Math.min(rowA,rowB)>self.ganttMaster.lastVisibleTaskIndex) continue;

                self.drawLink(link.from, link.to);
            }
            //prof.stop();
        });
    };

    redrawTasks  (drawAll) {
        var self=this;

        const editorHeight = 500; // TODO [nitram509]: figure out correct height; previous value=self.ganttMaster.editor.element.height();
        self.element.find("table.ganttTable").height(editorHeight);

        var collapsedDescendant = this.ganttMaster.getCollapsedDescendant();

        var startRowAdd=self.ganttMaster.firstScreenLine-self.ganttMaster.rowBufferSize;
        var endRowAdd =self.ganttMaster.firstScreenLine+self.ganttMaster.numOfVisibleRows+self.ganttMaster.rowBufferSize;

        $("#linksGroup,#tasksGroup").empty();
        var gridGroup=$("#gridGroup").empty().get(0);

        //add missing ones
        var row=0;
        self.ganttMaster.firstVisibleTaskIndex=-1;
        for (var i=0; i<self.ganttMaster.tasks.length; i++){
            var task=self.ganttMaster.tasks[i];
            if (collapsedDescendant.indexOf(task)>=0){
                continue;
            }
            if (drawAll || (row>=startRowAdd && row<endRowAdd)) {
                this.drawTask(task, row);
                self.ganttMaster.firstVisibleTaskIndex=self.ganttMaster.firstVisibleTaskIndex==-1?i:self.ganttMaster.firstVisibleTaskIndex;
                self.ganttMaster.lastVisibleTaskIndex = i;
            }
            row++
        }

        //creates rows grid
        const heightCorrectionValue = 0;
        for (var i = 40; i <= editorHeight; i += (self.rowHeight + heightCorrectionValue)){
            self.svg.rect(gridGroup, 0, i, "100%", self.rowHeight + heightCorrectionValue, {class: "ganttLinesSVG"});
        }

        // drawTodayLine
        if (new Date().getTime() > self.startMillis && new Date().getTime() < self.endMillis) {
            var x = Math.round(((new Date().getTime()) - self.startMillis) * self.fx);
            self.svg.line(gridGroup, x, 0, x, "100%", {class: "ganttTodaySVG"});
        }
    };


    shrinkBoundaries  () {
        var start = Infinity;
        var end =  -Infinity;
        for (var i = 0; i < this.ganttMaster.tasks.length; i++) {
            var task = this.ganttMaster.tasks[i];
            if (start > task.start)
                start = task.start;
            if (end < task.end)
                end = task.end;
        }

        //if include today synch extremes
        if (this.includeToday) {
            var today = new Date().getTime();
            start = start > today ? today : start;
            end = end< today ? today : end;
        }

        //mark boundaries as changed
        this.gridChanged=this.gridChanged || this.originalStartMillis!=start || this.originalEndMillis!=end;

        this.originalStartMillis=start;
        this.originalEndMillis=end;
    };

    setBestFittingZoom(){
        //if zoom is not defined get the best fitting one
        var dur = this.originalEndMillis -this.originalStartMillis;
        var minDist = Number.MAX_VALUE;
        var i = 0;
        for (; i < this.zoomLevels.length; i++) {
            var dist = Math.abs(dur - millisFromString(this.zoomLevels[i]));
            if (dist <= minDist) {
                minDist = dist;
            } else {
                break;
            }
            this.zoom = this.zoomLevels[i];
        }
        this.zoom=this.zoom||this.zoomLevels[this.zoomLevels.length-1];
    };

    redraw  () {
        


        if (this.showCriticalPath) {
            this.ganttMaster.computeCriticalPath();
        }

        if (this.gridChanged) {
            this.gridChanged=false;
            var par = this.element.parent();

            //try to maintain last scroll
            var scrollY = par.scrollTop();
            var scrollX = par.scrollLeft();

            this.element.remove();

            var domEl = this.createGanttGrid();
            this.element = domEl;
            par.append(domEl);
            this.redrawTasks();

            //set old scroll
            par.scrollTop(scrollY);
            par.scrollLeft(scrollX);

        } else {
            this.redrawTasks();
        }


        //set current task
        this.synchHighlight();

        //prof.stop();
        //Profiler.displayAll();
        //Profiler.reset()

    };


    fitGantt  () {
        delete this.zoom;
        this.redraw();
    };

    getCenterMillis () {
        return parseInt((this.element.parent().scrollLeft()+this.element.parent().width()/2)/this.fx+this.startMillis);
    };

    goToMillis (millis) {
        var x = Math.round(((millis) - this.startMillis) * this.fx) -this.element.parent().width()/2;
        this.element.parent().scrollLeft(x);
    };

    centerOnToday  () {
        this.goToMillis(new Date().getTime());
    };

    initZoomlevels() {
        //-----------------------------  3 DAYS  600px-----------------------------
        this._addZoom("3d", {
            adjustDates: function (start, end) {
                start.setFirstDayOfThisWeek();
                end.setFirstDayOfThisWeek();
                end.setDate(end.getDate() + 6);
            },
            row1: function (date, ctxHead) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 6);
                this.createHeadCell(1, this, ctxHead, start.format("MMMM d") + " - " + date.format("MMMM d yyyy") + " (" + start.format("w") + ")", 7, "", start, date);
                date.setDate(date.getDate() + 1);
            },
            row2: function (date, ctxHead, ctxBody) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 1);
                var holyClass = isHoliday(start) ? "holy" : "";
                this.createHeadCell(2, this, ctxHead, start.format("EEE d"), 1, "headSmall " + holyClass, start, date);
                this.createBodyCell(this, ctxBody, 1, start.getDay() % 7 === (this.ganttMaster.firstDayOfWeek + 6) % 7, holyClass);
            }
        });


        //-----------------------------  1 WEEK  600px -----------------------------
        this._addZoom("1w", {
            adjustDates: function (start, end) {
                //reset day of week
                start.setFirstDayOfThisWeek();
                start.setDate(start.getDate() - 7);
                end.setFirstDayOfThisWeek();
                end.setDate(end.getDate() + 13);
            },
            row1: function (date, ctxHead) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 6);
                this.createHeadCell(1, this, ctxHead, start.format("MMM d") + " - " + date.format("MMM d 'yy") + " (" + GanttMaster.messages["GANTT_WEEK_SHORT"] + date.format("w") + ")", 7, "", start, date);
                date.setDate(date.getDate() + 1);
            },
            row2: function (date, ctxHead, ctxBody) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 1);
                var holyClass = isHoliday(start) ? "holy" : "";
                this.createHeadCell(2, this, ctxHead, start.format("EEEE").substr(0, 1) + " (" + start.format("dd") + ")", 1, "headSmall " + holyClass, start, date);
                this.createBodyCell(this, ctxBody, 1, start.getDay() % 7 === (this.ganttMaster.firstDayOfWeek + 6) % 7, holyClass);
            }
        });


        //-----------------------------  2 WEEKS  600px -----------------------------
        this._addZoom("2w", {
            adjustDates: function (start, end) {
                start.setFirstDayOfThisWeek();
                start.setDate(start.getDate() - 7);
                end.setFirstDayOfThisWeek();
                end.setDate(end.getDate() + 20);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 6);
                this.createHeadCell(1, this, tr1, start.format("MMM d") + " - " + date.format("MMM d 'yy") + " (" + GanttMaster.messages["GANTT_WEEK_SHORT"] + date.format("w") + ")", 7, "", start, date);
                date.setDate(date.getDate() + 1);
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 1);
                var holyClass = isHoliday(start) ? "holy" : "";
                this.createHeadCell(2, this, tr2, start.format("EEEE").substr(0, 1), 1, "headSmall " + holyClass, start, date);
                this.createBodyCell(this, trBody, 1, start.getDay() % 7 === (this.ganttMaster.firstDayOfWeek + 6) % 7, holyClass);
            }
        });


        //-----------------------------  1 MONTH  600px  -----------------------------
        this._addZoom("1M", {
            adjustDates: function (start, end) {
                start.setMonth(start.getMonth() - 1);
                start.setDate(15);
                end.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(end.getDate() + 14);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                date.setDate(1);
                date.setMonth(date.getMonth() + 1);
                date.setDate(date.getDate() - 1);
                var inc = date.getDate() - start.getDate() + 1;
                date.setDate(date.getDate() + 1);
                this.createHeadCell(1, this, tr1, start.format("MMMM yyyy"), inc, "", start, date); //spans mumber of dayn in the month
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setDate(date.getDate() + 1);
                var holyClass = isHoliday(start) ? "holy" : "";
                this.createHeadCell(2, this, tr2, start.format("d"), 1, "headSmall " + holyClass, start, date);
                var nd = new Date(start.getTime());
                nd.setDate(start.getDate() + 1);
                this.createBodyCell(this, trBody, 1, nd.getDate() === 1, holyClass);
            }
        });


        //-----------------------------  1 QUARTERS   -----------------------------
        this._addZoom("1Q", {
            adjustDates: function (start, end) {
                start.setDate(1);
                start.setMonth(Math.floor(start.getMonth() / 3) * 3 - 1);
                end.setDate(1);
                end.setMonth(Math.floor(end.getMonth() / 3) * 3 + 4);
                end.setDate(end.getDate() - 1);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                date.setMonth(Math.floor(date.getMonth() / 3) * 3 + 3);
                var inc = (date.getMonth() - start.getMonth());
                var q = (Math.floor(start.getMonth() / 3) + 1);
                this.createHeadCell(1, this, tr1, GanttMaster.messages["GANTT_QUARTER"] + " " + q + " " + start.format("yyyy"), inc, "", start, date);
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 1);
                this.createHeadCell(2, this, tr2, start.format("MMMM"), 1, "headSmall", start, date);
                this.createBodyCell(this, trBody, 1, start.getMonth() % 3 === 2);
            }
        });


        //-----------------------------  2 QUARTERS   -----------------------------
        this._addZoom("2Q", {
            adjustDates: function (start, end) {
                start.setDate(1);
                start.setMonth(Math.floor(start.getMonth() / 3) * 3 - 3);
                end.setDate(1);
                end.setMonth(Math.floor(end.getMonth() / 3) * 3 + 6);
                end.setDate(end.getDate() - 1);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 3);
                var q = (Math.floor(start.getMonth() / 3) + 1);
                this.createHeadCell(1, this, tr1, GanttMaster.messages["GANTT_QUARTER"] + " " + q + " " + start.format("yyyy"), 3, "", start, date);
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 1);
                var lbl = start.format("MMMM");
                this.createHeadCell(2, this, tr2, lbl, 1, "headSmall", start, date);
                this.createBodyCell(this, trBody, 1, start.getMonth() % 3 === 2);
            }
        });


        //-----------------------------  1 YEAR  -----------------------------
        this._addZoom("1y", {
            adjustDates: function (start, end) {
                start.setDate(1);
                start.setMonth(Math.floor(start.getMonth() / 6) * 6 - 6);
                end.setDate(1);
                end.setMonth(Math.floor(end.getMonth() / 6) * 6 + 12);
                end.setDate(end.getDate() - 1);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 6);
                var sem = (Math.floor(start.getMonth() / 6) + 1);
                this.createHeadCell(1, this, tr1, GanttMaster.messages["GANTT_SEMESTER"] + " " + sem + "-" + start.format("yyyy"), 6, "", start, date);
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 1);
                this.createHeadCell(2, this, tr2, start.format("MMM"), 1, "headSmall", start, date);
                this.createBodyCell(this, trBody, 1, (start.getMonth() + 1) % 6 === 0);
            }
        });


        //-----------------------------  2 YEAR -----------------------------
        this._addZoom("2y", {
            adjustDates: function (start, end) {
                start.setDate(1);
                start.setMonth(-6);
                end.setDate(30);
                end.setMonth(17);
            },
            row1: function (date, tr1) {
                var start = new Date(date.getTime());
                var inc = 12 - start.getMonth();
                date.setMonth(date.getMonth() + inc);
                this.createHeadCell(1, this, tr1, start.format("yyyy"), inc / 6, "", start, date);
            },
            row2: function (date, tr2, trBody) {
                var start = new Date(date.getTime());
                date.setMonth(date.getMonth() + 6);
                var sem = (Math.floor(start.getMonth() / 6) + 1);
                this.createHeadCell(2, this, tr2, GanttMaster.messages["GANTT_SEMESTER"] + " " + sem, 1, "headSmall", start, date);
                this.createBodyCell(this, trBody, 1, sem === 2);
            }
        });
    }

    _addZoom(zoom, zoomDrawer) {
        zoomDrawer.createHeadCell = this.createHeadCell; // assign functions seems odd, but should be ok to make it work first ;)
        zoomDrawer.createBodyCell = this.createBodyCell; // assign functions seems odd, but should be ok to make it work first ;)
        zoomDrawer.ganttMaster = this.ganttMaster; // assign functions seems odd, but should be ok to make it work first ;)
        this.zoomLevels.push(zoom);
        this.zoomDrawers[zoom] = zoomDrawer;

        //compute the scale
        this.zoomDrawers[zoom].computedScaleX = 600 / millisFromString(zoom);
    }


}