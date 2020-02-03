# iOSreExtension

A fast and elegant extension for VSCode used for iOSre projects.

# [Open In VSC Market Place](https://marketplace.visualstudio.com/items?itemName=Lakr233.wikiqaqiosre)

## Suggest Theme

- Huacat Pink Theme

This is the development used theme, with all svg image resources used uder the same theme

## Features

A powerfull tool for iOSre projects.

![Hi](https://github.com/Co2333/iOSreExtension/raw/master/images/main.png)

## Requirements

There are some tools that you need to install on your own listed below.
- Frida (both macOS & iOS)
- newest libimobiledevice, iproxy, see Manually Install for instructions.
- sshpass
- python3 and pip3, with depends at https://github.com/Co2333/iOSreExtension/blob/master/requirements.txt

## Manually Install

- brew uninstall --ignore-dependencies libimobiledevice usbmuxd
- brew install -v --HEAD --build-from-source usbmuxd libimobiledevice
- brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb
- cd $HOME/.vscode/extensions
- git clone https://github.com/Co2333/iOSreExtension.git
- cd iOSreExtension
- pip3 install -r ./requirements.txt
- npm install
- npm run compile

!! Manually Install may be replaced by M$ market repack automaticly by vsc

## Extension Settings

There should be none confuguration hiding away from GUI so go and select that camera then you will find out.

**Enjoy!**
