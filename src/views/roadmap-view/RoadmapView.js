import React, { PureComponent } from 'react';
import { Panel } from 'primereact/panel';

import { initGanttMaster } from "./jq-gantt/gantt";

import './RoadmapView.scss';

import './jq-gantt/platform.css'
import './jq-gantt/libs/jquery/dateField/jquery.dateField.css'
import './jq-gantt/gantt.css'
import './jq-gantt/ganttPrint.css'


// init jQuery and all its helpers
import jquery from 'jquery';
import './jquery-ui-1.12.1/jquery-ui'
import './jq-gantt/libs/jquery/jquery.livequery'
import './jq-gantt/libs/jquery/jquery.timers.js'
import './jq-gantt/libs/jquery/dateField/jquery.dateField.js'
import './jq-gantt/libs/jquery/JST/jquery.JST.js'
import './jq-gantt/libs/jquery/svg/jquery.svg.js'
import './jq-gantt/libs/jquery/svg/jquery.svgdom.1.8.js'
import './jq-gantt/ganttDrawerSVG.js'
window.$ = window.jQuery = jquery;

class RoadmapView extends PureComponent {
    constructor(props) {
        super(props);
        var { match: { params } } = props;
        this.state = { searchText: (params['query'] || "").trim() };
    }

    componentDidMount() {
        if (this.state.searchText.length > 0) {
            this.search();
        }
        this.createTemplateDomElements();
        this.ganttEditor = initGanttMaster();
    }

    render() {
        return (
            <div className="widget-cntr width-perc-100">
                <Panel styleclass="p-no-padding" showheader={false}>
                    <h1>Roadmap</h1>
                    <div id="workSpace" style={{
                        padding: '0px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        border: '1px solid #e5e5e5',
                        position: 'relative',
                        margin:'0 5px'
                    }}/>
                </Panel>
            </div>
        );
    }

    createTemplateDomElements() {

        const templates = jquery('<div id="gantEditorTemplates" style="display:none;">');

        const TASKSEDITHEAD_htmlContent = '<div class="__template__" type="TASKSEDITHEAD"><!--\n' +
            '  <table class="gdfTable" cellspacing="0" cellpadding="0">\n' +
            '    <thead>\n' +
            '    <tr style="height:40px">\n' +
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
            '  <div class="ganttButtonBar noprint">\n' +
            '    <div class="buttons">\n' +
            '      <a href="https://gantt.twproject.com/"><img src="res/twGanttLogo.png" alt="Twproject" align="absmiddle" style="max-width: 136px; padding-right: 15px"></a>\n' +
            '\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'undo.ganttalendar\');return false;" class="button textual icon requireCanWrite" title="undo"><span class="teamworkIcon">&#39;</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'redo.ganttalendar\');return false;" class="button textual icon requireCanWrite" title="redo"><span class="teamworkIcon">&middot;</span></button>\n' +
            '      <span class="ganttButtonSeparator requireCanWrite requireCanAdd"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'addAboveCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanAdd" title="insert above"><span class="teamworkIcon">l</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'addBelowCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanAdd" title="insert below"><span class="teamworkIcon">X</span></button>\n' +
            '      <span class="ganttButtonSeparator requireCanWrite requireCanInOutdent"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'outdentCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanInOutdent" title="un-indent task"><span class="teamworkIcon">.</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'indentCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanInOutdent" title="indent task"><span class="teamworkIcon">:</span></button>\n' +
            '      <span class="ganttButtonSeparator requireCanWrite requireCanMoveUpDown"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'moveUpCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanMoveUpDown" title="move up"><span class="teamworkIcon">k</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'moveDownCurrentTask.ganttalendar\');return false;" class="button textual icon requireCanWrite requireCanMoveUpDown" title="move down"><span class="teamworkIcon">j</span></button>\n' +
            '      <span class="ganttButtonSeparator requireCanWrite requireCanDelete"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'deleteFocused.ganttalendar\');return false;" class="button textual icon delete requireCanWrite" title="Elimina"><span class="teamworkIcon">&cent;</span></button>\n' +
            '      <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'expandAll.ganttalendar\');return false;" class="button textual icon " title="EXPAND_ALL"><span class="teamworkIcon">6</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'collapseAll.ganttalendar\'); return false;" class="button textual icon " title="COLLAPSE_ALL"><span class="teamworkIcon">5</span></button>\n' +
            '\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'zoomMinus.ganttalendar\'); return false;" class="button textual icon " title="zoom out"><span class="teamworkIcon">)</span></button>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'zoomPlus.ganttalendar\');return false;" class="button textual icon " title="zoom in"><span class="teamworkIcon">(</span></button>\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'print.ganttalendar\');return false;" class="button textual icon " title="Print"><span class="teamworkIcon">p</span></button>\n' +
            '    <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="ge.ganttalendar.showCriticalPath=!ge.ganttalendar.showCriticalPath; ge.redraw();return false;" class="button textual icon requireCanSeeCriticalPath" title="CRITICAL_PATH"><span class="teamworkIcon">&pound;</span></button>\n' +
            '    <span class="ganttButtonSeparator requireCanSeeCriticalPath"></span>\n' +
            '      <button onclick="ge.splitter.resize(.1);return false;" class="button textual icon" ><span class="teamworkIcon">F</span></button>\n' +
            '      <button onclick="ge.splitter.resize(50);return false;" class="button textual icon" ><span class="teamworkIcon">O</span></button>\n' +
            '      <button onclick="ge.splitter.resize(100);return false;" class="button textual icon"><span class="teamworkIcon">R</span></button>\n' +
            '      <span class="ganttButtonSeparator"></span>\n' +
            '      <button onclick="$(\'#workSpace\').trigger(\'fullScreen.ganttalendar\');return false;" class="button textual icon" title="FULLSCREEN" id="fullscrbtn"><span class="teamworkIcon">@</span></button>\n' +
            '      <button onclick="ge.element.toggleClass(\'colorByStatus\' );return false;" class="button textual icon"><span class="teamworkIcon">&sect;</span></button>\n' +
            '\n' +
            '    <button onclick="editResources();" class="button textual requireWrite" title="edit resources"><span class="teamworkIcon">M</span></button>\n' +
            '      &nbsp; &nbsp; &nbsp; &nbsp;\n' +
            '    <button onclick="saveGanttOnServer();" class="button first big requireWrite" title="Save">Save</button>\n' +
            '    <button onclick=\'newProject();\' class=\'button requireWrite newproject\'><em>clear project</em></button>\n' +
            '    <button class="button login" title="login/enroll" onclick="loginEnroll($(this));" style="display:none;">login/enroll</button>\n' +
            '    <button class="button opt collab" title="Start with Twproject" onclick="collaborate($(this));" style="display:none;"><em>collaborate</em></button>\n' +
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

        jquery('#workSpace').parent().append(templates);
    }
}

export default RoadmapView