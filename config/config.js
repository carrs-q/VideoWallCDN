module.exports={
	name: 	'Simulator James',
	port:	1605,
	ip:		'131.181.139.130',
	netconf:{
        serverCon:     'eth0',
        goPro:         'wlan0'
    },
	cdn:{
		active: true,
		cdnFolder: 'cdn'
	},
	headers:{
        ContentType:    'application/x-www-form-urlencoded',
    },
	sync:{
		active: false,
		sound:	false,
		led:	false,
		rapspi:	false,		//IS PI (SYSTEM AND HARDWARE SPECIFIC)
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
		},
		log:{
			storeRecords:	true,
			logFolder:		'log',
			researchFolder:	'record',
			fileFormat:		'txt',
		}
	},
	goPro:{
	active:		false,
        debug:          false,
        connectBT:      false,
        connectWifi:   	false,
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
