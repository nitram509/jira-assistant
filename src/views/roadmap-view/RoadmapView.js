import React, { PureComponent } from 'react';
import Button from "../../controls/Button";

import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

import './RoadmapView.css';

import { inject } from '../../services/injector-service';

import GanttTaskTableComponent from "./GanttTaskTableComponent";
import GanttTimelineChartComponent from "./GanttTimelineChartComponent";


class RoadmapView extends PureComponent {

    constructor(props) {
        super(props);

        /** @type JiraRoadmapService */ this.$jiraRoadmap = undefined;
        inject(this, "JiraRoadmapService");

        this.state = {
            rows: []
        };
    }

    onLoadTickets(event) {
        this.$jiraRoadmap.getRoadmapTickets().then((/** @type JiraIssue[] */ ticketList) => {
            const loadedTicketsAsRowItems = [];
            for (let i = 0; i < ticketList.length; i++) {
                /** @type JiraIssue */
                const ticket = ticketList[i];
                loadedTicketsAsRowItems.add({
                    // id: this.state.rows.length,
                    code: ticket.key,
                    name: ticket.fields.summary,
                    start: "" + new Date(),
                    end: "" + new Date(Date.now() + 3600 * 1000 * 24), // TODO [nitram509] remove fake date
                    duration: i + 1,
                    completed: ((ticket.fields.status && ticket.fields.status.name === "Done") ? 100 : 0),
                    assignee: (ticket.fields.assignee ? ticket.fields.assignee.displayName : "")
                });
            }
            this.setState(prevState => ({rows: [...prevState.rows, ...loadedTicketsAsRowItems]}));
        });
    }

    render() {
        return (
            <div className="widget-cntr width-perc-100">
                <h1>Roadmap</h1>
                <div>
                    <Button type="success" icon="fa" label="Load Tickets" onClick={(e) => this.onLoadTickets(e)}/>
                </div>
                <div>
                    <SplitterLayout horizontal={true}>
                        <div id="paneLeft">
                            <GanttTaskTableComponent ganttRows={this.state.rows}/>
                        </div>
                        <div id="paneRight">
                            <GanttTimelineChartComponent ganttRows={this.state.rows}/>
                        </div>
                    </SplitterLayout>
                </div>
            </div>
        );
    }

}

export default RoadmapView