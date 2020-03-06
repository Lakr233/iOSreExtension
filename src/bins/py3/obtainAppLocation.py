#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# obtainAppLocation.py
# iOSreExtension
#
# Created by Lakr Aream on 3/6/20.
# Copyright 2020 Lakr Aream. All rights reserved.
#

import os
import sys
import frida

targetDeviceUDID = sys.argv[1]
targetPID = int(sys.argv[2])

if (not targetPID) or (not targetDeviceUDID):
    print("./obtainAppLocation device_udid com.bundle.id")
    exit(-1)

def get_usb_iphone():
    Type = 'usb'
    if int(frida.__version__.split('.')[0]) < 12:
        Type = 'tether'
    device_manager = frida.get_device_manager()
    devices = [dev for dev in device_manager.enumerate_devices() if dev.type == Type]

    it = iter(devices)
    for item in it:
        if (item.id == targetDeviceUDID):
            return item
    print("-> iDevice Not Found")
    exit(-1)

targetDevice = get_usb_iphone()

session = targetDevice.attach(targetPID)
if not session:
    print("-> Failed attach")
    exit(-1)

ss = """
console.log(ObjC.classes.NSBundle.mainBundle().bundlePath().toString())
console.log(ObjC.classes.NSProcessInfo.processInfo().environment().objectForKey_("HOME").toString())
"""

script = session.create_script(ss)
script.load()
