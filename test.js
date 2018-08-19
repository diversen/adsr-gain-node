var adsrGainNode = require('./index')
var adsrForm = require('./adsrForm')

var audioCtx = new AudioContext();
var oscillator = audioCtx.createOscillator();

// Helper function to get new gain node
function getADSR () {
    let adsr = new adsrGainNode(audioCtx);
    let options = adsrForm.getFormValues()
    adsr.setOptions(options)
    console.log(adsrForm.getFormValuesRaw())
    return adsr
}

// Begin time for gain
var nowTime = audioCtx.currentTime

function playNoteIn (inTime) {

    if(audioCtx.state === 'suspended') {
        audioCtx.resume().then(function() {
            console.log('Resumed')
        });
    }

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

var defaultValues = {
    attackAmp: 0.1, 
    decayAmp: 0.3,
    sustainAmp: 0.7,
    releaseAmp: 0.01,
    attackTime: 0.1,
    decayTime: 0.2,
    sustainTime: 1.0, 
    releaseTime: 0.1,
    adsrInterval: 2.1, 
    // all above values are between 0 and 1.
    // Except adsrInterval which are multiplied
    // With the time constants.
};

document.addEventListener("DOMContentLoaded", function(event) { 
    var elem = document.getElementById('adsr-parent')
    adsrForm.insertHTML(elem, defaultValues)

    var play = document.getElementById('play')
    play.addEventListener('click', function () {
        playNoteIn(0)
    })
});
