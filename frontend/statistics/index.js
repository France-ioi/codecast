import React from 'react';
import Immutable from 'immutable';
import classnames from 'classnames';
import {Spinner, Icon, Classes, FormGroup, ControlGroup, HTMLSelect, InputGroup, Button, Intent, HTMLTable, Callout, Alert} from '@blueprintjs/core';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {DateRangePicker} from "@blueprintjs/datetime";
import {asyncRequestJson} from '../utils/api';

function getBrowser () {
  // Opera 8.0+
  const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  // Firefox 1.0+
  const isFirefox = typeof InstallTrigger !== 'undefined';
  // Safari 3.0+ "[object HTMLElementConstructor]"
  const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {return p.toString() === "[object SafariRemoteNotification]";})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
  // Internet Explorer 6-11
  const isIE = /*@cc_on!@*/false || !!document.documentMode;
  // Edge 20+
  const isEdge = !isIE && !!window.StyleMedia;
  // Chrome 1+
  const isChrome = !!window.chrome;

  if (isOpera) {return 'Opera: (' + navigator.userAgent + ')';}
  if (isFirefox) {return 'Firefox: (' + navigator.userAgent + ')';}
  if (isSafari) {return 'Safari: (' + navigator.userAgent + ')';}
  if (isIE) {return 'IE: (' + navigator.userAgent + ')';}
  if (isEdge) {return 'Edge: (' + navigator.userAgent + ')';}
  if (isChrome) {return 'Chrome: (' + navigator.userAgent + ')';}
}

export default function (bundle, deps) {

  bundle.addReducer('init', (state, {payload: {options: {isStatisticsReady}}}) => {
    return state.set('statistics', Immutable.Map({isReady: isStatisticsReady}))
  });

  bundle.defineAction('statisticsInitLogData', 'Statistics.LogData.Init');
  bundle.defineAction('statisticsLogLoadingData', 'Statistics.Loading.LogData.Submit');

  bundle.defineAction('statisticsPrepare', 'Statistics.Prepare');
  bundle.addReducer('statisticsPrepare', statisticsPrepareReducer);

  bundle.defineAction('statisticsDateRangeChanged', 'Statistics.DateRange.Changed');
  bundle.addReducer('statisticsDateRangeChanged', statisticsDateRangeChangedReducer);

  bundle.defineAction('statisticsFolderChanged', 'Statistics.Folder.Changed');
  bundle.addReducer('statisticsFolderChanged', statisticsFolderChangedReducer);

  bundle.defineAction('statisticsPrefixChanged', 'Statistics.Prefix.Changed');
  bundle.addReducer('statisticsPrefixChanged', statisticsPrefixChangedReducer);

  bundle.defineAction('statisticsSearchSubmit', 'Statistics.Search.Submit');
  bundle.defineAction('statisticsSearchStatusChanged', 'Statistics.Search.Status.Changed');
  bundle.addReducer('statisticsSearchStatusChanged', statisticsSearchStatusChangedReducer);

  bundle.defineAction('statisticsLogDataChanged', 'Statistics.LogData.Changed');
  bundle.addReducer('statisticsLogDataChanged', statisticsLogDataChangedReducer);

  bundle.defineView('StatisticsApp', StatisticsAppSelector, StatisticsApp);
  bundle.defineView('StatisticsScreen', StatisticsScreenSelector, StatisticsScreen);

  bundle.addSaga(function* editorSaga (app) {
    yield takeEvery(app.actionTypes.statisticsLogLoadingData, statisticsLogLoadingDataSaga, app);
    yield takeEvery(app.actionTypes.statisticsInitLogData, statisticsInitLogDataSaga, app);
    yield takeEvery(app.actionTypes.playerReady, statisticsPlayerReadySaga, app);
    yield takeEvery(app.actionTypes.statisticsPrepare, statisticsPrepareSaga, app);
    yield takeLatest(app.actionTypes.statisticsSearchSubmit, statisticsSearchSaga, app);
  });

};

function statisticsPrepareReducer (state) {
  return state.update('statistics', statistics =>
    statistics
      .set('dateRange', [null, null])
      .set('folder', {label: "Select a Folder", value: null})
      .set('prefix', '')
      .set('search', {
        status: 'success',
        data: [],
        error: null,
      }));
}

function statisticsDateRangeChangedReducer (state, {payload: {dateRange}}) {
  return state.setIn(['statistics', 'dateRange'], dateRange);
}
function statisticsFolderChangedReducer (state, {payload: {folder}}) {
  return state.setIn(['statistics', 'folder'], folder);
}
function statisticsPrefixChangedReducer (state, {payload: {prefix}}) {
  return state.setIn(['statistics', 'prefix'], prefix);
}
function statisticsSearchStatusChangedReducer (state, {payload}) {
  return state.setIn(['statistics', 'search'], {data: [], error: null, ...payload});
}
function statisticsLogDataChangedReducer (state, {payload: {logData}}) {
  return state.setIn(['statistics', 'logData'], logData);
}


function* statisticsPrepareSaga ({actionTypes}) {
  /* Require the user to be logged in. */
  while (!(yield select(state => state.get('user')))) {
    yield take(actionTypes.loginFeedback);
  }

  yield put({type: actionTypes.switchToScreen, payload: {screen: 'statistics'}});
}

function* statisticsInitLogDataSaga ({actionTypes}) {
  const options = yield select(state => state.get('options'));
  const {
    start: compileType,
    language,
    referer
  } = options;
  const resolution = window.innerWidth + 'x' + window.innerHeight;
  const browser = getBrowser();

  const logData = {
    type: compileType,
    referer,
    browser,
    language,
    resolution
  };

  if (compileType === 'sandbox') {
    const {origin} = options;
    logData.folder = origin;
  } else {
    const {codecastData: {codecast, folder, bucket}} = options;
    logData.codecast = codecast;
    logData.folder = folder;
    logData.bucket = bucket;
  }

  yield put({type: actionTypes.statisticsLogDataChanged, payload: {logData}});
}

function* statisticsPlayerReadySaga ({actionTypes}, {payload: {data: {name}}}) {
  try {
    const logData = yield select(state => state.getIn(['statistics', 'logData']));
    logData.name = name;
    yield put({type: actionTypes.statisticsLogDataChanged, payload: {logData}});

    yield put({type: actionTypes.statisticsLogLoadingData});
  } catch (error) {
    console.error('Error Codecast Load Log', error);
  }
}

function* statisticsLogLoadingDataSaga () {
  try {
    const {baseUrl} = yield select(state => state.get('options'));
    const logData = yield select(state => state.getIn(['statistics', 'logData']));
    yield call(asyncRequestJson, `${baseUrl}/statistics/api/logLoadingData`, {logData});
  } catch (error) {
    console.error('Error Codecast Load Log', error);
  }
}

function* statisticsSearchSaga ({actionTypes}) {
  yield put({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'loading'}});
  let response;
  try {
    const {baseUrl} = yield select(state => state.get('options'));

    const statistics = yield select(state => state.get('statistics'));
    const dateRange = statistics.get('dateRange').map(date => date && date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
    const folder = statistics.get('folder').value;
    const prefix = statistics.get('prefix');

    response = yield call(asyncRequestJson, `${baseUrl}/statistics/api/search`, {
      dateRange,
      folder,
      prefix
    });
  } catch (ex) {
    response = {error: ex.toString()};
  }
  if (response.data) {
    yield put({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'success', data: response.data}});
  } else {
    yield put({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'failed', error: response.error}});
  }
};


function StatisticsAppSelector (state, props) {
  const scope = state.get('scope');
  const user = state.get('user');
  const screen = state.get('screen');
  const {LogoutButton} = scope;
  let activity, screenProp, Screen;
  if (!user) {
    activity = 'login';
    screenProp = 'LoginScreen';
  } else if (screen === 'statistics') {
    activity = 'statistics';
    screenProp = 'StatisticsScreen';
  } else {
    Screen = () => <p>{'undefined state'}</p>;
  }
  if (!Screen && screenProp) {
    Screen = scope[screenProp];
  }
  return {Screen, activity, LogoutButton};
}

class StatisticsApp extends React.PureComponent {
  render () {
    const {collapsed} = this.state;
    const {Screen, activity, LogoutButton} = this.props;
    return (
      <div id='statistics-app'>
        <div id='floating-controls' className={classnames({collapsed})}>
          <span className='collapse-toggle' onClick={this._toggleCollapsed}>
            <Icon icon={`chevron-${collapsed ? 'down' : 'up'}`} />
          </span>
          <div className='btn-group'>
            {/statistics/.test(activity) && <LogoutButton />}
          </div>
        </div>
        <Screen />
      </div>
    );
  }
  state = {collapsed: false};
  _toggleCollapsed = () => {
    const {collapsed} = this.state;
    this.setState({collapsed: !collapsed});
  };
}

function StatisticsScreenSelector (state, props) {
  const statistics = state.get('statistics');
  const user = state.get('user');
  const actionTypes = state.get('actionTypes');

  const dateRange = statistics.get('dateRange');

  const folders = (user.grants || []).reduce(
    (obj, {description, s3Bucket, uploadPath}) => {
      obj[description] = [s3Bucket, uploadPath];
      return obj;
    }, {"Select a Folder": null});
  const folderOptions = Object.keys(folders);
  const folder = statistics.get('folder').label;

  const prefix = statistics.get('prefix');
  const isReady = statistics.get('isReady');

  const rowData = statistics.getIn(['search', 'data']);
  const searchStatus = statistics.getIn(['search', 'status']);
  const searchError = statistics.getIn(['search', 'error']);

  return {
    isReady,
    rowData,
    searchError,
    searchStatus,
    dateRange,
    folderOptions,
    folder,
    folders,
    prefix,
    actionTypes
  };
}

const statsCss = {
  display: 'flex',
  flexGrow: 1,
  flexShrink: 1,
  marginTop: '30px',
  justifyContent: 'center'
}


class StatisticsScreen extends React.PureComponent {
  handleDateChange = (dateRange) => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.statisticsDateRangeChanged, payload: {dateRange}});
  }
  handleFolderChange = (event) => {
    const {dispatch, actionTypes, folders} = this.props;
    const selectedValue = event.currentTarget.value;
    dispatch({type: actionTypes.statisticsFolderChanged, payload: {folder: {label: selectedValue, value: folders[selectedValue]}}});
  }
  handlePrefixChange = (event) => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.statisticsPrefixChanged, payload: {prefix: event.target.value}});
  }
  handleErrorReset = () => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.statisticsSearchStatusChanged, payload: {status: 'success'}});
  }
  handleSubmit = () => {
    const {dispatch, actionTypes, isReady} = this.props;
    if (isReady) {
      dispatch({type: actionTypes.statisticsSearchSubmit});
    }
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
            <FormGroup
              label="Start Date - End Date"
              labelFor="date-range-picker"
            >
              <DateRangePicker
                id="date-range-picker"
                shortcuts={true}
                contiguousCalendarMonths={false}
                className={Classes.ELEVATION_1}
                onChange={this.handleDateChange}
                value={dateRange}
              />
            </FormGroup>
            <ControlGroup fill={true} >
              <FormGroup
                label="Folder"
                labelFor="select-folder"
              >
                <HTMLSelect value={folder} onChange={this.handleFolderChange} options={folderOptions} />
              </FormGroup>
              <FormGroup
                label="Prefix"
                labelFor="input-prefix"
              >
                <InputGroup
                  id="input-prefix"
                  leftIcon="filter"
                  onChange={this.handlePrefixChange}
                  value={prefix}
                />
              </FormGroup>
              <FormGroup
                label=" "
              ></FormGroup>
              <FormGroup
                label=" "
                labelFor="btn-search">
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
        <div style={{marginBottom: '30px', display: 'flex', justifyContent: 'center'}}>
          {
            searchStatus === 'loading' && <Spinner className="text-center" intent={Intent.PRIMARY} size={Spinner.SIZE_STANDARD} />
          }
          {rowData.length === 0 ?
            searchStatus !== 'loading' && (
              <Callout title="No Data" style={{margin: '0 auto', width: '350px'}}>
                Search to load Statistics...
            </Callout>
            ) :
            (<HTMLTable
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
                {
                  rowData.map(({codecast, folder, bucket, name, date_time, views, compiles, compile_time}, index) => (
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
                  ))
                }
                {
                  (() => {
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
                  })()
                }
              </tbody>
            </HTMLTable >)}
        </div>
      </div >
    );
  }
}

