'use strict'

var sqlite3 = require('sqlite3');
var rp = require('request-promise');

var saleStats = {}, versions = {}, mojangStatus = {}, lastUpdateTime = 0;
var timeInterval = 60000;

var viewsDatabase, waitUntilOpen = new Promise(function (resolve, reject) {
  var mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
  viewsDatabase = new sqlite3.Database(__dirname + '/views.db', mode, function (err) {
    if (err) reject(err); else resolve();
  });
}).then(function () {
  return new Promise(function (resolve, reject) {
    var sql = 'CREATE TABLE IF NOT EXISTS software (date INTEGER(32) PRIMARY KEY, count INTEGER(32) DEFAULT 0);';
    viewsDatabase.run(sql, [], resolve);
  });
}).then(function () {
  return new Promise(function (resolve, reject) {
    var sql = 'CREATE TABLE IF NOT EXISTS development (date INTEGER(32) PRIMARY KEY, count INTEGER(32) DEFAULT 0);';
    viewsDatabase.run(sql, [], resolve);
  });
}).then(function () {
  return new Promise(function (resolve, reject) {
    var sql = 'CREATE TABLE IF NOT EXISTS qnada (date INTEGER(32) PRIMARY KEY, count INTEGER(32) DEFAULT 0);';
    viewsDatabase.run(sql, [], resolve);
  });
});

function getApproximateTimeStamp () {
  var timeDiff = 28800000; // UTC+8
  return Math.floor((Date.now() + timeDiff) / 86400000) * 86400 - timeDiff / 1000;
}

function updateStats () {
  function updateUntilItIsOK (times) {
    return Promise.all([rp({
      method: 'POST',
      uri: 'https://api.mojang.com/orders/statistics',
      body: {metricKeys: ['item_sold_minecraft', 'prepaid_card_redeemed_minecraft']},
      json: true
    }), rp({
      uri: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
      json: true
    }), rp({
      uri: 'https://status.mojang.com/check',
      json: true
    })]).then(function (data) {
      saleStats = data[0];
      var minecraftVersions = data[1].versions;
      versions.stable = versions.snapshot = undefined;
      for (var i in minecraftVersions) {
        var type = minecraftVersions[i].type;
        if (type === 'release' && !versions.stable) versions.stable = minecraftVersions[i].id;
        if (type === 'snapshot' && !versions.snapshot) versions.snapshot = minecraftVersions[i].id;
        if (versions.stable && versions.snapshot) break;
      }
      var statusCollection = data[2];
      for (var i in statusCollection) {
        var json = statusCollection[i];
        if (json['authserver.mojang.com']) {
          mojangStatus['authserver'] = json['authserver.mojang.com'];
          break;
        }
      }
      lastUpdateTime = Date.now();
      return null;
    }).catch(function (err) {
      if (times > 0) {
        return updateUntilItIsOK(times - 1);
      }
      lastUpdateTime = Date.now();
      return Promise.resolve(null);
    });
  }
  if (Math.floor(lastUpdateTime / timeInterval) < Math.floor(Date.now() / timeInterval)) {
    var promise = updateUntilItIsOK(3);
    if (lastUpdateTime === 0) {
      return promise;
    } else {
      lastUpdateTime = Date.now();
    }
  }
  return Promise.resolve(null);
}

function getMinecraftVersions () {
  return updateStats().then(function () {
    return versions;
  });
}

function getMojangAuthStatus () {
  return updateStats().then(function () {
    return mojangStatus;
  });
}

function getSaleStats () {
  return updateStats().then(function () {
    return saleStats;
  });
}

function getSoftwareViews () {
  return getViews('software');
}

function getDevelopmentViews () {
  return getViews('development');
}

function getQandaViews () {
  return getViews('qanda');
}

function increaseSoftwareViews () {
  return increaseViews('software');
}

function increaseDevelopmentViews () {
  return increaseViews('development');
}

function increaseQandaViews () {
  return increaseViews('qanda');
}

function increaseViews (tableName) {
  return new Promise(function (resolve, reject) {
    var date = getApproximateTimeStamp();
    var sql = 'INSERT OR IGNORE INTO ' + tableName + '(date) VALUES(?)';
    viewsDatabase.run(sql, [date], function (err) {
      if (err) reject(err); else {
        var sql = 'UPDATE ' + tableName + ' SET count=count+1 WHERE date=?';
        viewsDatabase.run(sql, [date], function (err) {
          if (err) reject(err); else resolve();
        });
      }
    })
  });
}

function getViews (tableName) {
  return new Promise(function (resolve, reject) {
    var sql = 'SELECT count FROM ' + tableName + ' WHERE date=?';
    viewsDatabase.get(sql, [getApproximateTimeStamp()], function (err, row) {
      if (err) reject(err); else resolve(row ? row.count : 1);
    });
  });
}

module.exports = {
    getSaleStats: getSaleStats,
    getSoftwareViews: getSoftwareViews,
    getDevelopmentViews: getDevelopmentViews,
    getQandaViews: getQandaViews,
    getMojangAuthStatus: getMojangAuthStatus,
    getMinecraftVersions: getMinecraftVersions,
    increaseSoftwareViews: increaseSoftwareViews,
    increaseDevelopmentViews: increaseDevelopmentViews,
    increaseQandaViews: increaseQandaViews
};
