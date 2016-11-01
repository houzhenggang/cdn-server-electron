import React from 'react/addons';
import Router from 'react-router';
import Header from './pages/common/Header';
import Sidebar from './pages/common/Sidebar';
import HomePage from './pages/HomePage';
import DeBugPage from './pages/DeBugPage';

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var App = React.createClass({
  render: function () {
    let list = [{
        name: "录制中",
        to : "live",
        className: "fa fa-youtube-play",
        online: true,
    },{
        name: "列表",
        to : "list",
        className: "fa fa-list",
    },{
        name: "调试",
        to : "debug",
        className: "fa fa-bug",
    },{
        name: "日志",
        to : "log",
        className: "fa fa-code",
    },{
        name: "录屏",
        to : "screen",
        className: "fa fa-tachometer",
    }];

    return (
        <div>
            <div className="main-container ">
                <Header title="视频缓存加速" hideLogin={true}/>
                <div className="content-container ">
                    <div className="list">
                        <RouteHandler />
                    </div>
                </div>
            </div>
        </div>
      );
    }
});

var routes = (
    <Route name="app" path="/" handler={App}>
        <Route name="live" path="/" handler={HomePage}/>
        <Route name="list" handler={HomePage}/>
        <Route name="debug" handler={DeBugPage}/>
        <Route name="log" handler={HomePage}/>
        <Route name="screen" handler={HomePage}/>
        <Route name="setting" handler={HomePage}/>
    </Route>
);

module.exports = routes;
