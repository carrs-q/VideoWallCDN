/*

    Setup:
		GoPro should to be USB-Powered

	Check settings System Settings for GoPro module:
		1. sudo apt-get install network-manager
		2. 'nmcli general permissions' (all need to be on yes)
		3. if not yes 'chmod u+s,a-w /usr/bin/nmcli'
*/
'use strict';

var opts;
const express 		= require ('express');
const fs 			= require('fs');
const path 			= require('path');
const bodyParser 	= require('body-parser');
const os 			= require('os');
const request 		= require('request');
const wifi 			= require('node-wifi');
const goPro 		= require('goproh4');

var config 		= require('./config/config.js');

const logDIR 		= __dirname + '\\' +config.log.logFolder+ '\\';
const recordDIR 	= __dirname + '\\' +config.log.researchFolder+ '\\';

const CONNECTMSG = 'connect';
const KEEPALIVEMSG = 'char-write-req 2f 03170101';
const DISCONNECTMSG = 'disconnect';
var btKeepAliveLoop;
var wifiKeepAliveLoop;
var cam;

var headers = {
    'User-Agent':   config.name,
    'Content-Type': config.headers.ContentType
};


if( config.sync.active &&
	config.goPro.connectBT &&
    config.goPro.states.btIsPared && 
    config.goPro.states.keepAlive){
    var { spawn } = require('child_process');
    var cmdProcess = spawn('gatttool', ['-t', 'random', '-b', config.goPro.settings.btmac, '-I']);

    cmdProcess.stdout.on( 'data', data => {
        if(data.toString().includes(config.goPro.settings.btmac) 
            && !config.goPro.states.btIsConnected
            && !config.goPro.states.btConnectTry){
                if(config.goPro.debug){
                    console.log(data.toString());
                }
                else{
                    console.log('Try to reach Bluetooth device');
                }
                config.goPro.states.btConnectTry=true;
            writeToChildProcess(cmdProcess, CONNECTMSG);
        }else if(data.toString().includes('Connection successful')){
            config.goPro.states.btIsConnected=true;
            btKeepAliveLoop=setInterval(keepAlive, config.goPro.settings.btInterval*1000);
            if(config.goPro.debug){
                console.log(data.toString());
            }
            else{
                console.log('BT connected to GoPro ' + config.goPro.settings.name);
            }

            if(config.goPro.connectWifi){
                console.log('Start Wifi searching');
                connectWithGoPro();
            }
        }
        else if(config.goPro.debug){
            console.log(data.toString());
        }
    });

    cmdProcess.stderr.on( 'data', data => {
        console.log( `stderr: ${data}` );
    } );

    cmdProcess.on( 'close', code => {
        console.log( `child process exited with code ${code}` );
    } );
    //Send every 30 Seconds Keep Alive signal
    function keepAlive(){
        if(config.goPro.states.btIsConnected){
            if(config.goPro.debug){
                console.log('Send Keep alive message');
            }
            writeToChildProcess(cmdProcess, KEEPALIVEMSG);
        }
    }
}
function killChildProcesses(){
	cam.ready()
	.then(()=>{
            return cam.set(72, 1); //LCD Display OFF
	});
        console.log('Bye Bye keep alive');
        writeToChildProcess(cmdProcess, DISCONNECTMSG);
        cmdProcess.stdin.end();
        cmdProcess.kill();
        clearInterval(btKeepAliveLoop);
}

async function writeToChildProcess(childProcess, execCmd){
    childProcess.stdin.setEncoding('utf-8');
    childProcess.stdin.write(execCmd+'\n');
    childProcess.stdin.emit();
}

function connectWithGoPro(){
    if(config.goPro.connectWifi){
        wifi.init({
            iface: null
        });
        wifi.scan((err, networks)=>{
            if(err){
                console.log('Wifi searching does not work');
            }
            else{
                var wifiFound=false;
                if(networks!==null){
                    //console.log(networks);
                    networks.forEach((net)=>{
                        if(net.ssid==undefined){
                            console.log('Undefined Network name');
                        }else if(net.ssid==config.goPro.settings.name){
                            if(!config.goPro.states.wifiTryConnect && !wifiFound){
                                wifiFound=true;
                                console.log('Wifi found... try to connect');
                                connectWifi(net, config.goPro.settings.pass);
                            }
                        }
                    });
                }
                if(!wifiFound){
                    console.log('Wifi not found');
                    setTimeout(connectWithGoPro, 10*1000);
                }
            }
        });
    }
}

function connectWifi(network, pass){
    wifi.connect({
        ssid: network.ssid,
        password: pass
    }, (err)=>{
        if(err){
            if(err.toString().includes('No network with SSID')){
                console.log('Wifi not found. Retry in '+config.goPro.settings.wifiInterval*5+' sec');
            }
            else{
                console.log(err);
            }
            setTimeout(()=>{
                connectWithGoPro();
            }, config.goPro.settings.wifiInterval*5*1000);
        }
        else{
            console.log('Wifi connected with ' + network.ssid);
	    setTimeout(()=>{
		goProInitSettings();
	    }, 5000);
            setTimeout(()=>{
                wifiKeepAliveLoop=setInterval(checkWifiStatus, config.goPro.settings.wifiInterval*1000);
            }, 20*1000);
        }
    });
}

function checkWifiStatus(){
    wifi.scan((err, networks)=>{});
    if(config.goPro.connectWifi){
        goProGetStatus();
    }
}

var ifaces = os.networkInterfaces();
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
Object.keys(ifaces).forEach(function (ifname){
	var alias = 0;
	ifaces[ifname].forEach(function (iface){
		if('IPv4' !== iface.family || iface.internal !== false){
			return
		}
		if(alias >=1){
			//console.log(ifname + ':' + alias, iface.address);
		}
		else{
			if(ifname==config.netconf.serverCon){
				config.ip=iface.address;
				//console.log(ifname + ':' + alias, iface.address);
			}
		}
		++alias;
	});
});
var soundisPlaying=false;
var wav;

if(config.cdn.active){
	var chokidar = require('chokidar');
	Array.prototype.remove = function() {
		var what, a = arguments, L = a.length, ax;
		while (L && this.length) {
			what = a[--L];
			while ((ax = this.indexOf(what)) !== -1) {
				this.splice(ax, 1);
			}
		}
		return this;
	};
	var projects=[];

	var watcher = chokidar.watch( __dirname+'\\cdn\\', {
		ignored: /[\/\\]\./, 
		persistent: true ,
		depth: 0 
	  });
	watcher
		.on('addDir', function(path){
			if(path.split("\\").slice(-1)[0] == 'New folder' || path.split("\\").slice(-1)[0] == ''){}
			else{
				projects.push(path.split("\\").slice(-1)[0]);
			}
		})
		.on('unlinkDir', function(path){
			if(path.split("\\").slice(-1)[0] == 'New folder' || path.split("\\").slice(-1)[0] == ''){}
			else{
				projects.remove(path.split("\\").slice(-1)[0]);
			}
	});
	app.get('/getprojectlist', function(req, res){
		res.status(200).end(projects.toString());
	});
	app.get('/cdn/:folder/:file', function (req, res){
		//console.log(req.params);
		var file = __dirname + '/cdn/' + req.params.folder +'/'+req.params.file; 
		if(fs.existsSync(file)){
			res.status(200).download(file);
		}
		else{
			res.status(404).end("File not found");
		}
	});
}

if(config.sync.active){
	var morse = require('morsify');
	var player = require('play-sound')(opts ={});


	if(config.sync.rapspi){
		var GPIO = require('onoff').Gpio;
		var led = new GPIO(config.sync.gpioPin, 'out');
	}
	app.post('/', function(req, res){
		switch(req.query.event){
			case '1':{ //Start
				playMorse(config.sync.stats.start);
				goProStartRecording();
			};break;
			case '2':{ //Pause 
				playMorse(config.sync.stats.pause);
				goProStopRecording();
			};break;
			case '3':{ //Reset
				playMorse(config.sync.stats.reset);
				goProInitSettings();
			};break;
			case '4':{ //TOR
				playMorse(config.sync.stats.tor);
				goProTagMoment();
			};break;
			case '5':{
				killChildProcesses();
			};break;
			default:{
                if(req.query.event!=0){
                   console.log(req.query.event); 
                }
			}
		}
		res.status(200).end('done');
	});
}


app.get("/", function (req, res){
	res.status(200).end("huhu");
});


async function playMorse(clearText){
	if(config.sync.sound){
		playSound(clearText);
	}
    if(config.sync.led){
        var encoded = morse.encode(clearText);
	    playLED(encoded, false);
    }
}
async function playLED(encoded, pause){
	if(!pause){
		if(encoded.length>0){
			let remind = encoded.substring(1, encoded.length);
			if(config.sync.rapspi){
				led.writeSync(1); //ON
			}
			else{
				console.log('LED ON');
			}
			switch(encoded[0]){
				case '-': {
					setTimeout(()=>playLED(remind, true), config.sync.timing.long);
				};break;
				case '.':{
					setTimeout(()=>playLED(remind, true), config.sync.timing.short);
				};break;
				default: playLED(remind, true); break;
			}
		}
	}
	else{
		if(config.sync.rapspi){
			led.writeSync(0); //Off
		}
		else{
			console.log('LED OFF');
		}
		if(encoded.length>0){
			setTimeout(()=>playLED(encoded, false), config.sync.timing.off);
		}
	}
	
}
async function playSound(string){
	let source;
	switch(string){
		case config.sync.stats.start: source = './content/morse/start.wav';break;
		case config.sync.stats.pause: source = './content/morse/pause.wav';break;
		case config.sync.stats.reset: source = './content/morse/reset.wav';break;
		case config.sync.stats.tor: source = './content/morse/tor.wav';break;
	}
	if(source){
		if(!soundisPlaying){
			soundisPlaying=true;
			player.play(source, function(err){
				if(err) throw err;
				soundisPlaying=false;
			});
		}
		else{
			//console.log(string + ' sound not played');
		}
	}
	else{
		//console.log(string + ' sound not installed');
	}
}



async function goProStartRecording(){
    if(!config.goPro.states.initSettings){
       goProInitSettings();
       setTimeout(goProStartRecording, 1500);
    }
    else{
        if(!config.goPro.states.isRecording){
            config.goPro.states.isRecording=true;
            cam.ready()
            .then(function (){//Start Recording
                return cam.start();
            })
            .then(function (){
                console.log('Video started');
            });
        }
        else{
            console.log('System is Busy');
            if(!config.goPro.states.isRecording){
                setTimeout(goProStartRecording, 1500);
            }
        }
    }
};

function goProInitSettings(){
    cam = new goPro.Camera({
        ip:             config.goPro.settings.ip, 
        broadcastip:    config.goPro.settings.broadcastip
    });
    if(!config.goPro.states.isRecording){
        //GoPro Settings Doku
        //https://github.com/citolen/goproh4/blob/master/lib/constant.js
        //Default Settings
        // Mode Video
        // Video Resolution FullHD
        // FPS 60
        // FOV Wide
        // Beep Sounds Off
        // Display Off
        // LEDs Off
        // Voice Commands off
        cam.ready()
        .then(function(){
            return cam.mode(0, 0); //Video Mode
        })
        .then(function(){
            return cam.set(2, 9); //Video Resulution 1080
        })
        .then(function () {
            return cam.set(3, 5); //120 FPS, 60 = 5, 80 = 4, 19 = 3, 100 = 2, 120=1
        })
        .then(function () {
            return cam.set(4, 1); //FOV Wide
        })
	.then(function(){
	    return cam.set(78, 0); //Image Stabilisation OFF
	})
	.then(function(){
	   return  cam.set(8, 1); //Video Low Light On
	})
	.then(function(){
	  return cam.set(10, 0); //Deactivate Protune
	})
        .then(function () {
            return cam.set(81, 3); //RAW Audio OFF
        })
        .then(function(){
            return cam.set(56, 2); // Beep OFF
        })
	.then(function(){
            return cam.set(49, 2); //LCD Brightness Low
        })
	.then(function(){
            return cam.set(50, 0); //Screen Lock 51
        })
	.then(function(){
            return cam.set(51, 0); //LCD Sleep Off
        })
	.then(function(){
            return cam.set(72, 0); //LCD Display OFF
        })
        .then(function(){
	    return cam.set(86, 0); //Voice Command OFF
        })
        .then(function(){
            return cam.set(55, 0); //LED Blink OFF
        }) //TODO Add Void Commands off again
	.then(function(){
            return cam.set(83, 0); //GPS OFF
        }).
        then(()=>{
            config.goPro.states.initSettings=true;
            if(config.goPro.debug){
                console.log('GoPro set to research Settings');
	    }
	    return true;
        });
    }
};

async function goProStopRecording(){
    console.log('Video stopped');
    cam.stop().then(function(){
        config.goPro.states.isRecording=false;
    });
};

async function goProTagMoment(){
    if(config.goPro.states.isRecording){
        var opt ={
            url: 'http://10.5.5.9/gp/gpControl/command/storage/tag_moment',
            method: 'GET',
            headers: headers
        }
        request(opt, function(error, response, body){
            if(!error && response.statusCode == 200){
                console.log('TOR Tagged');
            }
            else{
                console.log(error);
            }
        });
    }
};

async function goProGetStatus(){
    var opt ={
		url: 'http://10.5.5.9/gp/gpControl/command/storage/tag_moment',
		method: 'GET',
		headers: headers
	}
	/*request(opt, function(error, response, body){
		if(!error && response.statusCode == 200){
            if(config.goPro.debug){
                //console.log(body);
            }
		}
		else{
			//console.log(error);
		}
	});*/
};


app.listen(config.port , config.ip, function(){
	let projectPath = __dirname+'\\cdn\\';
	console.log(config.name+' started ');
	console.log('Address: '+ config.ip +':'+config.port);
	if(config.sync.active){
		console.log('James does Sync');
	}
	if(config.cdn.active){
		console.log('James does CDN');
		console.log('CDN folder: '+projectPath);
	}
	if(config.goPro.active){
		console.log('James does GoPro');
	}
});

if(!config.goPro.connectBT){
    connectWithGoPro();
}
