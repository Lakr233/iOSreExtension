# iOSreExtension

A fast and elegant extension for VSCode used for iOSre projects.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Co2333/iOSreExtension/pulls)
[![Platform](https://img.shields.io/badge/Platform-%20macOS%20-brightgreen.svg)](https://github.com/Co2333/iOSreExtension/projects/1)


# [Open In VSC Market Place](https://marketplace.visualstudio.com/items?itemName=Lakr233.wikiqaqiosre)

## Suggest Packages

- Huacat Pink Theme

    -> It is used on my vsc so that all svg image resources are used uder the same color

- [xia0LLDB](https://github.com/4ch12dy/xia0LLDB)

    -> Just do it

## Contributor

- [@Lakr233](https://twitter.com/Lakr233)
- [onewayticket255](https://github.com/onewayticket255)

## Features

A powerfull tool for iOSre projects.

![Hi](https://github.com/Co2333/iOSreExtension/raw/master/images/main.png)

- [x] List iOS devices
- [x] Save device configurations
- [x] Multiple devices switcher
- [x] List apps that installed on the device
- [x] Get app information
- [x] Attach debuggers to app
- [x] Obtain app bundle and document locations
- [x] Remote open app
- [x] Remote file manager over ssh
- [x] Copy device info
- [x] Small tools 
- [x] Support remote file editing 

## Requirements

There are some tools that you need to install on your own listed below.

- Xcode command line tools (required by bins like lsdevs and providing debuggers like lldb)
- Frida (both macOS & iOS)
- NEWEST libimobiledevice, iproxy, see Manually Install for instructions.
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

!! Manually installed package may be replaced by M$ market repack automaticly by vsc

## Extension Settings

There should be none confuguration hiding away from GUI so go and select that camera then you will find out.

## Road Maps

```
-  Auto inject dylib to app use mobilesubstrate 
-  Install Root Application
-  Install IPA
-  Sign IPA
-  Sign binary
-  Remove signature
  
  
-  .xm code auto completion
-  private framewok header auto dump & import
-  IOKit auto imort
-  include headers from dyld
  
  
-  None Xcode build system for tweak
-  None Xcode build system for binary
-  None Xcode debug system for tweak
-  None Xcode debug system for binary
-  None Xcode debug system for root app
-  Source code level debug
  
  
-  Create MSHook Project
-  Create logos Project
-  Create Root Application Project
  
  
-  A better SFTP client not a wrapper to SSH ls -la
```
  
**Enjoy!**
