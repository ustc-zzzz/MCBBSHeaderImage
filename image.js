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
    try {
      return fs.createReadStream(__dirname + '/images/software-mojang-' + status.authserver + '.png');
    } catch (e) {
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
    var ctx = new canvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx;
  }).then(function (ctx) {
    return state.getMinecraftVersions().then(function (data) {
      return state.getSoftwareViews().then(function (text) {
        text = '' + text;
        ctx.font = '20px Microsoft Yahei';
        ctx.fillStyle = '#fbf2db';
        ctx.fillText(text, 178 - 6 * text.length, 28); // magic numbers
        ctx.font = '17px Microsoft Yahei';
        ctx.fillText('Minecraft ' + data.stable, 522, 27); // magic numbers
        ctx.fillText('Minecraft ' + data.snapshot, 714, 27); // magic numbers
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
    var ctx = new canvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    return ctx;
  }).then(function (ctx) {
    return state.getSaleStats().then(function (data) {
      return state.getDevelopmentViews().then(function (text) {
        text = '' + text;
        ctx.font = '20px Microsoft Yahei';
        ctx.fillStyle = '#fbf2db';
        ctx.fillText(text, 178 - 6 * text.length, 28); // magic numbers
        ctx.font = '17px Microsoft Yahei';
        ctx.fillText(data.total.toLocaleString('en'), 548, 27); // magic numbers
        ctx.fillText(data.last24h.toLocaleString('en'), 826, 27); // magic numbers
        return ctx;
      });
    });
  }).then(function (ctx) {
    return ctx.canvas.pngStream();
  });
}

module.exports = {
  drawDirect: drawDirect,
  drawSoftwareHeader: drawSoftwareHeader,
  drawDevelopmentHeader: drawDevelopmentHeader,
  drawSoftwareMojangState: drawSoftwareMojangState,
  increaseSoftwareViews: state.increaseSoftwareViews,
  increaseDevelopmentViews: state.increaseDevelopmentViews
}
