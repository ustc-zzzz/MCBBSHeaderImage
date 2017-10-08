#!/bin/bash

cd $(dirname $0)

git fetch https://github.com/ustc-zzzz/MCBBSHeaderImage.git
git checkout -B master FETCH_HEAD 2>&1 >/dev/null
npm install

echo $(realpath index.js)
forever stop -a -l mcbbs-header-image.log $(realpath index.js)
forever start -a -l mcbbs-header-image.log $(realpath index.js)
