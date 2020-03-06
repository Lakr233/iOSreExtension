#!/bin/bash
cd "$(dirname "$0")"
 
mkdir ./bins

cp -r ./iOS ./bins
cp -r ./local ./bins
cp -r ./py3 ./bins

zip -r ./bin.zip ./bins
echo $(base64 ./bin.zip) > ./bincodes.txt

rm -f ./bin.zip
rm -rf ./bins