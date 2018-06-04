module.exports={
	name: 	'Simulator James',
	port:	1605,
	ip:		'192.168.0.216',
	cdn:{
		active: false,
	},
	headers:{
        ContentType:    'application/x-www-form-urlencoded'
    },
	sync:{
		active: true,
		sound:	true,
		led:	true,
		rapspi:	true,		//is running on pi
		gpioPin: 4,
		timing:{
			off: 	75,
			short:	75,
			long:	200
		},
		stats:{
			start: 	'start',
			pause: 	'pause',
			reset: 	'reset',
			tor:	'tor'
		}
	},
	gopro:{
		active: true,
		goProMiddleServer:	'192.168.0.217',
		goProMiddlePort:	'1605',
	},
	db:{
		active: false
	}
}
