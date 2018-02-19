import React from 'react';
import {Array3D, ENV} from 'deeplearn';
import {InpaintTelea} from './inpaint';
import {TableRow, TableRowColumn} from 'material-ui';

export function drawImage(ctx, src, callback) {
    var img = new Image(227, 227);
    img.src = src;

    img.onload = function () {
        ctx.clearRect(0, 0, 227, 227);
        ctx.drawImage(img, 0, 0);
        callback(img);
    }
}

export function predict(img, net, callback) {
    const pixels = Array3D.fromPixels(img);
    var math = ENV.math;

    var t0 = performance.now();
    const resAll = net.predictWithActivation(pixels, 'conv10');
    // WIP for class activation mapping
    /*
    var im = math.slice3D(resAll.activation, [0,0,0], [13, 13, 1]).as2D(13, 13);
    im.data().then((d) => {
        var imgArr = Int16Array.from(d);
        var max = Math.max.apply(Math, imgArr);
        var min = Math.min.apply(Math, imgArr);
        var normed = imgArr.map(function(d) {
            return ((d - min)/max) * 225;
        })
        console.log(normed);
    });
    */
    const res = resAll.logits;
    
    var top = [];
    net.getTopKClasses(res, 5).then((topK) => {
        console.log('Classification took ' + parseFloat(Math.round(performance.now() - t0)) + ' milliseconds');
        for (const key in topK) {
            top.push(
                <TableRow key={key}>
                    <TableRowColumn style={{wordWrap: 'break-word', whiteSpace: 'normal'}}>{key}</TableRowColumn>
                    <TableRowColumn>{(topK[key]*100.0).toFixed(2)}%</TableRowColumn>
                </TableRow>);
        }
        callback(top);
    });
}

export function inpaint(iCtx, dCtx, ) {
    var mask = dCtx.getImageData(0, 0, 227, 227);
    var img = iCtx.getImageData(0, 0, 227, 227);

    var mask_u8 = new Uint8Array(227 * 227);
    for(var n = 0; n < mask.data.length; n+=4){
        if (mask.data[n] > 0) {
            mask_u8[n/4] = 1;
        } else {
            mask_u8[n/4] = 0;
        }
    }

    for(var channel = 0; channel < 3; channel++){
        var img_u8 = new Uint8Array(227*227)
        for(n = 0; n < img.data.length; n+=4){
            img_u8[n / 4] = img.data[n + channel]
        }
        InpaintTelea(227, 227, img_u8, mask_u8)
        for(var i = 0; i < img_u8.length; i++){
            img.data[4 * i + channel] = img_u8[i]
        }	
    }
    for(i = 0; i < img_u8.length; i++){
        img.data[4 * i + 3] = 255;
    }
    dCtx.clearRect(0, 0, 227, 227);
    iCtx.putImageData(img, 0, 0);
    return img;
}

export default drawImage;