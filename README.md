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
    let adsr = new adsrGainNode(audioCtx);
    adsr.setOptions({
        attackAmp: 0.001, 
        decayAmp: 0.3,
        sustainAmp: 0.7,
        releaseAmp: 0.001,
        attackTime: 1.1,
        decayTime: 0.2,
        sustainTime: 1.0, 
        releaseTime: 5.0,

        /**
         * If you are making e.g. a keyboard, then you may 
         * not auto-release the note
         * If auto release is false then
         * you should release the note using. 
         * `adsr.releaseNow()´
         */
        autoRelease: true
    });
    return adsr
}

// Begin time for gain
var nowTime = audioCtx.currentTime

// Get adsr and the gain node
// Time it to begin in current time + 5 secs
let testTime = 2

var adsr = getADSR()
var gainNode = adsr.getGainNode(nowTime + testTime );

// Connect the oscillator to the gain node
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// Start
oscillator.start(nowTime + testTime);

// Stop oscillator according to the ADSR
let endTime = adsr.releaseTime() + testTime
oscillator.stop(endTime)

// On a piano you may want to release the note, when
// the key is released. 
// 
// Then you may do something like this to end the note and the gain node: 
// E.g onKeyUp: 
//     oscillator.stop(this.adsr.releaseTimeNow())
//     adsr.releaseNow()
~~~~

There is also a HTML form which can generate a web interface for 
the control of gain nodes. 

You can see it on [https://diversen.github.io/adsr-gain-node/](https://diversen.github.io/adsr-gain-node/) 

The source is [test.js](test.js)

## License

MIT © [Dennis Iversen](https://github.com/diversen)
