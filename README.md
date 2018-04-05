# adsr-gain-node

Simple object for getting an ADSR gain node

## Install: 

    npm install --save adsr-gain-node

## Example usage

~~~js
var adsrGainNode = require('adsr-gain-node')

var audioCtx = new AudioContext();

var oscillator = audioCtx.createOscillator();

// Helper function to get new gain node
function getADSR () {
    var gain = new adsrGainNode(audioCtx);
    gain.setOptions({
            attackAmp: 0.1, 
            decayAmp: 0.3,
            sustainAmp: 0.7,
            releaseAmp: 0.01,
            attackTime: 0.1,
            decayTime: 0.2,
            sustainTime: 1.0, 
            releaseTime: 3.4
    });
    return gain
}

// Begin time for gain
var begin = audioCtx.currentTime + 1

var adsr = getADSR()
var gainNode = adsr.getGainNode(begin);

oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.start(begin);

// Stop oscillator when adsr has stopped
oscillator.stop(begin + adsr.getTotalTime())
~~~~

## License

MIT © [Dennis Iversen](https://github.com/diversen)
