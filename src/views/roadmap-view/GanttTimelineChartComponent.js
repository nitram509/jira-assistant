import React, { PureComponent } from 'react';

import { inject } from '../../services/injector-service';

class GanttTimelineChartComponent extends PureComponent {

    constructor(props) {
        super(props);

        inject(this, "JiraRoadmapService");

        this.state = {
            rows: []
        };
    }

    componentDidMount() {
    }

    render() {
        const lineHeight = 35;
        const firstLineHeight = 35;
        return (
            <div>
                <svg className="ganttTimelineChartComponent">
                    {this.props.ganttRows.map((row, index) =>
                        <g>
                            <rect fill="#3BBF67" x="0" y={index * lineHeight + firstLineHeight + 9} width={row.duration * lineHeight} height="22" className="timelineChart-rowBar"/>
                            <text x={row.duration * lineHeight + 20} y={index * lineHeight + firstLineHeight + 5 + 20} className="timelineChart-rowText">{row.name}</text>
                        </g>
                    )}
                </svg>
            </div>
        );
    }
}

export default GanttTimelineChartComponent