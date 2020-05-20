# iOSreExtension

A fast and elegant extension for VSCode used for iOSre projects.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Co2333/iOSreExtension/pulls)
[![Platform](https://img.shields.io/badge/Platform-%20macOS%20-brightgreen.svg)](https://github.com/Co2333/iOSreExtension/projects/1)


#### [Open In VSC Market Place](https://marketplace.visualstudio.com/items?itemName=Lakr233.wikiqaqiosre)

## Recommended Packages to Install with

- Huacat Pink Theme
- [xia0LLDB](https://github.com/4ch12dy/xia0LLDB)

## Contributor

Contributor in this project may not show in commit history due to sync with my private GitLab instance for CI/CD operations, but will be listed here. 

- [@Lakr233](https://twitter.com/Lakr233)
- [onewayticket255](https://github.com/onewayticket255)
- [@Anonymous](https://twitter.com/wang_liangc)

## Features

A powerfull tool for iOSre projects, but must be some tall to ride or you will panic your device running some you dont know shell command. With great power comes great responsibility, just like what we are doing with root/kernel permission. If you really did to panic your deivce, 🎉, navigate to issue tab and lets have a talk.

![Hi](https://github.com/Co2333/iOSreExtension/raw/master/images/main.png)

- [x] Multiple iOS device management
- [x] Save device configurations
- [x] Applications management - launch, debug, decrypt...
- [x] Obtain applications information
- [x] Remote file management over SSH
- [x] Remote file editing
- [x] Some useful tools like copy device information, install deb packages...

## Requirements

There are some tools that you need to install on your own listed below. Again, must be some tall to ride 🐎.

- Xcode command line tools (Swift runtime and developer image is required)
- Frida (both on macOS with pip & iOS with deb package from build.frida.re)
- NEWEST libimobiledevice, iproxy (installed with brew from source)
- sshpass
- python3 and pip3 with requirements located at [requirements.txt](./requirements.txt)


Command line tips are below, remember to download [requirements.txt](./requirements.txt) and install Xcode CLI on your own.


- brew uninstall --ignore-dependencies libimobiledevice usbmuxd
- brew install -v --HEAD --build-from-source usbmuxd libimobiledevice
- brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb
- pip3 install -r ./requirements.txt

-> If you want to develop this extension, clone to somewhere else then ~/.vscode otherwise it would be replaced by VSC market place automatically and our binpack would be messed.

## Extension Settings

There should be none confuguration hiding away from GUI so go and select that camera then you will find out.

## Road Maps

Check out our GitHub Project page for help-wanted features.

2020-05-20 Lakr Aream
