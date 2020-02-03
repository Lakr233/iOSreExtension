#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Author : Lakr Aream, AloneMonkey(frida-iOS-dump)
# me 233:       https://www.qaq.wiki, Twitter: @Lak233
# big uncle:    http://www.alonemonkey.com

# 非常感谢庆总让iOS逆向的门槛降低到无脑级别

import os
import sys
import frida
import base64
import zlib, struct

# Cpoied from @CodeColorist
def encode(buf, width, height):
    """ buf: must be bytes or a bytearray in Python3.x,
        a regular string in Python2.x.
    """

    width_byte_4 = width * 4
    raw_data = b''.join(
        b'\x00' + buf[span:span + width_byte_4]
        for span in range(0, (height - 1) * width_byte_4, width_byte_4)
    )

    def png_pack(png_tag, data):
        chunk_head = png_tag + data
        return (struct.pack("!I", len(data)) +
                chunk_head +
                struct.pack("!I", 0xFFFFFFFF & zlib.crc32(chunk_head)))

    return b''.join([
        b'\x89PNG\r\n\x1a\n',
        png_pack(b'IHDR', struct.pack("!2I5B", width, height, 8, 6, 0, 0, 0)),
        png_pack(b'IDAT', zlib.compress(raw_data, 9)),
        png_pack(b'IEND', b'')])

def tobase64Uri(icon):
    if not icon:
        return None

    assert icon.rowstride == icon.width * 4
    buf = encode(icon.pixels, icon.width, icon.height)
    return 'data:image/png;base64,' + base64.b64encode(buf).decode('ascii')

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
    smallicon = tobase64Uri(app.get_small_icon())
    formatter = app.name + "|" + app.identifier + "|" + str(app.pid) + "|" + smallicon
    print(formatter)

