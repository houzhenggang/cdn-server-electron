import io from "./io";
import fetch from 'node-fetch';

class MCrul {

    constructor(option){
        const {timeout, taskNum} = options;
        this.timeout = typeof(timeout) === 'undefined' ? 1 : timeout;
        this.taskNum = typeof(taskNum) === 'undefined' ? 5 : taskNum;
        this.tasks = [];
        this._running = [];
    }

    addTask(task){
        this.tasks.push(task);
    }

    setTaskList(tasks){
        this.tasks = tasks;
    }

    run(taskNum){
        for (var i = 0; i < this.taskNum; i++) {
            var task = this.tasks.shift();
            if(task){
                this._exec(task);
            }
        };
    }

    _exec(task){
        return fetch(task.url).then((response) => {
            return Promise.resolve(response.text());
        });
    }
}

module.exports = MCrul;