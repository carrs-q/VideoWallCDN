
var express = require ('express');
var fs = require('fs');
var config = require('./config/config.js');
var bodyParser = require('body-parser');
var os = require('os');



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
			console.log(ifname + ':' + alias, iface.address);
		}
		else{
			if(ifname=='wlan0'){
				config.ip=iface.address;
				//console.log(ifname + ':' + alias, iface.address);
			}
		}
		++alias;
	});
});
var soundisPlaying=false;

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
		console.log(req.params);
		var file = __dirname + '/cdn/' + req.params.folder +'/'+req.params.file; 
		if(fs.existsSync(file)){
			res.status(200).download(file);
		}
		else{
			res.status(404).end("File not found");
		}
	});
}

if(config.morse.active){
	var morse = require('morsify');
	var player = require('play-sound')(opts ={});
	if(config.morse.rapspi){
		var GPIO = require('onoff').Gpio;
		var led = new GPIO(4, 'out');
	}
	app.post('/', function(req, res){
		switch(req.query.event){
			case '1':{ //Start
				playMorse(config.morse.stats.start);
			};break;
			case '2':{ //Pause 
				playMorse(config.morse.stats.pause);
			};break;
			case '3':{ //Reset
				playMorse(config.morse.stats.reset);
			};break;
			default:{
			}
		}
		res.status(200).end('done');
	});
}


app.get("/", function (req, res){
	res.status(200).end("huhu");
});


async function playMorse(clearText){
	console.log(clearText);
	if(config.morse.sound){
		playSound(clearText);
	}
	var encoded = morse.encode(clearText);
	playLED(encoded, false);
	console.log('signal:'+clearText);
}

async function playLED(encoded, pause){
	if(!pause){
		if(encoded.length>0){
			let remind = encoded.substring(1, encoded.length);
			if(config.morse.rapspi){
				led.writeSync(1); //ON
			}
			else{
				console.log('LED ON');
			}
			switch(encoded[0]){
				case '-': {
					setTimeout(()=>playLED(remind, true), config.morse.timing.long);
				};break;
				case '.':{
					setTimeout(()=>playLED(remind, true), config.morse.timing.short);
				};break;
				default: playLED(remind, true); break;
			}
		}
	}
	else{
		if(config.morse.rapspi){
			led.writeSync(0); //Off
		}
		else{
			console.log('LED OFF');
		}
		if(encoded.length>0){
			setTimeout(()=>playLED(encoded, false), config.morse.timing.off);
		}
	}
	
}

async function playSound(string){
	let source;
	switch(string){
		case config.morse.stats.start: source = './content/morse/start.wav';break;
		case config.morse.stats.pause: source = './content/morse/pause.wav';break;
		case config.morse.stats.reset: source = './content/morse/reset.wav';break;
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
			console.log(string + ' sound not played');
		}
	}
	else{
		console.log(string + ' sound not installed');
	}
}


app.listen(config.port , config.ip, function(){
	let projectPath = __dirname+'\\cdn\\';
	console.log(config.name+' started ');
	console.log('Address: '+ config.ip +':'+config.port);
	if(config.morse.active){
		console.log('Sync-Module is active');
	}
	if(config.cdn.active){
		console.log('CDN-Module is active')
	}
	if(!config.morse.active && !config.cdn.active){
		console.log('No modules activated. Server shut down...');
		console.log('To activate modules check config file');
		process.exit(1);
	}
});