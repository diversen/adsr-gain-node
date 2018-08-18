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
    }
}

function getAdsrFormHtml () {

    return `
    <form id="adsr">
        ${getAdsrFormParts(options)}
    </form>`
}

function getAdsrFormParts(options) {
    var str = '';
    for(var name in options) {
        str += getAdsrFormPart(name, options[name]);
    }
    str += getAdsrTimeInterval();
    return str;
}

function getAdsrTimeInterval () {
    return `
    <span class="adsr-label">Time interval</span>
    <input name="adsrInterval" id="adsr-interval" size="1" type="text" maxlength="2" value="10" />
    <span> second(s)</span>
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


function getFormValues () {
    var elems = document.getElementById("adsr").elements;
    
    var interval = document.getElementById('adsr-interval').value
    interval = parseFloat(interval)
    if (!interval) {
        interval = 1;
    }

    var ret = {};
    for(var i = 0; i < elems.length; i++ ) {
        var name = elems[i].name;
        var value = parseFloat(elems[i].value);
        if (value == 0) {
            value = 0.0001
        }

        ret[name] = value

        if (name == 'sustainTime' || 
            name == 'releaseTime'  || 
            name == 'decayTime' || 
            name == 'attackTime') {
            ret[name] = interval * ret[name]
        }
    }
    return ret;
}

function insertHTML (elem) {
    var adsrHtml = getAdsrFormHtml();
    elem.insertAdjacentHTML( 'afterbegin', adsrHtml);
    adsrPreventSubmit()
}


module.exports.insertHTML = insertHTML
module.exports.getFormValues = getFormValues


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
     * to be released according to current audio time added the ADSR release time 
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

},{"./adsrForm":1,"./index":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhZHNyRm9ybS5qcyIsImluZGV4LmpzIiwidGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgb3B0aW9ucyA9IHtcbiAgICBhdHRhY2tBbXA6IHtcbiAgICAgICAgbGFiZWw6ICdBdHRhY2sgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAwMVxuICAgIH0sXG4gICAgZGVjYXlBbXA6IHsgXG4gICAgICAgIGxhYmVsOiAnRGVjYXkgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBzdXN0YWluQW1wOiB7IFxuICAgICAgICBsYWJlbDogJ1N1c3RhaW4gQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICByZWxlYXNlQW1wOiB7IFxuICAgICAgICBsYWJlbDogJ1JlbGVhc2UgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBhdHRhY2tUaW1lOiB7IFxuICAgICAgICBsYWJlbDogJ0F0dGFjayBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBkZWNheVRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnRGVjYXkgVGltZScsXG4gICAgICAgIHZhbHVlOiAwLjEsIFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgICAgc3RlcDogMC4wMVxuICAgIH0sXG4gICAgc3VzdGFpblRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnU3VzdGFpbiBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSwgXG4gICAgcmVsZWFzZVRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnUmVsZWFzZSBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRBZHNyRm9ybUh0bWwgKCkge1xuXG4gICAgcmV0dXJuIGBcbiAgICA8Zm9ybSBpZD1cImFkc3JcIj5cbiAgICAgICAgJHtnZXRBZHNyRm9ybVBhcnRzKG9wdGlvbnMpfVxuICAgIDwvZm9ybT5gXG59XG5cbmZ1bmN0aW9uIGdldEFkc3JGb3JtUGFydHMob3B0aW9ucykge1xuICAgIHZhciBzdHIgPSAnJztcbiAgICBmb3IodmFyIG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgICBzdHIgKz0gZ2V0QWRzckZvcm1QYXJ0KG5hbWUsIG9wdGlvbnNbbmFtZV0pO1xuICAgIH1cbiAgICBzdHIgKz0gZ2V0QWRzclRpbWVJbnRlcnZhbCgpO1xuICAgIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGdldEFkc3JUaW1lSW50ZXJ2YWwgKCkge1xuICAgIHJldHVybiBgXG4gICAgPHNwYW4gY2xhc3M9XCJhZHNyLWxhYmVsXCI+VGltZSBpbnRlcnZhbDwvc3Bhbj5cbiAgICA8aW5wdXQgbmFtZT1cImFkc3JJbnRlcnZhbFwiIGlkPVwiYWRzci1pbnRlcnZhbFwiIHNpemU9XCIxXCIgdHlwZT1cInRleHRcIiBtYXhsZW5ndGg9XCIyXCIgdmFsdWU9XCIxMFwiIC8+XG4gICAgPHNwYW4+IHNlY29uZChzKTwvc3Bhbj5cbiAgICBgO1xufVxuXG5mdW5jdGlvbiBnZXRBZHNyRm9ybVBhcnQobmFtZSwgb3B0aW9uKSB7XG4gICAgcmV0dXJuIGBcbiAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cImFkc3ItbGFiZWxcIj4ke29wdGlvbi5sYWJlbH08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiYWRzci1pbnB1dFwiPlxuICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgIG5hbWUgPSBcIiR7bmFtZX1cIiBcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIiBcbiAgICAgICAgICAgICAgICBtYXg9XCIke29wdGlvbi5tYXh9XCIgXG4gICAgICAgICAgICAgICAgbWluPVwiJHtvcHRpb24ubWlufVwiIFxuICAgICAgICAgICAgICAgIHN0ZXA9XCIke29wdGlvbi5zdGVwfVwiIFxuICAgICAgICAgICAgICAgIHZhbHVlPVwiJHtvcHRpb24udmFsdWV9XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGFkc3JQcmV2ZW50U3VibWl0ICgpIHtcblxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fkc3ItaW50ZXJ2YWwnKTtcbiAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nICwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5SWRlbnRpZmllciA9PSAnVSswMDBBJyB8fCBlLmtleUlkZW50aWZpZXIgPT0gJ0VudGVyJyB8fCBlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGdldEZvcm1WYWx1ZXMgKCkge1xuICAgIHZhciBlbGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRzclwiKS5lbGVtZW50cztcbiAgICBcbiAgICB2YXIgaW50ZXJ2YWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRzci1pbnRlcnZhbCcpLnZhbHVlXG4gICAgaW50ZXJ2YWwgPSBwYXJzZUZsb2F0KGludGVydmFsKVxuICAgIGlmICghaW50ZXJ2YWwpIHtcbiAgICAgICAgaW50ZXJ2YWwgPSAxO1xuICAgIH1cblxuICAgIHZhciByZXQgPSB7fTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZWxlbXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHZhciBuYW1lID0gZWxlbXNbaV0ubmFtZTtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdChlbGVtc1tpXS52YWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSAwKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IDAuMDAwMVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0W25hbWVdID0gdmFsdWVcblxuICAgICAgICBpZiAobmFtZSA9PSAnc3VzdGFpblRpbWUnIHx8IFxuICAgICAgICAgICAgbmFtZSA9PSAncmVsZWFzZVRpbWUnICB8fCBcbiAgICAgICAgICAgIG5hbWUgPT0gJ2RlY2F5VGltZScgfHwgXG4gICAgICAgICAgICBuYW1lID09ICdhdHRhY2tUaW1lJykge1xuICAgICAgICAgICAgcmV0W25hbWVdID0gaW50ZXJ2YWwgKiByZXRbbmFtZV1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRIVE1MIChlbGVtKSB7XG4gICAgdmFyIGFkc3JIdG1sID0gZ2V0QWRzckZvcm1IdG1sKCk7XG4gICAgZWxlbS5pbnNlcnRBZGphY2VudEhUTUwoICdhZnRlcmJlZ2luJywgYWRzckh0bWwpO1xuICAgIGFkc3JQcmV2ZW50U3VibWl0KClcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5pbnNlcnRIVE1MID0gaW5zZXJ0SFRNTFxubW9kdWxlLmV4cG9ydHMuZ2V0Rm9ybVZhbHVlcyA9IGdldEZvcm1WYWx1ZXNcblxuIiwiZnVuY3Rpb24gQWRzckdhaW5Ob2RlKGN0eCkge1xuXG4gICAgdGhpcy5jdHggPSBjdHg7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgIGF0dGFja0FtcDogMC4xLCBcbiAgICAgICAgZGVjYXlBbXA6IDAuMyxcbiAgICAgICAgc3VzdGFpbkFtcDogMC43LFxuICAgICAgICByZWxlYXNlQW1wOiAwLjAxLFxuICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgIGRlY2F5VGltZTogMC4yLFxuICAgICAgICBzdXN0YWluVGltZTogMS4wLCBcbiAgICAgICAgcmVsZWFzZVRpbWU6IDMuNCxcbiAgICAgICAgYXV0b1JlbGVhc2U6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0IG9wdGlvbnMgb3IgdXNlIGRlZmF1bHRzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgXG4gICAgICovXG4gICAgdGhpcy5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB0aGlzLmdhaW5Ob2RlXG4gICAgdGhpcy5hdWRpb1RpbWVcbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgYSBnYWluIG5vZGUgZnJvbSBkZWZpbmVkIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBhdWRpb1RpbWUgYW4gYXVkaW8gY29udGV4dCB0aW1lIHN0YW1wXG4gICAgICovXG4gICAgdGhpcy5nZXRHYWluTm9kZSA9ICAoYXVkaW9UaW1lKSA9PiB7XG5cbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5hdWRpb1RpbWUgPSBhdWRpb1RpbWVcblxuICAgICAgICAvLyBGaXJlZm94IGRvZXMgbm90IGxpa2UgMCAtPiB0aGVyZWZvciAwLjAwMDAwMDFcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuMDAwMDAwMSwgYXVkaW9UaW1lKSAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyBBdHRhY2tcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXR0YWNrQW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lKVxuXG4gICAgICAgIC8vIERlY2F5XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRlY2F5QW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSlcblxuICAgICAgICAvLyBTdXN0YWluXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN1c3RhaW5BbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuc3VzdGFpblRpbWUpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYXV0by1yZWxlYXNlXG4gICAgICAgIC8vIFRoZW4gY2FsY3VsYXRlIHdoZW4gbm90ZSBzaG91bGQgc3RvcFxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9SZWxlYXNlKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsZWFzZUFtcCxcbiAgICAgICAgICAgICAgICBhdWRpb1RpbWUgKyB0aGlzLnJlbGVhc2VUaW1lKClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdCB0aGUgZ2FpbiBub2RlIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KGF1ZGlvVGltZSArIHRoaXMucmVsZWFzZVRpbWUoKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5nYWluTm9kZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVsZWFzZSB0aGUgbm90ZSBkeW5hbWljYWx5XG4gICAgICogRS5nLiBpZiB5b3VyIGFyZSBtYWtpbmcgYSBrZXlib2FyZCwgYW5kIHlvdSB3YW50IHRoZSBub3RlXG4gICAgICogdG8gYmUgcmVsZWFzZWQgYWNjb3JkaW5nIHRvIGN1cnJlbnQgYXVkaW8gdGltZSBhZGRlZCB0aGUgQURTUiByZWxlYXNlIHRpbWUgXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlTm93ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxlYXNlQW1wLFxuICAgICAgICAgICAgdGhpcy5jdHguY3VycmVudFRpbWUgKyB0aGlzLm9wdGlvbnMucmVsZWFzZVRpbWUpIFxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvIHRoZSBhZHNyIHJlbGVhc2UgdGltZVxuICAgICAqL1xuICAgIHRoaXMucmVsZWFzZVRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvICdub3cnXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlVGltZU5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmN1cnJlbnRUaW1lICsgdGhpcy5yZWxlYXNlVGltZSgpXG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGRpc2Nvbm5lY3RUaW1lIHRoZSB0aW1lIHdoZW4gZ2Fpbk5vZGUgc2hvdWxkIGRpc2Nvbm5lY3QgXG4gICAgICovXG4gICAgdGhpcy5kaXNjb25uZWN0ID0gKGRpc2Nvbm5lY3RUaW1lKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBkaXNjb25uZWN0VGltZSAqIDEwMDApO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWRzckdhaW5Ob2RlO1xuIiwidmFyIGFkc3JHYWluTm9kZSA9IHJlcXVpcmUoJy4vaW5kZXgnKVxudmFyIGFkc3JGb3JtID0gcmVxdWlyZSgnLi9hZHNyRm9ybScpXG5cbnZhciBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxudmFyIG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgbmV3IGdhaW4gbm9kZVxuZnVuY3Rpb24gZ2V0QURTUiAoKSB7XG4gICAgbGV0IGFkc3IgPSBuZXcgYWRzckdhaW5Ob2RlKGF1ZGlvQ3R4KTtcbiAgICBsZXQgb3B0aW9ucyA9IGFkc3JGb3JtLmdldEZvcm1WYWx1ZXMoKVxuICAgIGFkc3Iuc2V0T3B0aW9ucyhvcHRpb25zKVxuICAgIC8qXG4gICAgYWRzci5zZXRPcHRpb25zKHtcbiAgICAgICAgYXR0YWNrQW1wOiAwLjAwMSwgXG4gICAgICAgIGRlY2F5QW1wOiAwLjMsXG4gICAgICAgIHN1c3RhaW5BbXA6IDAuNyxcbiAgICAgICAgcmVsZWFzZUFtcDogMC4wMDEsXG4gICAgICAgIGF0dGFja1RpbWU6IDEuMSxcbiAgICAgICAgZGVjYXlUaW1lOiAwLjIsXG4gICAgICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgICAgICByZWxlYXNlVGltZTogNS4wLFxuXG4gICAgICAgIFxuICAgICAgICAvLyBJZiB5b3UgYXJlIG1ha2luZyBlLmcuIGEga2V5Ym9hcmQsIHRoZW4geW91IG1heSBcbiAgICAgICAgLy8gbm90IGF1dG8tcmVsZWFzZSB0aGUgbm90ZS4gXG4gICAgICAgIC8vIFxuICAgICAgICAvLyBJZiBhdXRvIHJlbGVhc2UgaXMgJ2ZhbHNlJyB0aGVuIHJlbGVhc2UgdGhlIG5vdGUgdXNpbmcuIFxuICAgICAgICAvLyBgYWRzci5yZWxlYXNlTm93KCnCtFxuICAgICAgICAvL1xuICAgICAgICBhdXRvUmVsZWFzZTogdHJ1ZVxuICAgIH0pOyovXG4gICAgcmV0dXJuIGFkc3Jcbn1cblxuLy8gQmVnaW4gdGltZSBmb3IgZ2FpblxudmFyIG5vd1RpbWUgPSBhdWRpb0N0eC5jdXJyZW50VGltZVxuXG4vLyBHZXQgYWRzciBhbmQgdGhlIGdhaW4gbm9kZVxuLy8gVGltZSBpdCB0byBiZWdpbiBpbiBjdXJyZW50IHRpbWUgKyA1IHNlY3Ncbi8qXG5sZXQgdGVzdFRpbWUgPSAyXG5cbnZhciBhZHNyID0gZ2V0QURTUigpXG52YXIgZ2Fpbk5vZGUgPSBhZHNyLmdldEdhaW5Ob2RlKG5vd1RpbWUgKyB0ZXN0VGltZSApO1xuXG4vLyBDb25uZWN0IHRoZSBvc2NpbGxhdG9yIHRvIHRoZSBnYWluIG5vZGVcbm9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblxuLy8gU3RhcnRcbm9zY2lsbGF0b3Iuc3RhcnQobm93VGltZSArIHRlc3RUaW1lKTtcblxuLy8gU3RvcCBvc2NpbGxhdG9yIGFjY29yZGluZyB0byB0aGUgQURTUlxubGV0IGVuZFRpbWUgPSBhZHNyLnJlbGVhc2VUaW1lKCkgKyB0ZXN0VGltZVxub3NjaWxsYXRvci5zdG9wKGVuZFRpbWUpXG4qL1xuLy8gT24gYSBwaWFubyB5b3UgbWF5IHdhbnQgdG8gcmVsZWFzZSB0aGUgbm90ZSwgd2hlblxuLy8gdGhlIGtleSBpcyByZWxlYXNlZC4gXG4vLyBcbi8vIFRoZW4gZG8gc29tZXRoaW5nIGxpa2UgdGhpcyB0byBlbmQgdGhlIG5vdGUgYW5kIHRoZSBnYWluIG5vZGU6IFxuLy8gRS5nIG9uS2V5VXA6IFxuLy8gICAgIG9zY2lsbGF0b3Iuc3RvcCh0aGlzLmFkc3IucmVsZWFzZVRpbWVOb3coKSlcbi8vICAgICBhZHNyLnJlbGVhc2VOb3coKVxuXG5mdW5jdGlvbiBwbGF5Tm90ZUluIChpblRpbWUpIHtcblxuICAgIGxldCBhZHNyID0gZ2V0QURTUigpXG4gICAgbGV0IGdhaW5Ob2RlID0gYWRzci5nZXRHYWluTm9kZShhdWRpb0N0eC5jdXJyZW50VGltZSArIGluVGltZSApO1xuXG4gICAgbGV0IG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbiAgICAvLyBDb25uZWN0IHRoZSBvc2NpbGxhdG9yIHRvIHRoZSBnYWluIG5vZGVcbiAgICBvc2NpbGxhdG9yLmNvbm5lY3QoZ2Fpbk5vZGUpO1xuICAgIGdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuXG4gICAgLy8gU3RhcnRcbiAgICBvc2NpbGxhdG9yLnN0YXJ0KGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgaW5UaW1lKTtcblxuICAgIC8vIFN0b3Agb3NjaWxsYXRvciBhY2NvcmRpbmcgdG8gdGhlIEFEU1JcbiAgICBsZXQgZW5kVGltZSA9IGFkc3IucmVsZWFzZVRpbWUoKSArIGF1ZGlvQ3R4LmN1cnJlbnRUaW1lXG4gICAgb3NjaWxsYXRvci5zdG9wKGVuZFRpbWUpXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKGV2ZW50KSB7IFxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fkc3ItcGFyZW50JylcbiAgICBhZHNyRm9ybS5pbnNlcnRIVE1MKGVsZW0pXG5cbiAgICB2YXIgcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5JylcbiAgICBwbGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBwbGF5Tm90ZUluKDApXG4gICAgfSlcbn0pO1xuIl19
