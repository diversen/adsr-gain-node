var adsrGainNode = require('./index')
var adsrForm = require('./adsrForm')

var audioCtx = new AudioContext();

var oscillator = audioCtx.createOscillator();

// Helper function to get new gain node
function getADSR () {
    let adsr = new adsrGainNode(audioCtx);
    let options = adsrForm.getFormValues()
    adsr.setOptions(options)
    /*
    adsr.setOptions({
        attackAmp: 0.001, 
        decayAmp: 0.3,
        sustainAmp: 0.7,
        releaseAmp: 0.001,
        attackTime: 1.1,
        decayTime: 0.2,
        sustainTime: 1.0, 
        releaseTime: 5.0,

        
        // If you are making e.g. a keyboard, then you may 
        // not auto-release the note. 
        // 
        // If auto release is 'false' then release the note using. 
        // `adsr.releaseNow()´
        //
        autoRelease: true
    });*/
    return adsr
}

// Begin time for gain
var nowTime = audioCtx.currentTime

// Get adsr and the gain node
// Time it to begin in current time + 5 secs
/*
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
*/
// On a piano you may want to release the note, when
// the key is released. 
// 
// Then do something like this to end the note and the gain node: 
// E.g onKeyUp: 
//     oscillator.stop(this.adsr.releaseTimeNow())
//     adsr.releaseNow()

function playNoteIn (inTime) {

    let adsr = getADSR()
    let gainNode = adsr.getGainNode(audioCtx.currentTime + inTime );

    let oscillator = audioCtx.createOscillator();

    // Connect the oscillator to the gain node
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start
    oscillator.start(audioCtx.currentTime + inTime);

    // Stop oscillator according to the ADSR
    let endTime = adsr.releaseTime() + audioCtx.currentTime
    oscillator.stop(endTime)
}

document.addEventListener("DOMContentLoaded", function(event) { 
    var elem = document.getElementById('adsr-parent')
    adsrForm.insertHTML(elem)

    var play = document.getElementById('play')
    play.addEventListener('click', function () {
        playNoteIn(0)
    })
});
