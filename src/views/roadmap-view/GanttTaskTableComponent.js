import React, { PureComponent } from 'react';

import ReactDataGrid from 'react-data-grid';

import './RoadmapView.css';

import { inject } from '../../services/injector-service';

const columns = [
    {key: "code", name: "Code", editable: true, width: 80, resizable: true},
    {key: "name", name: "Name", editable: true, width: 350, resizable: true},
    {key: "start", name: "Start", editable: true, width: 90, resizable: true},
    {key: "end", name: "End", editable: true, width: 90, resizable: true},
    {key: "duration", name: "dur.", editable: true, width: 50, resizable: true},
    {key: "completed", name: "%", editable: true, width: 50, resizable: true},
    {key: "assignee", name: "Assignee", editable: true, width: 300, resizable: true}
];

class GanttTaskTableComponent extends PureComponent {

    constructor(props) {
        super(props);

        inject(this, "JiraRoadmapService");

        // TODO [nitram509] doesn't work anymore, since we use props
        // this.state = {
        //     rows: this.props.ganttRows
        // };
    }

    onGridRowsUpdated = ({fromRow, toRow, updated}) => {
        // TODO [nitram509] doesn't work anymore, since we use props
        // this.setState(state => {
        //     const rows = state.rows.slice();
        //     for (let i = fromRow; i <= toRow; i++) {
        //         rows[i] = {...rows[i], ...updated};
        //     }
        //     return {rows};
        // });
    };

    render() {
        return (
            <ReactDataGrid
                minHeight={window.visualViewport.height - 56}
                columns={columns}
                rowGetter={i => this.props.ganttRows[i]}
                rowsCount={this.props.ganttRows.length}
                onGridRowsUpdated={this.onGridRowsUpdated}
                enableCellSelect={true}
            />
        );
    }

}

export default GanttTaskTableComponent