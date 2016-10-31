import React, { Component, PropTypes } from 'react';
import {Link} from 'react-router';

class Menubar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menus: props.menus,
        };
    }
    render() {
        let menus = this.state.menus;
        return (
            <ul className="nav nav-pills nav-stacked">
            {
                menus.map(function (menu) {
                    return (
                        <div class="">
                            <li><Link to={ menu.to } className={ menu.className } > { menu.name } </Link></li>
                            { menu.children ? <Menubar menus={ menu.children } /> : null }
                        </div>
                    )
                })
            }
            </ul>
        )
    }
}


export default Menubar;
