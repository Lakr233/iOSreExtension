#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# fastSpawn.py
# iOSreExtension
#
# Created by Lakr Aream on 3/6/20.
# Copyright 2020 Lakr Aream. All rights reserved.
#

import os
import sys
import frida
import subprocess

targetDeviceUDID = sys.argv[1]
targetNameOrBundleID = sys.argv[2]

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

def open_target_app(device, name_or_bundleid):

    bundle_identifier = ''
    for application in device.enumerate_applications():
        if name_or_bundleid == application.identifier or name_or_bundleid == application.name:
            bundle_identifier = application.identifier
            break

    # nope! 
    # os.system("frida -f " + bundle_identifier + " --device " + targetDeviceUDID + " --no-pause")
    p = subprocess.Popen(["frida", "-f", bundle_identifier, "--device", targetDeviceUDID, "--no-pause"])
    try:
        p.wait(3)
    except subprocess.TimeoutExpired:
        p.kill()

open_target_app(targetDevice, targetNameOrBundleID)