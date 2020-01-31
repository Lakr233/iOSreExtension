#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Author : Lakr Aream, AloneMonkey(frida-iOS-dump)
# me 233:       https://www.qaq.wiki, Twitter: @Lak233
# big uncle:    http://www.alonemonkey.com

# 非常感谢庆总让iOS逆向的门槛降低到无脑级别

import frida

def get_usb_iphone():
    Type = 'usb'
    if int(frida.__version__.split('.')[0]) < 12:
        Type = 'tether'
    device_manager = frida.get_device_manager()
    devices = [dev for dev in device_manager.enumerate_devices() if dev.type == Type]

    it = iter(devices)
    for item in it:
        print(item.id)

    return

get_usb_iphone()