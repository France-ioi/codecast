import React from "react";
import {Button, Callout, Intent, Menu, MenuItem, NonIdealState, Position, Spinner} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {SubtitlesEditorOption} from "./SubtitlesEditorOption";
import {SubtitlesEditorNewOption} from "./SubtitlesEditorNewOption";
import Files from 'react-files';
import {ActionTypes} from "./actionTypes";

interface SubtitlesEditorProps {
    availableOptions: any,
    selected: any,
    subtitlesText: any,
    langOptions: any,
    canSave: any,
    unsaved: any,
    notify: any,
    dispatch: Function
}

export class SubtitlesEditor extends React.PureComponent<SubtitlesEditorProps> {
    _loadInput = null;

    render() {
        const {availableOptions, selected, subtitlesText, langOptions, canSave, unsaved, notify} = this.props;
        const availKeys = Object.keys(availableOptions).filter(key => !availableOptions[key].removed).sort();

        return (
            <div>
                <div className='hbox mb'>
                    <div className='fill' style={{paddingRight: '10px'}}>
                        <Menu>
                            {availKeys.map(key =>
                                <SubtitlesEditorOption
                                    key={key}
                                    option={availableOptions[key]}
                                    selected={selected && selected.key === key}
                                    onSelect={this._selectOption}
                                />)
                            }
                            <MenuItem icon='add' text='Add language…' popoverProps={{position: Position.TOP_RIGHT}}>
                                {langOptions.map(option =>
                                    <SubtitlesEditorNewOption
                                        key={option.value}
                                        option={option}
                                        disabled={availKeys.find(key => option.value === key)}
                                        onSelect={this._addOption}/>)}
                            </MenuItem>
                        </Menu>
                    </div>
                    <div className='fill' style={{paddingLeft: '10px'}}>
                        {selected
                            ? <div>
                                <textarea rows={7} style={{width: '100%'}} value={subtitlesText}
                                          onChange={this._onChange}/>
                                <div className='buttons-bar'>
                                    <Files onChange={this._fileChanged} accepts={this._fileAccepts}
                                           style={{display: 'inline-block'}}><Button
                                        icon={IconNames.UPLOAD}>{"Load"}</Button></Files>
                                    <Button onClick={this._saveSelected} icon={IconNames.DOWNLOAD} text={"Save"}/>
                                    <Button onClick={this._reloadSelected} icon={IconNames.CLOUD_DOWNLOAD}
                                            disabled={!selected.url} text={"Revert"}/>
                                    <Button onClick={this._removeSelected} icon={IconNames.CROSS} text={'Remove'}/>
                                </div>
                            </div>
                            : <NonIdealState
                                icon='arrow-left'
                                title={"No language selected"}
                                description={"Load existing subtitles or add a new language, and click the Edit button."}
                            />}
                    </div>
                </div>
                <div className='hbox mb' style={{textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
                    <div className='fill center'>
                        <Button onClick={this._beginEdit} disabled={!selected} icon={IconNames.EDIT} text={"Edit"}
                                style={{marginRight: '10px'}}/>
                        <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"} disabled={!canSave}
                                intent={unsaved ? Intent.PRIMARY : Intent.NONE}/>
                    </div>
                </div>
                {!canSave &&
                <Callout intent={Intent.WARNING} title={"Insufficient access rights"}>
                    {"The current user is not allowed to modify this Codecast."}
                </Callout>}
                <div>
                    {notify.key === 'pending' &&
                    <Callout icon={<Spinner size={Spinner.SIZE_SMALL}/>}>{"Saving, please wait."}</Callout>}
                    {notify.key === 'success' && <Callout icon='saved' intent={Intent.SUCCESS}>{"Saved."}</Callout>}
                    {notify.key === 'failure' &&
                    <Callout icon='warning-sign' intent={Intent.DANGER}>{"Failed to save: "}{notify.message}</Callout>}
                </div>
            </div>
        );
    }

    _refLoad = (el) => {
        this._loadInput = el;
    };
    _openLoadInput = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._loadInput.click();
    };
    _selectOption = (option) => {
        this.props.dispatch({type: ActionTypes.SubtitlesSelected, payload: {option}});
    };
    _addOption = (option) => {
        const key = option.value;
        this.props.dispatch({type: ActionTypes.SubtitlesAddOption, payload: {key, select: true}});
    };
    _reloadSelected = () => {
        const {selected: {key, url}} = this.props;
        this.props.dispatch({type: ActionTypes.SubtitlesTextReverted, payload: {key, url}});
    };
    _saveSelected = () => {
        const {selected: {key}} = this.props;
        this.props.dispatch({type: ActionTypes.SubtitlesSaveOption, payload: {key}});
    };
    _removeSelected = () => {
        const {selected: {key}} = this.props;
        if (confirm(`Confirm remove of language ${key}?`)) {
            this.props.dispatch({type: ActionTypes.SubtitlesRemoveOption, payload: {key}});
        }
    };
    _onChange = (event) => {
        const text = event.target.value;
        this.props.dispatch({type: ActionTypes.SubtitlesTextChanged, payload: {text, unsaved: true}});
    };
    _beginEdit = () => {
        this.props.dispatch({type: ActionTypes.SubtitlesEditorEnter});
    };
    _save = () => {
        this.props.dispatch({type: ActionTypes.SubtitlesEditorSave});
    };
    _fileAccepts = ['.srt'];
    _fileChanged = ([file]) => {
        const key = this.props.selected.key;
        this.props.dispatch({type: ActionTypes.SubtitlesTextLoaded, payload: {key, file}});
    };
}
