module.exports={
	name: 	'Simulator CDN and SyncServer',
	port:	1605,
	ip:		'172.20.54.194',
	cdn:{
		active: false,
	},
	morse:{
		active: true,
		sound:	true,
		led:	true,
		rapspi:	false,		//is running on pi
		timing:{
			off: 	75,
			short:	75,
			long:	200
		},
		stats:{
			start: 'start',
			pause: 'pause',
			reset: 'reset'
		}
	}
}
