import sys
import os
import json

basepath = sys.argv[1]
files= os.listdir(basepath) 
dirlist = []
filelist = []
for file in files: 
   path=os.path.join(basepath,file)
   if not os.path.isdir(path):
      filelist.append(file)
   else:
      dirlist.append(file)   
   
print(json.dumps([dirlist,filelist]))