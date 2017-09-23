#!/bin/bash

cd $(dirname $0)

git pull https://github.com/ustc-zzzz/MCBBSHeaderImage.git master:master
git checkout master 2&>1 >/dev/null

echo $(realpath index.js)
forever stop -a -l mcbbs-header-image.log $(realpath index.js)
forever start -a -l mcbbs-header-image.log $(realpath index.js)
