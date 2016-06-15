
import React from 'react';
import {Panel} from 'react-bootstrap';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import {inspectPointer, pointerType, PointerValue} from 'persistent-c';

import {defineSelector, defineView} from '../utils/linker';

const getIdent = function (expr) {
  return expr[0] === 'ident' && expr[1];
};

const renderType = function (type, prec) {
  switch (type.kind) {
    case 'scalar':
      return type.repr;
    case 'pointer':
      return renderType(type.pointee, 1) + '*';
  }
  return type.toString();
};

const renderValue = function (view) {
  const classes = [view.load !== undefined && 'value-loaded'];
  return (
    <span className="value">
      <span className={classnames(classes)}>{view.value.toString()}</span>
      {view.prevValue && <span className="value-changed">{view.prevValue.toString()}</span>}
    </span>
  );
};

const ShowVar = EpicComponent(self => {
  self.render = function () {
    const {view} = self.props;
    const {name, value} = view;
    if (!value) {
      return <p>{name} not in scope</p>;
    }
    const header = (
      <span>
        <span className="variable-type">{renderType(value.type, 0)}</span>
        {' '}
        <span className="variable-name">{name}</span>
        {' = '}
      </span>);
    return <Panel className="variable-decl" header={header}>{renderValue(value)}</Panel>;
  };
});

const ShowArray = EpicComponent(self => {
  self.render = function () {
    const {view} = self.props;
    const {name, elemType, elemCount, elems} = view;
    if (!elems) {
      return <p>{name} not in scope</p>;
    }
    // TODO: cursors
    const renderArrayElem = function (elem, i) {
      const {value, cursors, prevCursors} = elem;
      const elemClasses = [
        "array-elemView",
        elem.last && "array-lastElem"
      ];
      const valueClasses = [
        "array-elemValue",
        value.load !== undefined && 'value-loaded'
      ];
      return (
        <div className={classnames(elemClasses)} key={i}>
          <div className="value-changed">
            {value.prevValue && value.prevValue.toString()}
          </div>
          <div className={classnames(valueClasses)}>
            {value.value && value.value.toString()}
          </div>
          <div className="array-cursors">
            {cursors && cursors.map(c => <span key={c}>{c}</span>)}
            {prevCursors && prevCursors.map(c => <span key={c} className="value-changed">{c}</span>)}
          </div>
        </div>
      );
    };
    const header = (
      <div className="array-decl">
        <span className="array-type">{renderType(elemType, 0)}</span>
        {' '}
        <span className="variable-name">{name}</span>
        {'['}
        {elemCount}
        {'] ='}
      </div>);
    return (
      <Panel className="array-view" header={header}>
        <div className="array-elems clearfix">
          {elems.map(renderArrayElem)}
        </div>
      </Panel>
    );
  };
});

export default function* (deps) {

  yield defineSelector('DirectivesPaneSelector', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  yield defineView('DirectivesPane', 'DirectivesPaneSelector', EpicComponent(self => {

    const Components = {
      showVar: ShowVar,
      showArray: ShowArray
    };

    // XXX

    const renderView = function (view) {
      const {key, kind} = view;
      const Component = Components[kind];
      return (
        <div key={key} className="directive-view clearfix">
          {Component ? <Component view={view}/> : <Panel>Bad component {kind}</Panel>}
        </div>
      );
    };

    self.render = function () {
      const {state, views} = self.props;
      if (!state || state.error) {
        return false;
      }
      return false; // temporarily disabled
      /*
      try {
        return <div className="directive-pane">{views.map(renderView)}</div>;
      } catch (err) {
        return (
          <div className="directive-pane">
            <pre>{err.toString()}</pre>
          </div>
        );
      }
      */
    };

  }));

};
