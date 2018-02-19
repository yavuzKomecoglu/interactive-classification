import React, { Component } from 'react';
import drawImage, {predict, inpaint} from './util.js';
import {Table, TableHeader, TableRowColumn, TableHeaderColumn, TableBody, TableRow} from 'material-ui';
import {canvasRGB} from 'stackblur-canvas';
import './App.css';

class Modified extends Component {
    constructor(props) {
        super(props);

        this.state = {
            results: [],
            image: 'boat.jpg',
            mouseDown: false,
            clickX: [],
            clickY: []
        };
    }

    mouseDown = () => {
       this.setState({
           mouseDown: true,
           clickX: [],
           clickY: []
       }) 
    }

    mouseMove = (evt) => {
        const ctx = this.cDraw.getContext('2d');
        const rect = this.cDraw.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        if (this.state.mouseDown) {
            // Drawing from http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/
            const clickX = this.state.clickX;
            const clickY = this.state.clickY;
            clickX.push(x)
            clickY.push(y)

            ctx.clearRect(0, 0, 227, 227);
  
            ctx.strokeStyle = 'rgba(237, 17, 175, 0.5)';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = this.props.brushSize * 2;

            if (clickX.length > 1) {
                ctx.beginPath();
                ctx.moveTo(clickX[0], clickY[0]);
                for(var i = 1; i < clickX.length; i++) {		
                    ctx.lineTo(clickX[i], clickY[i]);
                }
                ctx.stroke();
            }
        } else {
            ctx.clearRect(0, 0, 227, 227);
  
            ctx.strokeStyle = 'rgba(237, 17, 175, 0.5)';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = this.props.brushSize * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    mouseUp = () => {
        this.setState({
            mouseDown: false
        }) 

        var img = inpaint(this.cImg.getContext('2d'), this.cDraw.getContext('2d'));
        predict(img, this.props.net, function(top) {
            this.setState({
                results: top
            });
        }.bind(this));
    }

    mouseLeave = () => {
       const ctx = this.cDraw.getContext('2d');
       ctx.clearRect(0, 0, 227, 227);
       this.setState({
           mouseDown: false
       }) 
    }

    componentDidMount() {
        this.setState({
            image: 'boat.jpg'
        });
        const ctx = this.cImg.getContext('2d');
        drawImage(ctx, this.props.image, function(img) {
            predict(img, this.props.net, function(top) {
                this.setState({
                    results: top
                });
            }.bind(this));
        }.bind(this));
    }

    componentWillReceiveProps(nProps) {
        if (nProps.reset || nProps.image != this.props.image) {
            const ctx = this.cImg.getContext('2d');
            drawImage(ctx, nProps.image, function(img) {
                predict(img, nProps.net, function(top) {
                    this.setState({
                        results: top
                    });
                }.bind(this));
            }.bind(this));
        } else if (nProps.blur) {
            canvasRGB(this.cImg, 0, 0, 227, 227, this.props.blurSize);
            predict(this.cImg, nProps.net, function(top) {
                this.setState({
                    results: top
                });
            }.bind(this));
        }
        this.props = nProps;
    }

    render() {
        return (
            <div className="box" id="original">
                <h2>Modified Image</h2>
                <canvas id="modified-canvas" height="227px" width="227px" 
                        ref={cImg => this.cImg = cImg}> 
                </canvas>
                <canvas id="draw-canvas" height="227px" width="227px" 
                        ref={cDraw => this.cDraw = cDraw} onMouseDown={this.mouseDown}
                        onMouseMove={this.mouseMove} onMouseUp={this.mouseUp}
                        onMouseLeave={this.mouseLeave}>
                </canvas>
                <Table className="table" selectable={false}>
                    <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
                        <TableRow className="header-row">
                            <TableHeaderColumn>Class</TableHeaderColumn>
                            <TableHeaderColumn>Confidence</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.state.results}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

export default Modified;
