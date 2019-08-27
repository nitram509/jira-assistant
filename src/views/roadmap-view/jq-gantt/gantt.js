
import {GanttMaster } from "./ganttMaster";
import $ from "jquery"

// var GanttMaster = require('./ganttMaster').GanttMaster;

export function showBaselineInfo(event, element) {
    //alert(element.attr("data-label"));
    $(element).showBalloon(event, $(element).attr("data-label"));
    ge.splitter.secondBox.one("scroll", function () {
        $(element).hideBalloon();
    })
}

function loadI18n(){
    GanttMaster.messages = {
        "CANNOT_WRITE":"No permission to change the following task:",
        "CHANGE_OUT_OF_SCOPE":"Project update not possible as you lack rights for updating a parent project.",
        "START_IS_MILESTONE":"Start date is a milestone.",
        "END_IS_MILESTONE":"End date is a milestone.",
        "TASK_HAS_CONSTRAINTS":"Task has constraints.",
        "GANTT_ERROR_DEPENDS_ON_OPEN_TASK":"Error: there is a dependency on an open task.",
        "GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK":"Error: due to a descendant of a closed task.",
        "TASK_HAS_EXTERNAL_DEPS":"This task has external dependencies.",
        "GANNT_ERROR_LOADING_DATA_TASK_REMOVED":"GANNT_ERROR_LOADING_DATA_TASK_REMOVED",
        "CIRCULAR_REFERENCE":"Circular reference.",
        "CANNOT_DEPENDS_ON_ANCESTORS":"Cannot depend on ancestors.",
        "INVALID_DATE_FORMAT":"The data inserted are invalid for the field format.",
        "GANTT_ERROR_LOADING_DATA_TASK_REMOVED":"An error has occurred while loading the data. A task has been trashed.",
        "CANNOT_CLOSE_TASK_IF_OPEN_ISSUE":"Cannot close a task with open issues",
        "TASK_MOVE_INCONSISTENT_LEVEL":"You cannot exchange tasks of different depth.",
        "CANNOT_MOVE_TASK":"CANNOT_MOVE_TASK",
        "PLEASE_SAVE_PROJECT":"PLEASE_SAVE_PROJECT",
        "GANTT_SEMESTER":"Semester",
        "GANTT_SEMESTER_SHORT":"s.",
        "GANTT_QUARTER":"Quarter",
        "GANTT_QUARTER_SHORT":"q.",
        "GANTT_WEEK":"Week",
        "GANTT_WEEK_SHORT":"w."
    };
}

function loadFromLocalStorage() {
    var ret;
    if (localStorage) {
        if (localStorage.getItem("teamworkGantDemo")) {
            ret = localStorage.getItem("teamworkGantDemo");
        }
    }

    //if not found create a new example task
    if (!ret || !ret.tasks || ret.tasks.length === 0){
        ret=getDemoProject();
    }
    return ret;
}


function saveInLocalStorage() {
    var prj = ge.saveProject();
    if (localStorage) {
        localStorage.setItem("teamworkGantDemo", prj);
    }
}

var randomData = [
    "Epic,RMP-1,36660,some items to be balanced,",
    "Epic,RMP-95,35984,lighten a candle,Phase 3",
    "Epic,RMP-94,35130,Template definition,",
    "Epic,RMP-93,34434,Containerization,Phase 2",
    "Epic,RMP-74,33880,drink water,Phase 3",
    "Epic,RMP-59,33563,plant a tree,Phase 2",
    "Epic,RMP-30,33534,pay taxes,Phase 1",
];

function getDemoProject() {
    //console.debug("getDemoProject")
    // {
    //   "id": -1,
    //   "name": "Gantt editor",
    //   "progress": 0,
    //   "progressByWorklog": false,
    //   "relevance": 0,
    //   "type": "",
    //   "typeId": "",
    //   "description": "",
    //   "code": "",
    //   "level": 0,
    //   "status": "STATUS_ACTIVE",
    //   "depends": "",
    //   "canWrite": true,
    //   "start": 1396994400000,
    //   "duration": 20,
    //   "end": 1399586399999,
    //   "startIsMilestone": false,
    //   "endIsMilestone": false,
    //   "collapsed": false,
    //   "assigs": [],
    //   "hasChild": true
    // }
    var ret = {
        "tasks": [],
        "selectedRow": 2,
        "deletedTaskIds": [],
        "resources": [
            {"id": "tmp_1", "name": "Resource 1"},
            {"id": "tmp_2", "name": "Resource 2"},
            {"id": "tmp_3", "name": "Resource 3"},
            {"id": "tmp_4", "name": "Resource 4"}
        ],
        "roles": [
            {"id": "tmp_1", "name": "Project Manager"},
            {"id": "tmp_2", "name": "Worker"},
            {"id": "tmp_3", "name": "Stakeholder"},
            {"id": "tmp_4", "name": "Customer"}
        ],
        "canWrite": true,
        "canDelete": true,
        "canWriteOnParent": true,
        canAdd: true
    };

    var idCounter = 1;

    function addTasks(randomTaskList, hasChild) {
        for (var i = 0; i < randomTaskList.length; i++) {
            var items = randomTaskList[i].split(',');
            ret.tasks.push(
                {
                    "id": idCounter,
                    "name": items[3],
                    "progress": 0,
                    "progressByWorklog": false,
                    "relevance": 0,
                    "type": "",
                    "typeId": "",
                    "description": "",
                    "code": items[1],
                    "level": hasChild ? 0 : 1,
                    "status": "STATUS_ACTIVE",
                    "depends": "",
                    "canWrite": true,
                    "start": 1565765380142,
                    "duration": 5,
                    "end": 1565765380142 + 5 * 24 * 3600,
                    "startIsMilestone": false,
                    "endIsMilestone": false,
                    "collapsed": false,
                    "assigs": [],
                    "hasChild": hasChild
                }
            );
            idCounter++;
        }
    }

    addTasks([",,,Phase 1,,,"], true);
    addTasks($.grep(randomData, (s) => { return s.indexOf('Phase 1')>=0}), false);
    addTasks([",,,Phase 2,,,"], true);
    addTasks($.grep(randomData, (s) => { return s.indexOf('Phase 2')>=0}), false);
    addTasks([",,,Phase 3,,,"], true);
    addTasks($.grep(randomData, (s) => { return s.indexOf('Phase 3')>=0}), false);
    addTasks([",,,Not in a phase yet,,,"], true);
    addTasks($.grep(randomData, (s) => { return s.indexOf('Phase 3') === -1 && s.indexOf('Phase 2') === -1 && s.indexOf('Phase 1') === -1}), false);


    // //actualize data
    // var offset=new Date().getTime()-ret.tasks[0].start;
    // for (var i=0;i<ret.tasks.length;i++) {
    //   ret.tasks[i].start = ret.tasks[i].start + offset;
    // }
    return ret;
}

export var ge;

export function initGanttMaster() {
    var canWrite=true; //this is the default for test purposes

    // here starts ganttalendar initialization
    let ganttMaster = new GanttMaster();
    ganttMaster.set100OnClose=true;

    ganttMaster.shrinkParent=true;

    ganttMaster.init($("#workSpace"));
    loadI18n(); //overwrite with localized ones

    //in order to force compute the best-fitting zoom level
    delete ganttMaster.ganttalendar.zoom;

    var project=loadFromLocalStorage();

    if (!project.canWrite)
        $(".ganttButtonBar button.requireWrite").attr("disabled","true");

    ganttMaster.loadProject(project);
    ganttMaster.checkpoint(); //empty the undo stack

    return ganttMaster;
}

// exports.showBaselineInfo = showBaselineInfo;
// exports.ge = ge;
