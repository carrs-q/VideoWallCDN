# VideoWallCDN
## Install NodeJS and CDN
1. [Download and Install](https://nodejs.org/en/) NodeJs
2. Clone repository 
3. Change in terminal in the directory
4. Change settings in ```./config/config.js```
5. ```npm install``` to download repositories 
6. ```node index.js``` to start Content Deliviery Network

## Startup .bad for Windows Computers 
```bad
@echo off
REM echo Questions to gerberm@qut.edu.au
echo Start CDN script
cd "C:\Users\Development\... PATH to CDN"
cmd /k node index.js  
```
## CDN Files
1. Create folder "cdn" in the root directory (is already in gitignore)
2. Create folder in cdn with the project title e.g. ```./cdn/scenario1```
3. Insert files (names need to fit the given names)

## Clean Up Computer from Files
Unity stores the files in AppData of the current logged in User
These can be removed there
``` C:\Users\USERNAME\AppData\LocalLow\CarrsQ\Simulator Video Controll Center``` 

-> Hint for VR: On some Computers the copy-process takes long, because it is copied over the network interface. To skip this process, you can copy the files directly in the folder, which is ways faster

