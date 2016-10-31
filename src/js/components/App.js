import React, { Component, PropTypes } from 'react';
import Dropzone from 'react-dropzone';
import dragula from 'react-dragula';

import Titlebar from './Titlebar';

class App extends Component {

    render() {
        
        return (
            <div className="main-container">
                <Titlebar closeAsHide={ true } title="TEST" />
            </div>
        )
    }
};

export default App;
