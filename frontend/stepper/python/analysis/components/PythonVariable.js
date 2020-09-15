import * as React from 'react';
import PythonVariableValue from "./PythonVariableValue";

class PythonVariable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            opened: true
        };
    }

    toggleOpened = () => {
        this.setState((state) => ({
            opened: !state.opened
        }));
    }

    render() {
        let classes = 'variable-container';
        if (this.props.value.cur instanceof Sk.builtin.object) {
            if (this.props.value.cur.hasOwnProperty('$d') || this.props.value.cur instanceof Sk.builtin.dict) {
                classes += ' vardecl-object';

                if (this.state.opened) {
                    return (
                        <div className={classes}>
                            <div className="object-toggle" onClick={this.toggleOpened}>
                                <span className="toggle-icon">▾</span>
                                <span className="variable-name">{this.props.name}</span>
                                {' = '}
                            </div>
                            <span className="vardecl-value">
                                <span className="value">
                                    <PythonVariableValue cur={this.props.value.cur} old={this.props.value.old} visited={this.props.visited} opened={this.state.opened} />
                                </span>
                            </span>
                        </div>
                    );
                }

                return (
                    <div className={classes}>
                        <div className="object-toggle" onClick={this.toggleOpened}>
                            <span className="toggle-icon">▸</span>
                            <span className="variable-name">{this.props.name}</span>
                            {' = '}
                            <span className="vardecl-value">
                                <span className="value">
                                    <PythonVariableValue cur={this.props.value.cur} old={this.props.value.old} visited={this.props.visited} opened={this.state.opened} />
                                </span>
                            </span>
                        </div>
                    </div>
                );
            }
        }

        return (
            <React.Fragment>
                <span style={{color: 'transparent'}}>▸</span>
                <span>
                    <span className="variable-name">{this.props.name}</span>
                </span>
                {' = '}
                <span className="vardecl-value">
                    <span className="value">
                        <PythonVariableValue cur={this.props.value.cur} old={this.props.value.old} visited={this.props.visited} opened={this.state.opened} />
                    </span>
                </span>
            </React.Fragment>
        )
    }
}

export default PythonVariable;
