'use strict'

var fs = require('fs');
var path = require('path');
var state = require('./state');
var canvas = require('canvas');

// returns a promise which will contain a png
function drawDirect (fileName) {
  return new Promise(function (resolve, reject) {
    resolve(fs.createReadStream(path.join(__dirname, 'images', fileName)));
  });
}

// returns a promise which will contain a png
function drawSoftwareMojangState () {
  return state.getMojangAuthStatus().then(function (status) {
    if (status.authserver) {
      return fs.createReadStream(__dirname + '/images/software-mojang-' + status.authserver + '.png');
    } else {
      return fs.createReadStream(__dirname + '/images/software-mojang.png');
    }
  });
}

// returns a promise which will contain a png
function drawSoftwareHeader () {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + '/images/software-header.png', function (err, data) {
      if (err) reject(err); else resolve(data);
    });
  }).then(function (data) {
    var img = new canvas.Image();
    img.src = data;
    var ctx = new canvas.Canvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx;
  }).then(function (ctx) {
    return state.getMinecraftVersions().then(function (data) {
      return state.getSoftwareViews().then(function (text) {
        text = '' + text;
        ctx.font = '18px DejaVu Sans';
        ctx.fillStyle = '#fbf2db';
        ctx.fillText(text, 177 - 5 * text.length, 27); // magic numbers
        ctx.font = '16px DejaVu Sans';
        ctx.fillText(data.stable ? 'Minecraft ' + data.stable : 'Unknown', 522, 27); // magic numbers
        ctx.fillText(data.snapshot ? 'Minecraft ' + data.snapshot : 'Unknown', 714, 27); // magic numbers
        return ctx;
      });
    });
  }).then(function (ctx) {
    return ctx.canvas.pngStream();
  });
}

// returns a promise which will contain a png
function drawDevelopmentHeader () {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + '/images/development-header.png', function (err, data) {
      if (err) reject(err); else resolve(data);
    });
  }).then(function (data) {
    var img = new canvas.Image();
    img.src = data;
    var ctx = new canvas.Canvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx;
  }).then(function (ctx) {
    return state.getSaleStats().then(function (data) {
      return state.getDevelopmentViews().then(function (text) {
        text = '' + text;
        ctx.font = '18px DejaVu Sans';
        ctx.fillStyle = '#fbf2db';
        ctx.fillText(text, 177 - 5 * text.length, 27); // magic numbers
        ctx.font = '16px DejaVu Sans';
        ctx.fillText(data.total ? data.total.toLocaleString('en') : '-', 542, 27); // magic numbers
        ctx.fillText(data.last24h ? data.last24h.toLocaleString('en') : '-', 820, 27); // magic numbers
        return ctx;
      });
    });
  }).then(function (ctx) {
    return ctx.canvas.pngStream();
  });
}

function drawQandaHeader () {
  return new Promise(function (resolve, reject) {
    fs.readFile(__dirname + '/images/qanda-header.png', function (err, data) {
      if (err) reject(err); else resolve(data);
    });
  }).then(function (data) {
    var img = new canvas.Image();
    img.src = data;
    var ctx = new canvas.Canvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx;
  }).then(function (ctx) {
      return state.getQandaViews().then(function (text) {
        text = '' + text;
        ctx.font = '30px DejaVu Sans';
        ctx.fillStyle = '#000000';
        ctx.fillText(text, 95 - 10 * text.length, 70); // magic numbers
        return ctx;
      });
  }).then(function (ctx) {
    return ctx.canvas.pngStream();
  });
}


module.exports = {
  drawDirect: drawDirect,
  drawSoftwareHeader: drawSoftwareHeader,
  drawQandaHeader: drawQandaHeader,
  drawDevelopmentHeader: drawDevelopmentHeader,
  drawSoftwareMojangState: drawSoftwareMojangState,
  increaseSoftwareViews: state.increaseSoftwareViews,
  increaseDevelopmentViews: state.increaseDevelopmentViews,
  increaseQandaViews: state.increaseQandaViews
}
