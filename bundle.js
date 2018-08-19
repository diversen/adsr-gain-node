(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var options = {
    attackAmp: {
        label: 'Attack Amp',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.001
    },
    decayAmp: { 
        label: 'Decay Amp',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    sustainAmp: { 
        label: 'Sustain Amp',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    releaseAmp: { 
        label: 'Release Amp',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    attackTime: { 
        label: 'Attack Time',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    decayTime: { 
        label: 'Decay Time',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    sustainTime: { 
        label: 'Sustain Time',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    }, 
    releaseTime: { 
        label: 'Release Time',
        value: 0.1, 
        min: 0,
        max: 1,
        step: 0.01
    },
    adsrInterval: {
        value: 1
    }
}

function getAdsrFormHtml (defaultValues) {

    setOptionsDefaultValues(defaultValues)

    return `
    <form id="adsr">
        ${getAdsrFormParts(options)}
    </form>`
}

function setOptionsDefaultValues (values) {
    for(var i in values) {
        options[i].value = values[i]
    }

}

function getAdsrFormParts(options) {
    var str = '';
    for(var name in options) {
        if (name == 'adsrInterval') {
            str += getAdsrFormPartAdsrInterval(options);
        } else {
            str += getAdsrFormPart(name, options[name]);
        }
    }

    return str;
}

function getAdsrFormPartAdsrInterval (options) {
    return `
    <div>
        <span class="adsr-label">Time interval</span>
        <input 
            name="adsrInterval" 
            id="adsr-interval" 
            size="1" 
            type="text" 
            maxlength="4" 
            value="${options.adsrInterval.value}" />
        <span> second(s)</span>
    </div>
    `;
}

function getAdsrFormPart(name, option) {
    return `
    <div>
        <span class="adsr-label">${option.label}</span>
        <span class="adsr-input">
            <input 
                name = "${name}" 
                type="range" 
                max="${option.max}" 
                min="${option.min}" 
                step="${option.step}" 
                value="${option.value}"
            >
        </span>
    </div>
    `;
}

function adsrPreventSubmit () {

    var elem = document.getElementById('adsr-interval');
    elem.addEventListener('keydown' , function (e) {
        if (e.keyIdentifier == 'U+000A' || e.keyIdentifier == 'Enter' || e.keyCode == 13) {
            e.preventDefault();
        }
    });
}

function getAdsrTimeInterval () {
    var interval = document.getElementById('adsr-interval').value
    interval = parseFloat(interval)
    if (!interval) {
        interval = 1;
    }
    return interval;
}

function getFormValuesRaw () {
    var values = getFormValues('raw');
    // values.timeInterval = getTimeInterval();
    return values;
}

function getFormValues (raw) {
    var elems = document.getElementById("adsr").elements;
    
    var interval = getAdsrTimeInterval();

    var ret = {};
    for(var i = 0; i < elems.length; i++ ) {
        var name = elems[i].name;
        var value = parseFloat(elems[i].value);
        if (value == 0) {
            value = 0.0001
        }

        ret[name] = value
        if (raw) continue;

        if (name == 'sustainTime' || 
            name == 'releaseTime'  || 
            name == 'decayTime' || 
            name == 'attackTime') {
            ret[name] = interval * ret[name]
        }
    }
    return ret;
}

function insertHTML (elem, defaultValues) {
    var adsrHtml = getAdsrFormHtml(defaultValues);
    elem.insertAdjacentHTML( 'afterbegin', adsrHtml);
    adsrPreventSubmit()
}


module.exports.insertHTML = insertHTML
module.exports.getFormValues = getFormValues
module.exports.getFormValuesRaw = getFormValuesRaw


},{}],2:[function(require,module,exports){
function AdsrGainNode(ctx) {

    this.ctx = ctx;

    this.options = {
        attackAmp: 0.1, 
        decayAmp: 0.3,
        sustainAmp: 0.7,
        releaseAmp: 0.01,
        attackTime: 0.1,
        decayTime: 0.2,
        sustainTime: 1.0, 
        releaseTime: 3.4,
        autoRelease: true
    };

    /**
     * Set options or use defaults
     * @param {object} options 
     */
    this.setOptions = function (options) {
        this.options = Object.assign(this.options, options);
    };

    this.gainNode
    this.audioTime
    
    /**
     * Get a gain node from defined options
     * @param {float} audioTime an audio context time stamp
     */
    this.getGainNode =  (audioTime) => {

        this.gainNode = this.ctx.createGain();
        this.audioTime = audioTime

        // Firefox does not like 0 -> therefor 0.0000001
        this.gainNode.gain.setValueAtTime(0.0000001, audioTime)        
        
        // Attack
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.attackAmp, 
            audioTime + this.options.attackTime)

        // Decay
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.decayAmp, 
            audioTime + this.options.attackTime + this.options.decayTime)

        // Sustain
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.sustainAmp, 
            audioTime + this.options.attackTime + this.options.sustainTime)

        // Check if auto-release
        // Then calculate when note should stop
        if (this.options.autoRelease) {
            this.gainNode.gain.exponentialRampToValueAtTime(
                this.options.releaseAmp,
                audioTime + this.releaseTime()
            )
            
            // Disconnect the gain node 
            this.disconnect(audioTime + this.releaseTime())
        }
        return this.gainNode;
    };

    /**
     * Release the note dynamicaly
     * E.g. if your are making a keyboard, and you want the note
     * to be released according to current audio time + the ADSR release time 
     */
    this.releaseNow = () => {
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.releaseAmp,
            this.ctx.currentTime + this.options.releaseTime) 
        this.disconnect(this.options.releaseTime)
    }

    /**
     * Get release time according to the adsr release time
     */
    this.releaseTime = function() {
        return this.options.attackTime + this.options.decayTime + this.options.sustainTime + this.options.releaseTime
    }

    /**
     * Get release time according to 'now'
     */
    this.releaseTimeNow = function () {
        return this.ctx.currentTime + this.releaseTime()
    }
    
    /**
     * 
     * @param {float} disconnectTime the time when gainNode should disconnect 
     */
    this.disconnect = (disconnectTime) => {
        setTimeout( () => {
            this.gainNode.disconnect();
        },
        disconnectTime * 1000);
    };
}

module.exports = AdsrGainNode;

},{}],3:[function(require,module,exports){
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

},{"./adsrForm":1,"./index":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhZHNyRm9ybS5qcyIsImluZGV4LmpzIiwidGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBvcHRpb25zID0ge1xuICAgIGF0dGFja0FtcDoge1xuICAgICAgICBsYWJlbDogJ0F0dGFjayBBbXAnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDAxXG4gICAgfSxcbiAgICBkZWNheUFtcDogeyBcbiAgICAgICAgbGFiZWw6ICdEZWNheSBBbXAnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LFxuICAgIHN1c3RhaW5BbXA6IHsgXG4gICAgICAgIGxhYmVsOiAnU3VzdGFpbiBBbXAnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LFxuICAgIHJlbGVhc2VBbXA6IHsgXG4gICAgICAgIGxhYmVsOiAnUmVsZWFzZSBBbXAnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LFxuICAgIGF0dGFja1RpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnQXR0YWNrIFRpbWUnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LFxuICAgIGRlY2F5VGltZTogeyBcbiAgICAgICAgbGFiZWw6ICdEZWNheSBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBzdXN0YWluVGltZTogeyBcbiAgICAgICAgbGFiZWw6ICdTdXN0YWluIFRpbWUnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LCBcbiAgICByZWxlYXNlVGltZTogeyBcbiAgICAgICAgbGFiZWw6ICdSZWxlYXNlIFRpbWUnLFxuICAgICAgICB2YWx1ZTogMC4xLCBcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIHN0ZXA6IDAuMDFcbiAgICB9LFxuICAgIGFkc3JJbnRlcnZhbDoge1xuICAgICAgICB2YWx1ZTogMVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0QWRzckZvcm1IdG1sIChkZWZhdWx0VmFsdWVzKSB7XG5cbiAgICBzZXRPcHRpb25zRGVmYXVsdFZhbHVlcyhkZWZhdWx0VmFsdWVzKVxuXG4gICAgcmV0dXJuIGBcbiAgICA8Zm9ybSBpZD1cImFkc3JcIj5cbiAgICAgICAgJHtnZXRBZHNyRm9ybVBhcnRzKG9wdGlvbnMpfVxuICAgIDwvZm9ybT5gXG59XG5cbmZ1bmN0aW9uIHNldE9wdGlvbnNEZWZhdWx0VmFsdWVzICh2YWx1ZXMpIHtcbiAgICBmb3IodmFyIGkgaW4gdmFsdWVzKSB7XG4gICAgICAgIG9wdGlvbnNbaV0udmFsdWUgPSB2YWx1ZXNbaV1cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gZ2V0QWRzckZvcm1QYXJ0cyhvcHRpb25zKSB7XG4gICAgdmFyIHN0ciA9ICcnO1xuICAgIGZvcih2YXIgbmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgIGlmIChuYW1lID09ICdhZHNySW50ZXJ2YWwnKSB7XG4gICAgICAgICAgICBzdHIgKz0gZ2V0QWRzckZvcm1QYXJ0QWRzckludGVydmFsKG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9IGdldEFkc3JGb3JtUGFydChuYW1lLCBvcHRpb25zW25hbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGdldEFkc3JGb3JtUGFydEFkc3JJbnRlcnZhbCAob3B0aW9ucykge1xuICAgIHJldHVybiBgXG4gICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJhZHNyLWxhYmVsXCI+VGltZSBpbnRlcnZhbDwvc3Bhbj5cbiAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgbmFtZT1cImFkc3JJbnRlcnZhbFwiIFxuICAgICAgICAgICAgaWQ9XCJhZHNyLWludGVydmFsXCIgXG4gICAgICAgICAgICBzaXplPVwiMVwiIFxuICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgIG1heGxlbmd0aD1cIjRcIiBcbiAgICAgICAgICAgIHZhbHVlPVwiJHtvcHRpb25zLmFkc3JJbnRlcnZhbC52YWx1ZX1cIiAvPlxuICAgICAgICA8c3Bhbj4gc2Vjb25kKHMpPC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGdldEFkc3JGb3JtUGFydChuYW1lLCBvcHRpb24pIHtcbiAgICByZXR1cm4gYFxuICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiYWRzci1sYWJlbFwiPiR7b3B0aW9uLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJhZHNyLWlucHV0XCI+XG4gICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgbmFtZSA9IFwiJHtuYW1lfVwiIFxuICAgICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiIFxuICAgICAgICAgICAgICAgIG1heD1cIiR7b3B0aW9uLm1heH1cIiBcbiAgICAgICAgICAgICAgICBtaW49XCIke29wdGlvbi5taW59XCIgXG4gICAgICAgICAgICAgICAgc3RlcD1cIiR7b3B0aW9uLnN0ZXB9XCIgXG4gICAgICAgICAgICAgICAgdmFsdWU9XCIke29wdGlvbi52YWx1ZX1cIlxuICAgICAgICAgICAgPlxuICAgICAgICA8L3NwYW4+XG4gICAgPC9kaXY+XG4gICAgYDtcbn1cblxuZnVuY3Rpb24gYWRzclByZXZlbnRTdWJtaXQgKCkge1xuXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRzci1pbnRlcnZhbCcpO1xuICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicgLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZS5rZXlJZGVudGlmaWVyID09ICdVKzAwMEEnIHx8IGUua2V5SWRlbnRpZmllciA9PSAnRW50ZXInIHx8IGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFkc3JUaW1lSW50ZXJ2YWwgKCkge1xuICAgIHZhciBpbnRlcnZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZHNyLWludGVydmFsJykudmFsdWVcbiAgICBpbnRlcnZhbCA9IHBhcnNlRmxvYXQoaW50ZXJ2YWwpXG4gICAgaWYgKCFpbnRlcnZhbCkge1xuICAgICAgICBpbnRlcnZhbCA9IDE7XG4gICAgfVxuICAgIHJldHVybiBpbnRlcnZhbDtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybVZhbHVlc1JhdyAoKSB7XG4gICAgdmFyIHZhbHVlcyA9IGdldEZvcm1WYWx1ZXMoJ3JhdycpO1xuICAgIC8vIHZhbHVlcy50aW1lSW50ZXJ2YWwgPSBnZXRUaW1lSW50ZXJ2YWwoKTtcbiAgICByZXR1cm4gdmFsdWVzO1xufVxuXG5mdW5jdGlvbiBnZXRGb3JtVmFsdWVzIChyYXcpIHtcbiAgICB2YXIgZWxlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFkc3JcIikuZWxlbWVudHM7XG4gICAgXG4gICAgdmFyIGludGVydmFsID0gZ2V0QWRzclRpbWVJbnRlcnZhbCgpO1xuXG4gICAgdmFyIHJldCA9IHt9O1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBlbGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgdmFyIG5hbWUgPSBlbGVtc1tpXS5uYW1lO1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0KGVsZW1zW2ldLnZhbHVlKTtcbiAgICAgICAgaWYgKHZhbHVlID09IDApIHtcbiAgICAgICAgICAgIHZhbHVlID0gMC4wMDAxXG4gICAgICAgIH1cblxuICAgICAgICByZXRbbmFtZV0gPSB2YWx1ZVxuICAgICAgICBpZiAocmF3KSBjb250aW51ZTtcblxuICAgICAgICBpZiAobmFtZSA9PSAnc3VzdGFpblRpbWUnIHx8IFxuICAgICAgICAgICAgbmFtZSA9PSAncmVsZWFzZVRpbWUnICB8fCBcbiAgICAgICAgICAgIG5hbWUgPT0gJ2RlY2F5VGltZScgfHwgXG4gICAgICAgICAgICBuYW1lID09ICdhdHRhY2tUaW1lJykge1xuICAgICAgICAgICAgcmV0W25hbWVdID0gaW50ZXJ2YWwgKiByZXRbbmFtZV1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRIVE1MIChlbGVtLCBkZWZhdWx0VmFsdWVzKSB7XG4gICAgdmFyIGFkc3JIdG1sID0gZ2V0QWRzckZvcm1IdG1sKGRlZmF1bHRWYWx1ZXMpO1xuICAgIGVsZW0uaW5zZXJ0QWRqYWNlbnRIVE1MKCAnYWZ0ZXJiZWdpbicsIGFkc3JIdG1sKTtcbiAgICBhZHNyUHJldmVudFN1Ym1pdCgpXG59XG5cblxubW9kdWxlLmV4cG9ydHMuaW5zZXJ0SFRNTCA9IGluc2VydEhUTUxcbm1vZHVsZS5leHBvcnRzLmdldEZvcm1WYWx1ZXMgPSBnZXRGb3JtVmFsdWVzXG5tb2R1bGUuZXhwb3J0cy5nZXRGb3JtVmFsdWVzUmF3ID0gZ2V0Rm9ybVZhbHVlc1Jhd1xuXG4iLCJmdW5jdGlvbiBBZHNyR2Fpbk5vZGUoY3R4KSB7XG5cbiAgICB0aGlzLmN0eCA9IGN0eDtcblxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgYXR0YWNrQW1wOiAwLjEsIFxuICAgICAgICBkZWNheUFtcDogMC4zLFxuICAgICAgICBzdXN0YWluQW1wOiAwLjcsXG4gICAgICAgIHJlbGVhc2VBbXA6IDAuMDEsXG4gICAgICAgIGF0dGFja1RpbWU6IDAuMSxcbiAgICAgICAgZGVjYXlUaW1lOiAwLjIsXG4gICAgICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgICAgICByZWxlYXNlVGltZTogMy40LFxuICAgICAgICBhdXRvUmVsZWFzZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXQgb3B0aW9ucyBvciB1c2UgZGVmYXVsdHNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBcbiAgICAgKi9cbiAgICB0aGlzLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2Fpbk5vZGVcbiAgICB0aGlzLmF1ZGlvVGltZVxuICAgIFxuICAgIC8qKlxuICAgICAqIEdldCBhIGdhaW4gbm9kZSBmcm9tIGRlZmluZWQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGF1ZGlvVGltZSBhbiBhdWRpbyBjb250ZXh0IHRpbWUgc3RhbXBcbiAgICAgKi9cbiAgICB0aGlzLmdldEdhaW5Ob2RlID0gIChhdWRpb1RpbWUpID0+IHtcblxuICAgICAgICB0aGlzLmdhaW5Ob2RlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmF1ZGlvVGltZSA9IGF1ZGlvVGltZVxuXG4gICAgICAgIC8vIEZpcmVmb3ggZG9lcyBub3QgbGlrZSAwIC0+IHRoZXJlZm9yIDAuMDAwMDAwMVxuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC4wMDAwMDAxLCBhdWRpb1RpbWUpICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIEF0dGFja1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRhY2tBbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUpXG5cbiAgICAgICAgLy8gRGVjYXlcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGVjYXlBbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuZGVjYXlUaW1lKVxuXG4gICAgICAgIC8vIFN1c3RhaW5cbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuc3VzdGFpbkFtcCwgXG4gICAgICAgICAgICBhdWRpb1RpbWUgKyB0aGlzLm9wdGlvbnMuYXR0YWNrVGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSlcblxuICAgICAgICAvLyBDaGVjayBpZiBhdXRvLXJlbGVhc2VcbiAgICAgICAgLy8gVGhlbiBjYWxjdWxhdGUgd2hlbiBub3RlIHNob3VsZCBzdG9wXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1JlbGVhc2UpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxlYXNlQW1wLFxuICAgICAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMucmVsZWFzZVRpbWUoKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBEaXNjb25uZWN0IHRoZSBnYWluIG5vZGUgXG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoYXVkaW9UaW1lICsgdGhpcy5yZWxlYXNlVGltZSgpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmdhaW5Ob2RlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWxlYXNlIHRoZSBub3RlIGR5bmFtaWNhbHlcbiAgICAgKiBFLmcuIGlmIHlvdXIgYXJlIG1ha2luZyBhIGtleWJvYXJkLCBhbmQgeW91IHdhbnQgdGhlIG5vdGVcbiAgICAgKiB0byBiZSByZWxlYXNlZCBhY2NvcmRpbmcgdG8gY3VycmVudCBhdWRpbyB0aW1lICsgdGhlIEFEU1IgcmVsZWFzZSB0aW1lIFxuICAgICAqL1xuICAgIHRoaXMucmVsZWFzZU5vdyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsZWFzZUFtcCxcbiAgICAgICAgICAgIHRoaXMuY3R4LmN1cnJlbnRUaW1lICsgdGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKSBcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcmVsZWFzZSB0aW1lIGFjY29yZGluZyB0byB0aGUgYWRzciByZWxlYXNlIHRpbWVcbiAgICAgKi9cbiAgICB0aGlzLnJlbGVhc2VUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXR0YWNrVGltZSArIHRoaXMub3B0aW9ucy5kZWNheVRpbWUgKyB0aGlzLm9wdGlvbnMuc3VzdGFpblRpbWUgKyB0aGlzLm9wdGlvbnMucmVsZWFzZVRpbWVcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgcmVsZWFzZSB0aW1lIGFjY29yZGluZyB0byAnbm93J1xuICAgICAqL1xuICAgIHRoaXMucmVsZWFzZVRpbWVOb3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0eC5jdXJyZW50VGltZSArIHRoaXMucmVsZWFzZVRpbWUoKVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBkaXNjb25uZWN0VGltZSB0aGUgdGltZSB3aGVuIGdhaW5Ob2RlIHNob3VsZCBkaXNjb25uZWN0IFxuICAgICAqL1xuICAgIHRoaXMuZGlzY29ubmVjdCA9IChkaXNjb25uZWN0VGltZSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzY29ubmVjdFRpbWUgKiAxMDAwKTtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFkc3JHYWluTm9kZTtcbiIsInZhciBhZHNyR2Fpbk5vZGUgPSByZXF1aXJlKCcuL2luZGV4JylcbnZhciBhZHNyRm9ybSA9IHJlcXVpcmUoJy4vYWRzckZvcm0nKVxuXG52YXIgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0KCk7XG52YXIgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCBuZXcgZ2FpbiBub2RlXG5mdW5jdGlvbiBnZXRBRFNSICgpIHtcbiAgICBsZXQgYWRzciA9IG5ldyBhZHNyR2Fpbk5vZGUoYXVkaW9DdHgpO1xuICAgIGxldCBvcHRpb25zID0gYWRzckZvcm0uZ2V0Rm9ybVZhbHVlcygpXG4gICAgYWRzci5zZXRPcHRpb25zKG9wdGlvbnMpXG4gICAgY29uc29sZS5sb2coYWRzckZvcm0uZ2V0Rm9ybVZhbHVlc1JhdygpKVxuICAgIHJldHVybiBhZHNyXG59XG5cbi8vIEJlZ2luIHRpbWUgZm9yIGdhaW5cbnZhciBub3dUaW1lID0gYXVkaW9DdHguY3VycmVudFRpbWVcblxuZnVuY3Rpb24gcGxheU5vdGVJbiAoaW5UaW1lKSB7XG5cbiAgICBpZihhdWRpb0N0eC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcbiAgICAgICAgYXVkaW9DdHgucmVzdW1lKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXN1bWVkJylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV0IGFkc3IgPSBnZXRBRFNSKClcbiAgICBsZXQgZ2Fpbk5vZGUgPSBhZHNyLmdldEdhaW5Ob2RlKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgaW5UaW1lICk7XG5cbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgIC8vIENvbm5lY3QgdGhlIG9zY2lsbGF0b3IgdG8gdGhlIGdhaW4gbm9kZVxuICAgIG9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG4gICAgZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cbiAgICAvLyBTdGFydFxuICAgIG9zY2lsbGF0b3Iuc3RhcnQoYXVkaW9DdHguY3VycmVudFRpbWUgKyBpblRpbWUpO1xuXG4gICAgLy8gU3RvcCBvc2NpbGxhdG9yIGFjY29yZGluZyB0byB0aGUgQURTUlxuICAgIGxldCBlbmRUaW1lID0gYWRzci5yZWxlYXNlVGltZSgpICsgYXVkaW9DdHguY3VycmVudFRpbWVcbiAgICBvc2NpbGxhdG9yLnN0b3AoZW5kVGltZSlcbn1cblxudmFyIGRlZmF1bHRWYWx1ZXMgPSB7XG4gICAgYXR0YWNrQW1wOiAwLjEsIFxuICAgIGRlY2F5QW1wOiAwLjMsXG4gICAgc3VzdGFpbkFtcDogMC43LFxuICAgIHJlbGVhc2VBbXA6IDAuMDEsXG4gICAgYXR0YWNrVGltZTogMC4xLFxuICAgIGRlY2F5VGltZTogMC4yLFxuICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgIHJlbGVhc2VUaW1lOiAwLjEsXG4gICAgYWRzckludGVydmFsOiAyLjEsIFxuICAgIC8vIGFsbCBhYm92ZSB2YWx1ZXMgYXJlIGJldHdlZW4gMCBhbmQgMS5cbiAgICAvLyBFeGNlcHQgYWRzckludGVydmFsIHdoaWNoIGFyZSBtdWx0aXBsaWVkXG4gICAgLy8gV2l0aCB0aGUgdGltZSBjb25zdGFudHMuXG59O1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbihldmVudCkgeyBcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZHNyLXBhcmVudCcpXG4gICAgYWRzckZvcm0uaW5zZXJ0SFRNTChlbGVtLCBkZWZhdWx0VmFsdWVzKVxuXG4gICAgdmFyIHBsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheScpXG4gICAgcGxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcGxheU5vdGVJbigwKVxuICAgIH0pXG59KTtcbiJdfQ==
