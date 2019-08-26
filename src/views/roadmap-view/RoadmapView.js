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

// import './jq-gantt/libs/utilities.js'
// import './jq-gantt/libs/forms.js'
// import './jq-gantt/libs/date.js'
// import './jq-gantt/libs/dialogs.js'
// import './jq-gantt/libs/layout.js'
// import './jq-gantt/libs/i18nJs.js'


// import './jq-gantt/ganttUtilities.js'
// import './jq-gantt/ganttTask.js'
// import './jq-gantt/ganttGridEditor.js'
// import './jq-gantt/ganttMaster.js'


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
        this.ganttEditor = initGanttMaster();
    }

    render() {
        return (
            <div className="widget-cntr width-perc-100">
                <Panel styleclass="p-no-padding" showheader={false}>
                    <h1>Roadmap</h1>
                    <div id="workSpace"></div>
                </Panel>
            </div>
        );
    }
}

export default RoadmapView;