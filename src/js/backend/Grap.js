import fetch from 'node-fetch';
import fs from 'fs';

class MCrul {

    constructor(options){
        this.timeout = 5000;
        this.taskNum = 5;
        this.tasks = [];
        this._running = [];
    }

    addTask(task){
        this.tasks.push(task);
    }

    setTaskList(tasks){
        this.tasks = tasks;
    }

    runTask(task){
        if(task){
            var self = this;
            return new Promise(function(resolve, reject){
                fetch(task.url, task.options || {}).then((response)=>{
                    if(response.ok){
                        resolve(response);
                    }else{
                        reject(response);
                    }
                    /*callback(response, task).then((result)=>{
                        if(result !== false){
                            var newTask = self.getNextTask();
                            if(newTask){
                                newTask.info.thread = task.info.thread;
                                self.runTask(newTask, callback);
                            }
                        }
                    });*/
                });
            })
        }
    }

    getNextTask(){
        return this.tasks.shift();
    }

    run(taskNum, callback){
        var self = this;
        return new Promise(function(resolve, reject){
            for (var i = 0; i < self.taskNum; i++) {
                var task = self.tasks.shift();
                task.info.thread = i;
                self.runTask(task).then((response)=>{
                    callback(response, task).then((result)=>{
                        if(result !== false){
                            var newTask = self.getNextTask();
                            if(newTask){
                                newTask.info.thread = task.info.thread;
                                self.runTask(newTask);
                            }
                        }
                    });
                });
            };
        })
    }

}

class Grap {

    constructor(options){
        this.redo = 3;
        this.chunk = 0.5*1024*1024;
        this.timeout = 5000;
    }

    down(url, saveFile, flags, mode){
        flags = typeof(flags) === "undefined" ? "w" : flags;
        mode = typeof(mode) === "undefined" ? "0777" : mode;
        try{
            var self = this;
            this.getRemoteFileSize(url).then((response)=>{
                var size = response.headers.get("content-length");
                var n = Math.ceil(size / self.chunk);
                var list = [];
                for (var i = 1; i <= n; i++) {
                    var start = i==1 ? 0 : ((i-1)*self.chunk+1);
                    var end = i==n ? size : (i*self.chunk);
                    var item = {
                        url: url,
                        info: {
                            index: i,
                            start: start,
                            end: end
                        },
                        options: {
                            headers: {
                                Range: "bytes=" + start + "-" + end
                            },
                            method: "GET",
                            timeout: self.timeout
                        }
                    }
                    list.push(item);
                };
                var mcurl = new MCrul();
                mcurl.setTaskList(list);
                var fd = fs.openSync(saveFile, flags, mode);
                console.time("start");
                mcurl.run(5, function(response, task){
                    return new Promise(function(resolve, reject){
                        console.info("【响应】线程：",task.info.thread, "，任务：", task.info.index);
                        self.fetch(response).then((buffer)=>{
                            fs.writeSync(fd, buffer, 0, response.headers.get("content-length"), task.info.start);
                            console.info("【完成】线程：",task.info.thread, "，任务：", task.info.index);
                            resolve(true);
                        });
                    })
                });
                console.timeEnd("start");
            }, (response)=>{
                console.error(response.status, response.statusText)
            });
        }catch(e){
            
        }

    }

    getRemoteFileSize(url, parentResolve, parentReject){
        var self = this;
        self.redo--;
        return fetch(url).then((response)=>{
            return new Promise(function(resolve, reject){
                parentResolve = typeof(parentResolve) === 'undefined' ? resolve : parentResolve;
                parentReject = typeof(parentReject) === 'undefined' ? reject : parentReject;
                if(response.ok){ 
                    return parentResolve(response);
                }else if(self.redo > 0){
                    self.getRemoteFileSize(url, parentResolve, parentReject);
                }else{
                    return parentReject(response)
                }
            })
        })
      
    }

    fetch(response){
        return new Promise((resolve, reject) => {
            const bufs = [];
            const readable = response.body;
            readable.on('data', (b) => {
                bufs.push(b);
            });
            readable.on('end', () => {
                resolve(Buffer.concat(bufs));
            });
            readable.on('error', (e) => {
                reject(e);
            });
        });
    }

}

module.exports = Grap
