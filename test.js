var adsrGainNode = require('./index')
var adsrForm = require('./adsrForm')

var audioCtx = new AudioContext();
var oscillator = audioCtx.createOscillator();

// Helper function to get new gain node
function getADSR () {
    let adsr = new adsrGainNode(audioCtx);
    let options = adsrForm.getFormValues()
    adsr.setOptions(options)
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

document.addEventListener("DOMContentLoaded", function(event) { 
    var elem = document.getElementById('adsr-parent')
    adsrForm.insertHTML(elem)

    var play = document.getElementById('play')
    play.addEventListener('click', function () {
        playNoteIn(0)
    })
});
