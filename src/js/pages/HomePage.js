import React, { Component } from 'react';
import electron, { ipcRenderer, remote} from 'electron';
const channel = "selected-save-file-path-directory";
const host = "http://" + remote.getGlobal('host');

class HomePage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            fileSavePath: "",
        };
    }

    handleSelectFileSavePath(filePath){
        ipcRenderer.send('open-file-dialog', channel);
    }

    componentDidMount() {
        var self = this;
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
        var self = this;
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
			<div className="">
                <section id="">
                    <span className="section-title inline">文件保存路径</span>
                    <input type="text" className="input-file" disabled value={this.state.fileSavePath} name="fileSavePath"/> 
                    <button onClick={this.handleSelectFileSavePath.bind(this, this.state.fileSavePath)}>
                        选择路径
                    </button>
                </section>
            </div>
		);
	}

}

export default HomePage;
