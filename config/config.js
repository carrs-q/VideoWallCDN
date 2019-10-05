module.exports={
	name: 	'Simulator James',
	port:	1605,
	ip:		'127.0.0.1',
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
            name:           'GoProWifiName',
            pass:           'GoProWifiPass',
            ip:             '10.5.5.9',
            broadcastip:    '10.5.5.255',
            wifimac:        'CC:46:MACADRESS',
            btmac:          'F0:34:BLUETOOTHADDRESS',
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
