var express = require ('express');
//var https = require('https');
var fs = require('fs');
var config = require('./config/config.js');
var bodyParser = require('body-parser');
var chokidar = require('chokidar')
var os = require('os');
var player = require('play-sound');

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
app.get("/", function (req, res){
	res.status(200).end("huhu");
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
app.post('/', function(req, res){
	//TODO file SyncServer
	console.log(req.query.event);
	res.status(200).end('Im alive');
});
app.listen(config.port , config.ip, function(){
	let projectPath = __dirname+'\\cdn\\';
	console.log(config.name+' is running on: '+ config.ip +':'+config.port);
});
process.on('SIGTERM', ()=>{
	console.log('Auf wiedersehen mein Meister und Herrscher');
	process.exit(1);
});

//Obsolete
//Generate Credentials
/*
var credentials = {
	key : fs.readFileSync('./config/server.key', 'utf8'),
	cert: fs.readFileSync('./config/server.crt', 'utf8')
};
var https = https.createServer(credentials, app);
*/