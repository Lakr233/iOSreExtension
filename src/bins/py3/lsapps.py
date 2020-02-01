#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Author : Lakr Aream, AloneMonkey(frida-iOS-dump)
# me 233:       https://www.qaq.wiki, Twitter: @Lak233
# big uncle:    http://www.alonemonkey.com

# 非常感谢庆总让iOS逆向的门槛降低到无脑级别

import sys
import codecs
import frida
import threading
import os
import shutil
import time
import argparse
import tempfile
import subprocess
import re

import paramiko
from paramiko import SSHClient
from scp import SCPClient
from tqdm import tqdm
import traceback

if (len(sys.argv) < 2):
    print("-> ./lsapps.py [iDevices UDID]")

