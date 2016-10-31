import React from 'react';
const remote = require('electron').remote

class DebugPage extends React.Component {
    
    constructor(props) {
        super(props);
        remote.getCurrentWindow().webContents.openDevTools()
    }

    componentDidMount() {
        
    }

	render() {
		return (
			<h1>DebugPage</h1>
		);
	}
}

export default DebugPage;
