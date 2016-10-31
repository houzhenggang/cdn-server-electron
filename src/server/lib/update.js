const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const request = require('request');
const JSZip = require('jszip');
const util = require('./util');
const config = require('../config');

const isNewVersion = (v1, v2) => {
    if (v1 != v2) {
        var v1slices = v1.split('.');
        var v2slices = v2.split('.');
        var length = Math.min(v1slices.length, v2slices.length);
        for (var i = 0; i < length; i++) {
            var v1clip = parseInt(v1slices[i]);
            var v2clip = parseInt(v2slices[i]);
            if (isNaN(v2clip) || v1clip > v2clip) {
                return false;
            } else if (v1clip < v2clip) {
                return true;
            }
        }
    }
    return false;
}

const requestUrl = (url) => {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            headers: {
                'User-Agent': 'http://developer.github.com/v3/'
            }
        }, (error, response, body) => {
            return resolve(body);
        });
    })
}

const downloadUrl = (url) => {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            headers: {
                'User-Agent': 'http://developer.github.com/v3/'
            }
        }).on("response", (response) => {
            const bufs = [];
            response.on('data', (b) => {
                bufs.push(b);
            });
            response.on('end', () => {
                resolve(Buffer.concat(bufs));
            });
            response.on('error', (e) => {
                reject(e);
            });
        });
    })
}

const checkUpdate = (showNoUpdateFoundDialog) => {
    return requestUrl(config.APP_RELEASES_URL).then((json) => {
        const releases = JSON.parse(json).sort((A, B) => B.id - A.id);
        const latestRelease = releases[0];
        if (!latestRelease || !latestRelease.tag_name) {
            return Promise.reject(new Error('Cannot find valid latest release'));
        }
        const latestVersion = latestRelease.tag_name[0] === 'v' ?
                              latestRelease.tag_name.slice(1) :
                              latestRelease.tag_name;
        if (isNewVersion(config.APP_VERSION, latestVersion)) {
                return Promise.resolve(latestRelease);
        } 
        return Promise.resolve(null);
    }).catch((e) => {
        util.logger(e);
        return Promise.resolve(null);
    });
}

const downloadUpdate = (release) => {
    var corePackage = null;
    if (!release) {
        return Promise.resolve(null);
    }
    try {
        const assets = release ? release.assets : [];
        for (var asset of assets) {
            if (asset.name === 'core.zip') {
                corePackage = asset;
                break;
            }
        }
    } catch (e) {}
    if (corePackage) {
        return downloadUrl(corePackage.browser_download_url).then((buffer) => {
            const zip = new JSZip(buffer);
            if (!zip || !zip.files) {
                return Promise.reject(new Error('Invalid update zip file!'));
            }
            return Promise.resolve(zip);
        }).catch((e) => {
            util.logger(e);
            return Promise.resolve(null);
        });
    } else {
        return Promise.resolve(null);
    }
}

const writeFile = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, function(error){
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        })
    })
})

const applyUpdate = (zip) => {
    if (!zip) {
        return Promise.resolve(false);
    }
    const promises = [];
    const files = zip.files;
    for (var filename in files) {
        if (files.hasOwnProperty(filename)) {
            const file = files[filename];
            if (file.dir) {
                mkdirp.sync(path.join(global.__dirname, filename));
            } else {
                const buffer = files[filename].asNodeBuffer();
                promises.push(writeFile(path.join(global.__dirname, filename), buffer));
            }
        }
    }
    return Promise.all(promises).then(() => {
        return Promise.resolve(true);
    }).catch((e) => {
        util.logger(e);
        return Promise.resolve(false);
    });
}


module.exports = function (interactive) {
    checkUpdate(interactive)
        .then(downloadUpdate)
        .then(applyUpdate)
        .then((result) => {
            if (result) {
                terminate();
            }
        });
};