const electron = require('electron');
const remote = electron.remote;
import React, { Component, PropTypes } from 'react';
import cx from 'classnames';
import event from '../../backend/event';
import Lang from '../../backend/language';
import Router, {Link} from 'react-router';
const settingsWindow = remote.getGlobal('settingsWindow');

class Sidebar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeIndex: 0,
        }
    }

    componentWillReceiveProps (nextProps) {
       
    }

    handleSettingsClick () {
        if (!settingsWindow.isVisible()) {
            settingsWindow.show();
        }
        if (settingsWindow.isMinimized()) {
            settingsWindow.restore();
        }
        settingsWindow.focus();
        //setDockIconVisibility();
    }

    handleClickLink(index){
        this.setState({activeIndex: index});
    }

    __renderSidebarItem (item, index) {
        const activeIndex = this.state.activeIndex;
        //const { active, onEdit, onClick, onRemove } = this.props;
        /*const classNames = cx({
            'sidebar-item': true,
            'active': active,
        });*/
        return (
            <div className="sidebar-item" >
                <div className="content">
                    <p className={ activeIndex === index ? 'name active' : 'name' }>
                        <Link to={item.to} className={item.className} onClick={this.handleClickLink.bind(this, index)}></Link>
                    </p>
                </div>
            </div>
        );
    }

    render() {
        const sidebarItems = this.props.list.map((item, index) => {
            return this.__renderSidebarItem(item, index);
        });
        return (
            <div className="sidebar">
                <div className="sidebar-list">
                    { sidebarItems }
                </div>
                <div className="sidebar-bottom">
                    <div className="actions">
                        <Link to="setting"> <i className="iconfont settings">&#xe605;</i> </Link>
                    </div>
                </div>
            </div>
        );
    }
}

Sidebar.propTypes = {
    list: PropTypes.array
};

export default Sidebar;
