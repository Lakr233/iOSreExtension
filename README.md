# iOSreExtension README

A fast and elegant extension for VSCode used for iOSre projects.

## Suggest Theme

- Huacat Pink Theme

This is the development used theme, with all svg image resources used uder the same theme

## Features

A powerfull tool for iOSre projects.

![Hi](https://github.com/Co2333/iOSreExtension/raw/master/images/main.png)

## Requirements

There are some tools that you need to install on your own listed below.
- Frida (both macOS & iOS)
- libimobiledevice
- sshpass

## Manually Install

- brew install -v --HEAD --build-from-source usbmuxd libimobiledevice
- brew uninstall --ignore-dependencies libimobiledevice usbmuxd
- cd $HOME/.vscode/extensions
- git clone https://lab.qaq.wiki/Lakr233/iOSreExtension.git
- cd iOSreExtension
- pip3 install -r ./requirements.txt
- npm install
- npm run compile

## Extension Settings

There should be none confuguration hiding away from GUI so go and select that camera then you will find out.


**Enjoy!**
