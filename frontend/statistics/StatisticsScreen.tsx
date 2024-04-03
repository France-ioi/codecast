import React from "react";
import {
    Alert,
    Button, Callout,
    Classes,
    ControlGroup,
    FormGroup,
    HTMLSelect, HTMLTable,
    InputGroup,
    Intent,
    Spinner
} from "@blueprintjs/core";
import {CSVLink} from 'react-csv';
import {DateRangePicker} from "@blueprintjs/datetime";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface StatisticsScreenStateToProps {
    folders: any,
    rowData: any,
    isReady: boolean,
    dateRange: any,
    folder: any,
    folderOptions: any,
    prefix: any,
    searchError: any,
    searchStatus: any
}

function mapStateToProps(state: AppStore): StatisticsScreenStateToProps {
    const statistics = state.statistics;
    const user = state.user;

    const dateRange = statistics.dateRange;

    const folders = (user ? user.grants : []).reduce(
        (obj, {description, s3Bucket, uploadPath}) => {
            obj[description] = [s3Bucket, uploadPath];
            return obj;
        }, {"Select a Folder": null});
    const folderOptions = Object.keys(folders);
    const folder = statistics.folder.label;

    const prefix = statistics.prefix;
    const isReady = statistics.isReady;

    const rowData = statistics.search.data;
    const searchStatus = statistics.search.status;
    const searchError = statistics.search.error;

    return {
        isReady,
        rowData,
        searchError,
        searchStatus,
        dateRange,
        folderOptions,
        folder,
        folders,
        prefix
    };
}

interface StatisticsScreenDispatchToProps {
    dispatch: Function
}

interface StatisticsScreenProps extends StatisticsScreenStateToProps, StatisticsScreenDispatchToProps {

}

class _StatisticsScreen extends React.PureComponent<StatisticsScreenProps> {
    handleDateChange = (dateRange) => {
        const {dispatch} = this.props;
        dispatch({type: ActionTypes.StatisticsDateRangeChanged, payload: {dateRange}});
    }
    handleFolderChange = (event) => {
        const {dispatch, folders} = this.props;
        const selectedValue = event.currentTarget.value;
        dispatch({type: ActionTypes.StatisticsFolderChanged, payload: {folder: {label: selectedValue, value: folders[selectedValue]}}});
    }
    handlePrefixChange = (event) => {
        const {dispatch} = this.props;
        dispatch({type: ActionTypes.StatisticsPrefixChanged, payload: {prefix: event.target.value}});
    }
    handleErrorReset = () => {
        const {dispatch} = this.props;
        dispatch({type: ActionTypes.StatisticsSearchStatusChanged, payload: {status: 'success'}});
    }
    handleSubmit = () => {
        const {dispatch, isReady} = this.props;

        if (isReady) {
            dispatch({type: ActionTypes.StatisticsSearchSubmit});
        }
    }
    getCSVData = () => {
        const {rowData} = this.props;
        return rowData.reduce((arr, {
            codecast, folder, bucket, name, date_time, views, compiles, compile_time
        }) => {
            arr.push([date_time, String(codecast), name, folder, bucket, views, compiles, compile_time]);

            return arr;
        },
        [['DateTime', 'Codecast', 'Name', 'Folder', 'Bucket', 'Views', 'Compilations', 'Total Compile Time (ms)']]);
    }

    render () {
        const {dateRange, folder, folderOptions, prefix, rowData, searchError, searchStatus} = this.props;
        return (
            <div className='text-center'>
                <Alert icon="error" isOpen={!!searchError} onClose={this.handleErrorReset}>
                    Search Error: {searchError}
                    <br />
                    Try again....!
                </Alert>
                <h1 style={{margin: '20px 0'}}>{"Codecast Statistics"}</h1>
                <div style={statsCss}>
                    <ControlGroup vertical={true}>
                        <FormGroup label="Start Date - End Date">
                            <DateRangePicker
                                shortcuts={true}
                                contiguousCalendarMonths={false}
                                className={Classes.ELEVATION_1}
                                onChange={this.handleDateChange}
                                value={dateRange}
                            />
                        </FormGroup>
                        <ControlGroup fill={true}>
                            <FormGroup label="Folder" labelFor="select-folder">
                                <HTMLSelect value={folder} onChange={this.handleFolderChange} options={folderOptions} />
                            </FormGroup>
                            <FormGroup label="Prefix" labelFor="input-prefix">
                                <InputGroup
                                    id="input-prefix"
                                    leftIcon="filter"
                                    onChange={this.handlePrefixChange}
                                    value={prefix}
                                />
                            </FormGroup>
                            <FormGroup label=" "></FormGroup>
                            <FormGroup label=" " labelFor="btn-search">
                                <Button
                                    id="btn-search"
                                    text="Search"
                                    icon="search"
                                    intent={Intent.PRIMARY}
                                    onClick={this.handleSubmit}
                                />
                            </FormGroup>
                        </ControlGroup>
                    </ControlGroup>
                </div>
                <hr style={{width: '80%'}} />
                <div style={{marginBottom: '30px', display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
                    {searchStatus === 'loading' &&
                        <Spinner className="text-center" intent={Intent.PRIMARY} size={50} />
                    }
                    {rowData.length === 0 ?
                        searchStatus !== 'loading' && (
                            <Callout title="No Data" style={{margin: '0 auto', width: '350px'}}>
                                Search to load Statistics...
                            </Callout>
                        ) :
                        (<React.Fragment>
                            <HTMLTable
                                bordered
                                interactive
                                condensed
                            >
                                <thead>
                                    <tr>
                                        <th>DateTime</th>
                                        <th>Codecast</th>
                                        <th>Name</th>
                                        <th>Folder</th>
                                        <th>Bucket</th>
                                        <th>Views</th>
                                        <th>Compilations</th>
                                        <th>Total Compile Time (ms)</th>
                                    </tr >
                                </thead >
                                <tbody>
                                    {rowData.map(({codecast, folder, bucket, name, date_time, views, compiles, compile_time}, index) => (
                                        <tr key={index}>
                                            <td>{date_time}</td>
                                            <td>{codecast || '-------------'}</td>
                                            <td>{name}</td>
                                            <td>{folder}</td>
                                            <td>{bucket}</td>
                                            <td>{views}</td>
                                            <td>{compiles}</td>
                                            <td>{compile_time}</td>
                                        </tr>
                                    ))}
                                    {(() => {
                                        const [total_views, total_compiles, total_compile_time] = rowData.reduce((totals, {views, compiles, compile_time}) => [totals[0] + views, totals[1] + compiles, totals[2] + compile_time], [0, 0, 0]);
                                        return (
                                            <tr key={rowData.length}>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td><b>{total_views}</b></td>
                                                <td><b>{total_compiles}</b></td>
                                                <td><b>{total_compile_time.toFixed(3)}</b></td>
                                            </tr>
                                        )
                                    })()}
                                </tbody>
                            </HTMLTable >
                            <div>
                                <CSVLink style={{
                                    padding: '5px',
                                    display: 'inline-block',
                                    color: 'black',
                                    fontWeight: 600,
                                    border: '1px solid black',
                                    marginTop: ' 20px'
                                }} data={this.getCSVData()} >Export CSV</CSVLink>
                            </div>
                        </React.Fragment>
                        )}
                </div>
            </div >
        );
    }
}

export const StatisticsScreen = connect(mapStateToProps)(_StatisticsScreen);

const statsCss = {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    marginTop: '30px',
    justifyContent: 'center'
}
