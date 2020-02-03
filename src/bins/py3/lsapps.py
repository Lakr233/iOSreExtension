#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Author : Lakr Aream, AloneMonkey(frida-iOS-dump)
# me 233:       https://www.qaq.wiki, Twitter: @Lak233
# big uncle:    http://www.alonemonkey.com

# 非常感谢庆总让iOS逆向的门槛降低到无脑级别

import sys
import frida

if (len(sys.argv) < 2):
    print("-> ./lsapps.py [iDevices UDID]")
    exit(-1)

if (len(sys.argv) > 2):
    print("-> ./lsapps.py [iDevices UDID]x1")
    exit(-1)

def get_usb_iphone():
    Type = 'usb'
    if int(frida.__version__.split('.')[0]) < 12:
        Type = 'tether'
    device_manager = frida.get_device_manager()
    devices = [dev for dev in device_manager.enumerate_devices() if dev.type == Type]

    it = iter(devices)
    for item in it:
        if (item.id == sys.argv[1]):
            return item
    print("-> iDevice Not Found")
    exit(-1)

vdev = get_usb_iphone()
try:
    applications = vdev.enumerate_applications()
except Exception as e:
    sys.exit('-> Failed to enumerate applications: %s' % e)

ita = iter(applications)


for app in ita:
    formatter = app.name + "|" + app.identifier + "|" + str(app.pid)
    print(formatter)

