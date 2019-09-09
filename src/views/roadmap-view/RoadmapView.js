import React, { PureComponent } from 'react';
import { Panel } from 'primereact/panel';

import ReactDataGrid from 'react-data-grid';

import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

import { initGanttMaster } from "./jq-gantt/gantt";

import './RoadmapView.css';

import './jq-gantt/platform.css'
import './jq-gantt/gantt.css'

import { inject } from '../../services/injector-service';

// init jQuery and all its helpers
import jquery from 'jquery';
import './jq-gantt/libs/jquery/jquery.timers.js'
import './jq-gantt/libs/jquery/JST/jquery.JST.js'
import './jq-gantt/libs/jquery/svg/jquery.svg.js'
import './jq-gantt/libs/jquery/svg/jquery.svgdom.1.8.js'
import './jq-gantt/ganttDrawerSVG.js'
import Button from "../../controls/Button";

window.$ = window.jQuery = jquery;

const columns = [
    {key: "id", name: "ID", editable: true, width: 25, resizable: true},
    {key: "code", name: "Code", editable: true, width: 80, resizable: true},
    {key: "name", name: "Name", editable: true, width: 350, resizable: true},
    {key: "start", name: "Start", editable: true, width: 90, resizable: true},
    {key: "end", name: "End", editable: true, width: 90, resizable: true},
    {key: "duration", name: "dur.", editable: true, width: 50, resizable: true},
    {key: "completed", name: "%", editable: true, width: 50, resizable: true},
    {key: "dependent", name: "depe.", editable: true, width: 50, resizable: true},
    {key: "assignee", name: "Assignee", editable: true, width: 300, resizable: true}
];

class RoadmapView extends PureComponent {

    constructor(props) {
        super(props);

        inject(this, "JiraRoadmapService");

        this.state = {
            rows: []
        };
    }

    onGridRowsUpdated = ({fromRow, toRow, updated}) => {
        this.setState(state => {
            const rows = state.rows.slice();
            for (let i = fromRow; i <= toRow; i++) {
                rows[i] = {...rows[i], ...updated};
            }
            return {rows};
        });
    };

    componentDidMount() {
        this.createTemplateDomElements();
        initGanttMaster();
    }

    onLoadTickets(event) {
        this.$jiraRoadmap.getRoadmapTickets().then((ticketList) => {
            const loadedTicketsAsRowItems = [];
            for (let i = 0; i < ticketList.length; i++) {
                /** @type JiraIssue */
                const ticket = ticketList[i];
                var a = ticket.fields.assignee.name;
                loadedTicketsAsRowItems.add({
                    id: this.state.rows.length,
                    code: ticket.key,
                    name: ticket.fields.summary,
                    start: "" + new Date(),
                    end: "" + new Date(Date.now() + 3600*1000*24), // TODO [nitram509] remove fake date
                    duration: "",
                    completed: ((ticket.fields.status && ticket.fields.status.name === "Done") ? 100 : 0),
                    dependent: "",
                    assignee: (ticket.fields.assignee ? ticket.fields.assignee.displayName : "")
                });
            }
            this.setState(prevState => ({rows: [...prevState.rows, ...loadedTicketsAsRowItems]}));
        });
    }

    render() {
        return (
            <div className="widget-cntr width-perc-100">
                <Panel styleclass="p-no-padding" showheader={false}>
                    <h1>Roadmap</h1>
                    <div className="pull-left">
                        <Button type="success" icon="fa" label="Load Tickets" onClick={(e) => this.onLoadTickets(e)}/>
                    </div>
                    <div id="workSpace" style={{
                        padding: '0px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        border: '1px solid #e5e5e5',
                        position: 'relative',
                        margin: '0 5px',
                        height: 'calc(100vh - 86px)'
                    }}>
                        <SplitterLayout horizontal={true}>
                            <div id="paneLeft">
                                <ReactDataGrid
                                    columns={columns}
                                    rowGetter={i => this.state.rows[i]}
                                    rowsCount={this.state.rows.length}
                                    onGridRowsUpdated={this.onGridRowsUpdated}
                                    enableCellSelect={true}
                                />
                            </div>
                            <div id="paneRight"/>
                        </SplitterLayout>
                    </div>
                </Panel>
            </div>
        );
    }

    createTemplateDomElements() {

        const templates = jquery('<div id="gantEditorTemplates" style="display:none;">');

        const TASKSEDITHEAD_htmlContent = '<div class="__template__" type="TASKSEDITHEAD"><!--\n' +
            '  <table class="gdfTable" cellspacing="0" cellpadding="0">\n' +
            '    <thead>\n' +
            '    <tr style="height:42px">\n' +
            '      <th class="gdfColHeader" style="width:35px; border-right: none"></th>\n' +
            '      <th class="gdfColHeader" style="width:25px;"></th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:100px;">code/short name</th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:300px;">name</th>\n' +
            '      <th class="gdfColHeader"  align="center" style="width:17px;" title="Start date is a milestone."><span class="teamworkIcon" style="font-size: 8px;">^</span></th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:80px;">start</th>\n' +
            '      <th class="gdfColHeader"  align="center" style="width:17px;" title="End date is a milestone."><span class="teamworkIcon" style="font-size: 8px;">^</span></th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:80px;">End</th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:50px;">dur.</th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:20px;">%</th>\n' +
            '      <th class="gdfColHeader gdfResizable requireCanSeeDep" style="width:50px;">depe.</th>\n' +
            '      <th class="gdfColHeader gdfResizable" style="width:1000px; text-align: left; padding-left: 10px;">assignees</th>\n' +
            '    </tr>\n' +
            '    </thead>\n' +
            '  </table>\n' +
            '  --></div>';
        templates.append(TASKSEDITHEAD_htmlContent);


        const GANTBUTTONS_htmlContent = '<div class="__template__" type="GANTBUTTONS"><!--\n' +
            '  <div class="ganttButtonBar">\n' +
            '    <div class="buttons">\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'undo.ganttalendar\');return false;" class="button textual icon requireCanWrite" title="undo"><span class="teamworkIcon">&#39;</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'redo.ganttalendar\');return false;" class="button textual icon requireCanWrite" title="redo"><span class="teamworkIcon">&middot;</span></button>\n' +
            '    <span class="ganttButtonSeparator requireCanWrite requireCanAdd"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'addAboveCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanAdd" title="insert above"><span class="teamworkIcon">l</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'addBelowCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanAdd" title="insert below"><span class="teamworkIcon">X</span></button>\n' +
            '    <span class="ganttButtonSeparator requireCanWrite requireCanInOutdent"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'outdentCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanInOutdent" title="un-indent task"><span class="teamworkIcon">.</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'indentCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanInOutdent" title="indent task"><span class="teamworkIcon">:</span></button>\n' +
            '    <span class="ganttButtonSeparator requireCanWrite requireCanMoveUpDown"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'moveUpCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanMoveUpDown" title="move up"><span class="teamworkIcon">k</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'moveDownCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanMoveUpDown" title="move down"><span class="teamworkIcon">j</span></button>\n' +
            '    <span class="ganttButtonSeparator requireCanWrite requireCanDelete"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'deleteFocused.ganttalendar\');return false;" class="button textual icon delete requireCanWrite" title="Elimina"><span class="teamworkIcon">&cent;</span></button>\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'expandAll.ganttalendar\');return false;" class="button textual icon " title="EXPAND_ALL"><span class="teamworkIcon">6</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'collapseAll.ganttalendar\'); return false;" class="button textual icon " title="COLLAPSE_ALL"><span class="teamworkIcon">5</span></button>\n' +
            '\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'zoomMinus.ganttalendar\'); return false;" class="button textual icon " title="zoom out"><span class="teamworkIcon">)</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'zoomPlus.ganttalendar\');return false;" class="button textual icon " title="zoom in"><span class="teamworkIcon">(</span></button>\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="ge.ganttalendar.showCriticalPath=!ge.ganttalendar.showCriticalPath; ge.redraw();return false;" class="button textual icon requireCanSeeCriticalPath" title="CRITICAL_PATH"><span class="teamworkIcon">&pound;</span></button>\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="ge.element.toggleClass(\'colorByStatus\' );return false;" class="button textual icon"><span class="teamworkIcon">&sect;</span></button>\n' +
            '\n' +
            '      <button onclick="editResources();" class="button textual requireWrite" title="edit resources"><span class="teamworkIcon">M</span></button>\n' +
            '    &nbsp; &nbsp; &nbsp; &nbsp;\n' +
            '      <button onclick="saveGanttOnServer();" class="button first big requireWrite" title="Save">Save</button>\n' +
            '      <button onclick=\'newProject();\' class=\'button requireWrite newproject\'><em>clear project</em></button>\n' +
            '      <button class="button opt collab" title="Start with Twproject" onclick="collaborate($(this));" style="display:none;"><em>collaborate</em></button>\n' +
            '    </div></div>\n' +
            '  --></div>';
        templates.append(GANTBUTTONS_htmlContent);

        const TASKROW_htmlContent = '<div class="__template__" type="TASKROW"><!--\n' +
            '  <tr id="tid_(#=obj.id#)" taskId="(#=obj.id#)" class="taskEditRow (#=obj.isParent()?\'isParent\':\'\'#) (#=obj.collapsed?\'collapsed\':\'\'#)" level="(#=level#)">\n' +
            '    <th class="gdfCell edit" align="right" style="cursor:pointer;"><span class="taskRowIndex">(#=obj.getRow()+1#)</span> <span class="teamworkIcon" style="font-size:12px;" >e</span></th>\n' +
            '    <td class="gdfCell noClip" align="center"><div class="taskStatus cvcColorSquare" status="(#=obj.status#)"></div></td>\n' +
            '    <td class="gdfCell"><input type="text" name="code" value="(#=obj.code?obj.code:\'\'#)" placeholder="code/short name"></td>\n' +
            '    <td class="gdfCell indentCell" style="padding-left:(#=obj.level*10+18#)px;">\n' +
            '      <div class="exp-controller" align="center"></div>\n' +
            '      <input type="text" name="name" value="(#=obj.name#)" placeholder="name">\n' +
            '    </td>\n' +
            '    <td class="gdfCell" align="center"><input type="checkbox" name="startIsMilestone"></td>\n' +
            '    <td class="gdfCell"><input type="text" name="start"  value="" class="date"></td>\n' +
            '    <td class="gdfCell" align="center"><input type="checkbox" name="endIsMilestone"></td>\n' +
            '    <td class="gdfCell"><input type="text" name="end" value="" class="date"></td>\n' +
            '    <td class="gdfCell"><input type="text" name="duration" autocomplete="off" value="(#=obj.duration#)"></td>\n' +
            '    <td class="gdfCell"><input type="text" name="progress" class="validated" entrytype="PERCENTILE" autocomplete="off" value="(#=obj.progress?obj.progress:\'\'#)" (#=obj.progressByWorklog?"readOnly":""#)></td>\n' +
            '    <td class="gdfCell requireCanSeeDep"><input type="text" name="depends" autocomplete="off" value="(#=obj.depends#)" (#=obj.hasExternalDep?"readonly":""#)></td>\n' +
            '    <td class="gdfCell taskAssigs">(#=obj.getAssigsString()#)</td>\n' +
            '  </tr>\n' +
            '  --></div>';
        templates.append(TASKROW_htmlContent);

        const TASKEMPTYROW_htmlContent = '<div class="__template__" type="TASKEMPTYROW"><!--\n' +
            '  <tr class="taskEditRow emptyRow" >\n' +
            '    <th class="gdfCell" align="right"></th>\n' +
            '    <td class="gdfCell noClip" align="center"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '    <td class="gdfCell requireCanSeeDep"></td>\n' +
            '    <td class="gdfCell"></td>\n' +
            '  </tr>\n' +
            '  --></div>';
        templates.append(TASKEMPTYROW_htmlContent);

        templates.append('<div class="__template__" type="TASKBAR"><!--\n' +
            '  <div class="taskBox taskBoxDiv" taskId="(#=obj.id#)" >\n' +
            '    <div class="layout (#=obj.hasExternalDep?\'extDep\':\'\'#)">\n' +
            '      <div class="taskStatus" status="(#=obj.status#)"></div>\n' +
            '      <div class="taskProgress" style="width:(#=obj.progress>100?100:obj.progress#)%; background-color:(#=obj.progress>100?\'red\':\'rgb(153,255,51);\'#);"></div>\n' +
            '      <div class="milestone (#=obj.startIsMilestone?\'active\':\'\'#)" ></div>\n' +
            '\n' +
            '      <div class="taskLabel"></div>\n' +
            '      <div class="milestone end (#=obj.endIsMilestone?\'active\':\'\'#)" ></div>\n' +
            '    </div>\n' +
            '  </div>\n' +
            '  --></div>');

        templates.append('<div class="__template__" type="CHANGE_STATUS"><!--\n' +
            '    <div class="taskStatusBox">\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_ACTIVE" title="Active"></div>\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_DONE" title="Completed"></div>\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_FAILED" title="Failed"></div>\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_SUSPENDED" title="Suspended"></div>\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_WAITING" title="Waiting" style="display: none;"></div>\n' +
            '    <div class="taskStatus cvcColorSquare" status="STATUS_UNDEFINED" title="Undefined"></div>\n' +
            '    </div>\n' +
            '  --></div>');

        templates.append('<div class="__template__" type="TASK_EDITOR"><!--\n' +
            '  <div class="ganttTaskEditor">\n' +
            '    <h2 class="taskData">Task editor</h2>\n' +
            '    <table  cellspacing="1" cellpadding="5" width="100%" class="taskData table" border="0">\n' +
            '          <tr>\n' +
            '        <td width="200" style="height: 80px"  valign="top">\n' +
            '          <label for="code">code/short name</label><br>\n' +
            '          <input type="text" name="code" id="code" value="" size=15 class="formElements" autocomplete=\'off\' maxlength=255 style=\'width:100%\' oldvalue="1">\n' +
            '        </td>\n' +
            '        <td colspan="3" valign="top"><label for="name" class="required">name</label><br><input type="text" name="name" id="name"class="formElements" autocomplete=\'off\' maxlength=255 style=\'width:100%\' value="" required="true" oldvalue="1"></td>\n' +
            '          </tr>\n' +
            '\n' +
            '\n' +
            '      <tr class="dateRow">\n' +
            '        <td nowrap="">\n' +
            '          <div style="position:relative">\n' +
            '            <label for="start">start</label>&nbsp;&nbsp;&nbsp;&nbsp;\n' +
            '            <input type="checkbox" id="startIsMilestone" name="startIsMilestone" value="yes"> &nbsp;<label for="startIsMilestone">is milestone</label>&nbsp;\n' +
            '            <br><input type="text" name="start" id="start" size="8" class="formElements dateField validated date" autocomplete="off" maxlength="255" value="" oldvalue="1" entrytype="DATE">\n' +
            '            <span title="calendar" id="starts_inputDate" class="teamworkIcon openCalendar" onclick="$(this).dateField({inputField:$(this).prevAll(\':input:first\'),isSearchField:false});">m</span>          </div>\n' +
            '        </td>\n' +
            '        <td nowrap="">\n' +
            '          <label for="end">End</label>&nbsp;&nbsp;&nbsp;&nbsp;\n' +
            '          <input type="checkbox" id="endIsMilestone" name="endIsMilestone" value="yes"> &nbsp;<label for="endIsMilestone">is milestone</label>&nbsp;\n' +
            '          <br><input type="text" name="end" id="end" size="8" class="formElements dateField validated date" autocomplete="off" maxlength="255" value="" oldvalue="1" entrytype="DATE">\n' +
            '          <span title="calendar" id="ends_inputDate" class="teamworkIcon openCalendar" onclick="$(this).dateField({inputField:$(this).prevAll(\':input:first\'),isSearchField:false});">m</span>\n' +
            '        </td>\n' +
            '        <td nowrap="" >\n' +
            '          <label for="duration" class=" ">Days</label><br>\n' +
            '          <input type="text" name="duration" id="duration" size="4" class="formElements validated durationdays" title="Duration is in working days." autocomplete="off" maxlength="255" value="" oldvalue="1" entrytype="DURATIONDAYS">&nbsp;\n' +
            '        </td>\n' +
            '      </tr>\n' +
            '\n' +
            '      <tr>\n' +
            '        <td  colspan="2">\n' +
            '          <label for="status" class=" ">status</label><br>\n' +
            '          <select id="status" name="status" class="taskStatus" status="(#=obj.status#)"  onchange="$(this).attr(\'STATUS\',$(this).val());">\n' +
            '            <option value="STATUS_ACTIVE" class="taskStatus" status="STATUS_ACTIVE" >active</option>\n' +
            '            <option value="STATUS_WAITING" class="taskStatus" status="STATUS_WAITING" >suspended</option>\n' +
            '            <option value="STATUS_SUSPENDED" class="taskStatus" status="STATUS_SUSPENDED" >suspended</option>\n' +
            '            <option value="STATUS_DONE" class="taskStatus" status="STATUS_DONE" >completed</option>\n' +
            '            <option value="STATUS_FAILED" class="taskStatus" status="STATUS_FAILED" >failed</option>\n' +
            '            <option value="STATUS_UNDEFINED" class="taskStatus" status="STATUS_UNDEFINED" >undefined</option>\n' +
            '          </select>\n' +
            '        </td>\n' +
            '\n' +
            '        <td valign="top" nowrap>\n' +
            '          <label>progress</label><br>\n' +
            '          <input type="text" name="progress" id="progress" size="7" class="formElements validated percentile" autocomplete="off" maxlength="255" value="" oldvalue="1" entrytype="PERCENTILE">\n' +
            '        </td>\n' +
            '      </tr>\n' +
            '\n' +
            '          </tr>\n' +
            '          <tr>\n' +
            '            <td colspan="4">\n' +
            '              <label for="description">Description</label><br>\n' +
            '              <textarea rows="3" cols="30" id="description" name="description" class="formElements" style="width:100%"></textarea>\n' +
            '            </td>\n' +
            '          </tr>\n' +
            '        </table>\n' +
            '\n' +
            '    <h2>Assignments</h2>\n' +
            '  <table  cellspacing="1" cellpadding="0" width="100%" id="assigsTable">\n' +
            '    <tr>\n' +
            '      <th style="width:100px;">name</th>\n' +
            '      <th style="width:70px;">Role</th>\n' +
            '      <th style="width:30px;">est.wklg.</th>\n' +
            '      <th style="width:30px;" id="addAssig"><span class="teamworkIcon" style="cursor: pointer">+</span></th>\n' +
            '    </tr>\n' +
            '  </table>\n' +
            '\n' +
            '  <div style="text-align: right; padding-top: 20px">\n' +
            '    <span id="saveButton" class="button first" onClick="$(this).trigger(\'saveFullEditor.ganttalendar\');">Save</span>\n' +
            '  </div>\n' +
            '\n' +
            '  </div>\n' +
            '  --></div>');

        templates.append('<div class="__template__" type="ASSIGNMENT_ROW"><!--\n' +
            '  <tr taskId="(#=obj.task.id#)" assId="(#=obj.assig.id#)" class="assigEditRow" >\n' +
            '    <td ><select name="resourceId"  class="formElements" (#=obj.assig.id.indexOf("tmp_")==0?"":"disabled"#) ></select></td>\n' +
            '    <td ><select type="select" name="roleId"  class="formElements"></select></td>\n' +
            '    <td ><input type="text" name="effort" value="(#=getMillisInHoursMinutes(obj.assig.effort)#)" size="5" class="formElements"></td>\n' +
            '    <td align="center"><span class="teamworkIcon delAssig del" style="cursor: pointer">d</span></td>\n' +
            '  </tr>\n' +
            '  --></div>');

        templates.append('<div class="__template__" type="RESOURCE_EDITOR"><!--\n' +
            '  <div class="resourceEditor" style="padding: 5px;">\n' +
            '\n' +
            '    <h2>Project team</h2>\n' +
            '    <table  cellspacing="1" cellpadding="0" width="100%" id="resourcesTable">\n' +
            '      <tr>\n' +
            '        <th style="width:100px;">name</th>\n' +
            '        <th style="width:30px;" id="addResource"><span class="teamworkIcon" style="cursor: pointer">+</span></th>\n' +
            '      </tr>\n' +
            '    </table>\n' +
            '\n' +
            '    <div style="text-align: right; padding-top: 20px"><button id="resSaveButton" class="button big">Save</button></div>\n' +
            '  </div>\n' +
            '  --></div>');

        templates.append('<div class="__template__" type="RESOURCE_ROW"><!--\n' +
            '  <tr resId="(#=obj.id#)" class="resRow" >\n' +
            '    <td ><input type="text" name="name" value="(#=obj.name#)" style="width:100%;" class="formElements"></td>\n' +
            '    <td align="center"><span class="teamworkIcon delRes del" style="cursor: pointer">d</span></td>\n' +
            '  </tr>\n' +
            '  --></div>');

        jquery('#workSpace').parent().append(templates);

        jquery.JST.loadDecorator("RESOURCE_ROW", function (resTr, res) {
            resTr.find(".delRes").click(function () {
                jquery(this).closest("tr").remove()
            });
        });

        jquery.JST.loadDecorator("ASSIGNMENT_ROW", function (assigTr, taskAssig) {
            var resEl = assigTr.find("[name=resourceId]");
            var opt = jquery("<option>");
            resEl.append(opt);
            for (let i = 0; i < taskAssig.task.master.resources.length; i++) {
                var res = taskAssig.task.master.resources[i];
                opt = jquery("<option>");
                opt.val(res.id).html(res.name);
                if (taskAssig.assig.resourceId === res.id)
                    opt.attr("selected", "true");
                resEl.append(opt);
            }
            var roleEl = assigTr.find("[name=roleId]");
            for (let i = 0; i < taskAssig.task.master.roles.length; i++) {
                var role = taskAssig.task.master.roles[i];
                var optr = jquery("<option>");
                optr.val(role.id).html(role.name);
                if (taskAssig.assig.roleId === role.id)
                    optr.attr("selected", "true");
                roleEl.append(optr);
            }

            if (taskAssig.task.master.permissions.canWrite && taskAssig.task.canWrite) {
                assigTr.find(".delAssig").click(function () {
                    var tr = jquery(this).closest("[assId]").fadeOut(200, function () {
                        jquery(this).remove()
                    });
                });
            }

        });
    }
}

export default RoadmapView