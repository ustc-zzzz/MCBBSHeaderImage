'use strict'

var fs = require('fs');
var logger = require('morgan');
var image = require('./image');
var express = require('express');

var app = express(), router = express.Router();

var uaFilter = /^Mozilla\/\S*\ /
var softwareRefererFilter = /^https?:\/\/(www\.mcbbs\.net|mcbbs\.net|mcbbs\.tvt\.im)\/forum\-software/;
var developmentRefererFilter = /^https?:\/\/(www\.mcbbs\.net|mcbbs\.net|mcbbs\.tvt\.im)\/forum\-development/;

var developmentFileMap = {
  'post.png': image.drawDirect.bind(image, 'development-post.png'),
  'applications.png': image.drawDirect.bind(image, 'development-applications.png'),
  'rule.png': image.drawDirect.bind(image, 'development-rule.png'),
  'recommendation.png': image.drawDirect.bind(image, 'recommendation-list.png'),
  'tips.png': image.drawDirect.bind(image, 'development-tips.png'),
  'header.png': function (isRealVisit) {
    if (isRealVisit) {
      return image.increaseDevelopmentViews().then(image.drawDevelopmentHeader);
    } else {
      return image.drawDevelopmentHeader();
    }
  }
};

var softwareFileMap = {
  'post.png': image.drawDirect.bind(image, 'software-post.png'),
  'download.png': image.drawDirect.bind(image, 'software-download.png'),
  'rule.png': image.drawDirect.bind(image, 'software-rule.png'),
  'recommendation.png': image.drawDirect.bind(image, 'recommendation-list.png'),
  'mojang.png': image.drawSoftwareMojangState.bind(image),
  'header.png': function (isRealVisit) {
    if (isRealVisit) {
      return image.increaseSoftwareViews().then(image.drawSoftwareHeader);
    } else {
      return image.drawSoftwareHeader();
    }
  }
};

var ipRecords = {}, maxVisitsInPeriod = 60, period = 600000; // milliseconds

function isThisIPVisitsTooFrequently (ip) {
  var visitRecords = ipRecords[ip];
  var now = Date.now();
  if (!visitRecords) {
    ipRecords[ip] = [now];
    return false;
  } else if (visitRecords.length < maxVisitsInPeriod) {
    visitRecords.push(now);
    return false;
  } else if (visitRecords[0] + period <= now) {
    visitRecords.shift();
    visitRecords.push(now);
    return false;
  } else {
    return true;
  }
}

router.get('/development/:name', function (req, res, next) {
  var name = req.params['name'];
  if (name && developmentFileMap[name]) {
    res.setHeader('Content-Type', 'image/png');
    var isValidUA = uaFilter.test(req.get('User-Agent'));
    var isValidReferer = developmentRefererFilter.test(req.get('Referer'));
    var isThisIPNotRestricted = !isThisIPVisitsTooFrequently(req.ip + '');
    developmentFileMap[name](isValidUA && isValidReferer && isThisIPNotRestricted).then(function (stream) {
      stream.pipe(res);
    }).catch(next);
  } else {
    next();
  }
});

router.get('/software/:name', function (req, res, next) {
  var name = req.params['name'];
  if (name && softwareFileMap[name]) {
    res.setHeader('Content-Type', 'image/png');
    var isValidUA = uaFilter.test(req.get('User-Agent'));
    var isValidReferer = softwareRefererFilter.test(req.get('Referer'));
    var isThisIPNotRestricted = !isThisIPVisitsTooFrequently(req.ip + '');
    softwareFileMap[name](isValidUA && isValidReferer && isThisIPNotRestricted).then(function (stream) {
      stream.pipe(res);
    }).catch(next);
  } else {
    next();
  }
});

app.use(logger('common'));
app.use('/image', router);
app.use(function (req, res, next) {
  res.status(404).end();
});

app.listen(3003);
