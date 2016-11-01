import electron from 'electron';
const remote = electron.remote;
import React, { Component, PropTypes } from 'react';
import Router from 'react-router';
import classNames from 'classnames';
import util from '../../utils/Util';

class Header extends Component {

    constructor(props) {
        super(props);
        this.state = {
            fullscreen: false,
            updateAvailable: false,
        };
    }

    handleMinimize() {
        remote.getCurrentWindow().minimize();
    }

    handleFullscreen () {
        if (util.isWindows()) {
            if (remote.getCurrentWindow().isMaximized()) {
                remote.getCurrentWindow().unmaximize();
            } else {
                remote.getCurrentWindow().maximize();
            }
            this.setState({
                fullscreen: remote.getCurrentWindow().isMaximized()
            });
        } else {
            remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
            this.setState({
                fullscreen: remote.getCurrentWindow().isFullScreen()
            });
        }
    }

    handleClose() {
        if (util.isWindows()) {
            //remote.getCurrentWindow().close();
            remote.getCurrentWindow().hide();
        } else {
            remote.getCurrentWindow().hide();
        }
    }

    renderWindowButtons () {
        let buttons;
        if (util.isWindows()) {
          buttons = (
            <div className="windows-buttons">
                {/*<div className="windows-button button-minimize enabled" onClick={this.handleMinimize.bind(this)}><div className="icon"></div></div>*/}
                {/*<div className={`windows-button ${this.state.fullscreen ? 'button-fullscreenclose' : 'button-fullscreen'} enabled`} onClick={this.handleFullscreen.bind(this)}><div className="icon"></div></div>*/}
                <div className="windows-button button-close enabled" onClick={this.handleClose}></div>
            </div>
          );
        } else {
          buttons = (
            <div className="buttons">
                <div className="button button-close enabled" onClick={this.handleClose.bind(this)}></div>
                {/*<div className="button button-minimize enabled" onClick={this.handleMinimize.bind(this)}></div>*/}
                {/*<div className="button button-fullscreen enabled" onClick={this.handleFullscreen.bind(this)}></div>*/}
            </div>
          );
        }
        return buttons;
    }

    renderDashboardHeader() {
        
    }

    renderBasicHeader () {
        let headerClasses = classNames({
          bordered: !this.props.hideLogin,
          header: true,
          'no-drag': true
        });
        return (
          <div className={headerClasses}>
            <div className="left-header">
              {util.isWindows () ? null : this.renderWindowButtons()}
            </div>
            <div className="right-header">
              {util.isWindows () ? this.renderWindowButtons() : null}
            </div>
          </div>
        );
    }

    render() {
        if (this.props.hideLogin) {
            return this.renderBasicHeader();
        } else {
            return this.renderDashboardHeader();
        }
    }
}

Header.propTypes = {
};

export default Header;
