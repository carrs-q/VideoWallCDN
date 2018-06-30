module.exports={
	name: 	'Simulator James',
	port:	1605,
	ip:		'192.168.0.216',
	netconf:{
        serverCon:     'eth0',
        goPro:         'wlan0'
    },
	cdn:{
		active: false,
	},
	headers:{
        ContentType:    'application/x-www-form-urlencoded',
    },
	sync:{
		active: true,
		sound:	true,
		led:	true,
		rapspi:	true,		//IS PI (SYSTEM AND HARDWARE SPECIFIC)
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
	goPro:{
        debug:          true,
        connectBT:      false,
        connectWifi:    true,
        settings: {
            name:           'GP55801580',
            pass:           'canoe7550',
            ip:             '10.5.5.9',
            broadcastip:    '10.5.5.255',
            wifimac:        'CC:46:D6:69:CD:01',
            btmac:          'F0:34:06:81:03:08',
            btInterval:     30,
            wifiInterval:   2,
        },
        states:{
            //DO NOT CHANGE THIS VALUES
            keepAlive:      true,
			btIsPared:      true,
			initSettings:   false,
            btIsConnected:  false,
            btConnectTry:   false,
            isRecording:    false,
        }
    }
}
