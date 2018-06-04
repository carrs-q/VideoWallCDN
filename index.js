
var express = require ('express');
var fs = require('fs');
var config = require('./config/config.js');
var bodyParser = require('body-parser');
var os = require('os');
var request = require('request');

var ifaces = os.networkInterfaces();
var headers = {
    'User-Agent':   config.name,
    'Content-Type': config.headers.ContentType
};

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
			};break;
			case '2':{ //Pause 
				playMorse(config.sync.stats.pause);
			};break;
			case '3':{ //Reset
				playMorse(config.sync.stats.reset);
			};break;
			case '4':{ //TOR
				playMorse(config.sync.stats.tor);
			}
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
	if(config.sync.sound){
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
			console.log(string + ' sound not played');
		}
	}
	else{
		console.log(string + ' sound not installed');
	}
}

async function sendToGoPro(code){
	var opt ={
		url: 'http://'+config.goPro.settings.ip+'/status?p='+code,
		method: 'GET',
		headers: headers
	}
	request(opt, function(error, response, body){
		if(!error && response.statusCode == 200){
			console.log('Successful');
		}
		else{
			console.log(error);
		}
	});
}

app.listen(config.port , config.ip, function(){
	let projectPath = __dirname+'\\cdn\\';
	console.log(config.name+' started ');
	console.log('Address: '+ config.ip +':'+config.port);
	if(config.sync.active){
		console.log('James does Sync');
	}
	if(config.cdn.active){
		console.log('James does CDN')
	}
	if(config.gopro.active){
		console.log('James does GoPro');
	}
	if(config.db.active){
		console.log('James does DB-Logging');
	}
});