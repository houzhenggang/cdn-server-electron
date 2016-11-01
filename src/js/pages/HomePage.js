import fs from 'fs';
import React, { Component } from 'react';
import electron, { ipcRenderer, remote} from 'electron';
import lineReader from 'line-reader';
import config, { APP_VERSION } from '../../server/config';
import update from '../backend/update';
const channel = "selected-save-file-path-directory";
const host = "http://" + remote.getGlobal('host');

class HomePage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            fileSavePath: "",
            bindHost: "",
        };
        this.handlebindHost(true)
    }

    getHostPath(){
        return "C:\\Windows\\System32\\drivers\\etc\\hosts";
    }

    getBindHost(){
        return remote.getGlobal('host').split(":")[0] + " " + config.REMOTE_HOST.replace("http://", "")
    }

    handleSelectFileSavePath(filePath){
        ipcRenderer.send('open-file-dialog', channel);
    }

    handleCheckUpdate(){
        update(true)
    }

    handleClearCache(){
        let value = this.refs.clearCache.getDOMNode().value
        fetch(host + '/clearCache?time='+value).then(function(res) {
            return res.json();
        }).then(function(data) {
            alert(data.message)
        });
    }

    handlebindHost(check){
        let self = this;
        let ip = remote.getGlobal('host').split(":")[0]
        let host = config.REMOTE_HOST.replace("http://", "");
        let hostText = "";
        let setting = false;
        let hostFile = this.getHostPath();
        lineReader.eachLine(hostFile, function(line, last) {
            if(line.indexOf(ip) != -1 && line.indexOf(host) != -1){
                if(check && line.indexOf("#") != 0){
                    self.setState({bindHost: self.getBindHost()})
                    return false
                }
            }else{
                hostText = hostText + line + "\r\n";
            }
            if(last){
                if(check) return false;
                hostText = self.state.bindHost ? hostText : `${hostText}${ip} ${host}\r\n`;
                fs.writeFile(hostFile, hostText, function(err){
                    if(err) console.error(err)
                    else self.setState({bindHost: self.state.bindHost ? "" : self.getBindHost()})
                })
            }
        });
    }

    componentDidMount() {
        let self = this;
        ipcRenderer.removeAllListeners(channel).on(channel, this.setFileSavePath.bind(this));
        this.getRemoteSettingPath(function(value){
            self.setState({fileSavePath: value})
        });
    }

    getRemoteSettingPath(callback){
        fetch(host + '/getFileSavePath').then(function(res) {
            return res.json();
        }).then(function(data) {
            callback(data["path"])
        });
    }

    setFileSavePath(event, path){
        let self = this;
        if(path[0]){
            fetch(host + '/setFileSavePath?value='+path[0]).then(function(res) {
                return res.json();
            }).then(function(data) {
                self.setState({fileSavePath: path[0]});
            });
        }
    }

	render() {
		return (
            <div className="settings-container">
			    <div className="settings">
                    <section id="">
                        <span className="section-title inline"> 当前版本号 </span>
                        <input type="text" className="" disabled value={APP_VERSION} name=""/> 
                        <button className="btn btn-info" onClick={this.handleCheckUpdate.bind(this)}>
                            检查更新
                        </button>
                    </section>
                    <section id="">
                        <span className="section-title inline">文件保存路径</span>
                        <input type="text" className="" disabled value={this.state.fileSavePath} name="fileSavePath"/> 
                        <button className="btn btn-info" onClick={this.handleSelectFileSavePath.bind(this, this.state.fileSavePath)}>
                            选择路径
                        </button>
                    </section>
                    <section id="">
                        <span className="section-title inline"> 清除缓存文件 </span>
                        <select ref="clearCache">
                            <option value="3">3天前的缓存</option>
                            <option value="7">7天前的缓存</option>
                            <option value="all">所有缓存</option>
                        </select> 
                        <button className="btn btn-info" onClick={this.handleClearCache.bind(this)}>
                            清除缓存
                        </button>
                    </section>
                    <section id="">
                        <span className="section-title inline">绑定HOST</span>
                        <input type="text" className="" disabled value={this.state.bindHost} name=""/> 
                        <button className={this.state.bindHost ? "btn btn-info" : "btn"} onClick={this.handlebindHost.bind(this, false)}>
                            {this.state.bindHost ? "取消绑定" : "绑定域名"}
                        </button>
                    </section>
                </div>
            </div>
		);
	}

}

export default HomePage;
