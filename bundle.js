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
    return adsr
}

// Begin time for gain
var nowTime = audioCtx.currentTime

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhZHNyRm9ybS5qcyIsImluZGV4LmpzIiwidGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgb3B0aW9ucyA9IHtcbiAgICBhdHRhY2tBbXA6IHtcbiAgICAgICAgbGFiZWw6ICdBdHRhY2sgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAwMVxuICAgIH0sXG4gICAgZGVjYXlBbXA6IHsgXG4gICAgICAgIGxhYmVsOiAnRGVjYXkgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBzdXN0YWluQW1wOiB7IFxuICAgICAgICBsYWJlbDogJ1N1c3RhaW4gQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICByZWxlYXNlQW1wOiB7IFxuICAgICAgICBsYWJlbDogJ1JlbGVhc2UgQW1wJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBhdHRhY2tUaW1lOiB7IFxuICAgICAgICBsYWJlbDogJ0F0dGFjayBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSxcbiAgICBkZWNheVRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnRGVjYXkgVGltZScsXG4gICAgICAgIHZhbHVlOiAwLjEsIFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgICAgc3RlcDogMC4wMVxuICAgIH0sXG4gICAgc3VzdGFpblRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnU3VzdGFpbiBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfSwgXG4gICAgcmVsZWFzZVRpbWU6IHsgXG4gICAgICAgIGxhYmVsOiAnUmVsZWFzZSBUaW1lJyxcbiAgICAgICAgdmFsdWU6IDAuMSwgXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgICBzdGVwOiAwLjAxXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRBZHNyRm9ybUh0bWwgKCkge1xuXG4gICAgcmV0dXJuIGBcbiAgICA8Zm9ybSBpZD1cImFkc3JcIj5cbiAgICAgICAgJHtnZXRBZHNyRm9ybVBhcnRzKG9wdGlvbnMpfVxuICAgIDwvZm9ybT5gXG59XG5cbmZ1bmN0aW9uIGdldEFkc3JGb3JtUGFydHMob3B0aW9ucykge1xuICAgIHZhciBzdHIgPSAnJztcbiAgICBmb3IodmFyIG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgICBzdHIgKz0gZ2V0QWRzckZvcm1QYXJ0KG5hbWUsIG9wdGlvbnNbbmFtZV0pO1xuICAgIH1cbiAgICBzdHIgKz0gZ2V0QWRzclRpbWVJbnRlcnZhbCgpO1xuICAgIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGdldEFkc3JUaW1lSW50ZXJ2YWwgKCkge1xuICAgIHJldHVybiBgXG4gICAgPHNwYW4gY2xhc3M9XCJhZHNyLWxhYmVsXCI+VGltZSBpbnRlcnZhbDwvc3Bhbj5cbiAgICA8aW5wdXQgbmFtZT1cImFkc3JJbnRlcnZhbFwiIGlkPVwiYWRzci1pbnRlcnZhbFwiIHNpemU9XCIxXCIgdHlwZT1cInRleHRcIiBtYXhsZW5ndGg9XCIyXCIgdmFsdWU9XCIxMFwiIC8+XG4gICAgPHNwYW4+IHNlY29uZChzKTwvc3Bhbj5cbiAgICBgO1xufVxuXG5mdW5jdGlvbiBnZXRBZHNyRm9ybVBhcnQobmFtZSwgb3B0aW9uKSB7XG4gICAgcmV0dXJuIGBcbiAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cImFkc3ItbGFiZWxcIj4ke29wdGlvbi5sYWJlbH08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiYWRzci1pbnB1dFwiPlxuICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgIG5hbWUgPSBcIiR7bmFtZX1cIiBcbiAgICAgICAgICAgICAgICB0eXBlPVwicmFuZ2VcIiBcbiAgICAgICAgICAgICAgICBtYXg9XCIke29wdGlvbi5tYXh9XCIgXG4gICAgICAgICAgICAgICAgbWluPVwiJHtvcHRpb24ubWlufVwiIFxuICAgICAgICAgICAgICAgIHN0ZXA9XCIke29wdGlvbi5zdGVwfVwiIFxuICAgICAgICAgICAgICAgIHZhbHVlPVwiJHtvcHRpb24udmFsdWV9XCJcbiAgICAgICAgICAgID5cbiAgICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGFkc3JQcmV2ZW50U3VibWl0ICgpIHtcblxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fkc3ItaW50ZXJ2YWwnKTtcbiAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nICwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGUua2V5SWRlbnRpZmllciA9PSAnVSswMDBBJyB8fCBlLmtleUlkZW50aWZpZXIgPT0gJ0VudGVyJyB8fCBlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGdldEZvcm1WYWx1ZXMgKCkge1xuICAgIHZhciBlbGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWRzclwiKS5lbGVtZW50cztcbiAgICBcbiAgICB2YXIgaW50ZXJ2YWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRzci1pbnRlcnZhbCcpLnZhbHVlXG4gICAgaW50ZXJ2YWwgPSBwYXJzZUZsb2F0KGludGVydmFsKVxuICAgIGlmICghaW50ZXJ2YWwpIHtcbiAgICAgICAgaW50ZXJ2YWwgPSAxO1xuICAgIH1cblxuICAgIHZhciByZXQgPSB7fTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZWxlbXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHZhciBuYW1lID0gZWxlbXNbaV0ubmFtZTtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdChlbGVtc1tpXS52YWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSAwKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IDAuMDAwMVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0W25hbWVdID0gdmFsdWVcblxuICAgICAgICBpZiAobmFtZSA9PSAnc3VzdGFpblRpbWUnIHx8IFxuICAgICAgICAgICAgbmFtZSA9PSAncmVsZWFzZVRpbWUnICB8fCBcbiAgICAgICAgICAgIG5hbWUgPT0gJ2RlY2F5VGltZScgfHwgXG4gICAgICAgICAgICBuYW1lID09ICdhdHRhY2tUaW1lJykge1xuICAgICAgICAgICAgcmV0W25hbWVdID0gaW50ZXJ2YWwgKiByZXRbbmFtZV1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRIVE1MIChlbGVtKSB7XG4gICAgdmFyIGFkc3JIdG1sID0gZ2V0QWRzckZvcm1IdG1sKCk7XG4gICAgZWxlbS5pbnNlcnRBZGphY2VudEhUTUwoICdhZnRlcmJlZ2luJywgYWRzckh0bWwpO1xuICAgIGFkc3JQcmV2ZW50U3VibWl0KClcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5pbnNlcnRIVE1MID0gaW5zZXJ0SFRNTFxubW9kdWxlLmV4cG9ydHMuZ2V0Rm9ybVZhbHVlcyA9IGdldEZvcm1WYWx1ZXNcblxuIiwiZnVuY3Rpb24gQWRzckdhaW5Ob2RlKGN0eCkge1xuXG4gICAgdGhpcy5jdHggPSBjdHg7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgIGF0dGFja0FtcDogMC4xLCBcbiAgICAgICAgZGVjYXlBbXA6IDAuMyxcbiAgICAgICAgc3VzdGFpbkFtcDogMC43LFxuICAgICAgICByZWxlYXNlQW1wOiAwLjAxLFxuICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgIGRlY2F5VGltZTogMC4yLFxuICAgICAgICBzdXN0YWluVGltZTogMS4wLCBcbiAgICAgICAgcmVsZWFzZVRpbWU6IDMuNCxcbiAgICAgICAgYXV0b1JlbGVhc2U6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0IG9wdGlvbnMgb3IgdXNlIGRlZmF1bHRzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgXG4gICAgICovXG4gICAgdGhpcy5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB0aGlzLmdhaW5Ob2RlXG4gICAgdGhpcy5hdWRpb1RpbWVcbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgYSBnYWluIG5vZGUgZnJvbSBkZWZpbmVkIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBhdWRpb1RpbWUgYW4gYXVkaW8gY29udGV4dCB0aW1lIHN0YW1wXG4gICAgICovXG4gICAgdGhpcy5nZXRHYWluTm9kZSA9ICAoYXVkaW9UaW1lKSA9PiB7XG5cbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5hdWRpb1RpbWUgPSBhdWRpb1RpbWVcblxuICAgICAgICAvLyBGaXJlZm94IGRvZXMgbm90IGxpa2UgMCAtPiB0aGVyZWZvciAwLjAwMDAwMDFcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuMDAwMDAwMSwgYXVkaW9UaW1lKSAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyBBdHRhY2tcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXR0YWNrQW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lKVxuXG4gICAgICAgIC8vIERlY2F5XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRlY2F5QW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSlcblxuICAgICAgICAvLyBTdXN0YWluXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN1c3RhaW5BbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuc3VzdGFpblRpbWUpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYXV0by1yZWxlYXNlXG4gICAgICAgIC8vIFRoZW4gY2FsY3VsYXRlIHdoZW4gbm90ZSBzaG91bGQgc3RvcFxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9SZWxlYXNlKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsZWFzZUFtcCxcbiAgICAgICAgICAgICAgICBhdWRpb1RpbWUgKyB0aGlzLnJlbGVhc2VUaW1lKClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdCB0aGUgZ2FpbiBub2RlIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KGF1ZGlvVGltZSArIHRoaXMucmVsZWFzZVRpbWUoKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5nYWluTm9kZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVsZWFzZSB0aGUgbm90ZSBkeW5hbWljYWx5XG4gICAgICogRS5nLiBpZiB5b3VyIGFyZSBtYWtpbmcgYSBrZXlib2FyZCwgYW5kIHlvdSB3YW50IHRoZSBub3RlXG4gICAgICogdG8gYmUgcmVsZWFzZWQgYWNjb3JkaW5nIHRvIGN1cnJlbnQgYXVkaW8gdGltZSBhZGRlZCB0aGUgQURTUiByZWxlYXNlIHRpbWUgXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlTm93ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxlYXNlQW1wLFxuICAgICAgICAgICAgdGhpcy5jdHguY3VycmVudFRpbWUgKyB0aGlzLm9wdGlvbnMucmVsZWFzZVRpbWUpIFxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvIHRoZSBhZHNyIHJlbGVhc2UgdGltZVxuICAgICAqL1xuICAgIHRoaXMucmVsZWFzZVRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvICdub3cnXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlVGltZU5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmN1cnJlbnRUaW1lICsgdGhpcy5yZWxlYXNlVGltZSgpXG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGRpc2Nvbm5lY3RUaW1lIHRoZSB0aW1lIHdoZW4gZ2Fpbk5vZGUgc2hvdWxkIGRpc2Nvbm5lY3QgXG4gICAgICovXG4gICAgdGhpcy5kaXNjb25uZWN0ID0gKGRpc2Nvbm5lY3RUaW1lKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBkaXNjb25uZWN0VGltZSAqIDEwMDApO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWRzckdhaW5Ob2RlO1xuIiwidmFyIGFkc3JHYWluTm9kZSA9IHJlcXVpcmUoJy4vaW5kZXgnKVxudmFyIGFkc3JGb3JtID0gcmVxdWlyZSgnLi9hZHNyRm9ybScpXG5cbnZhciBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbnZhciBvc2NpbGxhdG9yID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IG5ldyBnYWluIG5vZGVcbmZ1bmN0aW9uIGdldEFEU1IgKCkge1xuICAgIGxldCBhZHNyID0gbmV3IGFkc3JHYWluTm9kZShhdWRpb0N0eCk7XG4gICAgbGV0IG9wdGlvbnMgPSBhZHNyRm9ybS5nZXRGb3JtVmFsdWVzKClcbiAgICBhZHNyLnNldE9wdGlvbnMob3B0aW9ucylcbiAgICByZXR1cm4gYWRzclxufVxuXG4vLyBCZWdpbiB0aW1lIGZvciBnYWluXG52YXIgbm93VGltZSA9IGF1ZGlvQ3R4LmN1cnJlbnRUaW1lXG5cbmZ1bmN0aW9uIHBsYXlOb3RlSW4gKGluVGltZSkge1xuXG4gICAgbGV0IGFkc3IgPSBnZXRBRFNSKClcbiAgICBsZXQgZ2Fpbk5vZGUgPSBhZHNyLmdldEdhaW5Ob2RlKGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgaW5UaW1lICk7XG5cbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgIC8vIENvbm5lY3QgdGhlIG9zY2lsbGF0b3IgdG8gdGhlIGdhaW4gbm9kZVxuICAgIG9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG4gICAgZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cbiAgICAvLyBTdGFydFxuICAgIG9zY2lsbGF0b3Iuc3RhcnQoYXVkaW9DdHguY3VycmVudFRpbWUgKyBpblRpbWUpO1xuXG4gICAgLy8gU3RvcCBvc2NpbGxhdG9yIGFjY29yZGluZyB0byB0aGUgQURTUlxuICAgIGxldCBlbmRUaW1lID0gYWRzci5yZWxlYXNlVGltZSgpICsgYXVkaW9DdHguY3VycmVudFRpbWVcbiAgICBvc2NpbGxhdG9yLnN0b3AoZW5kVGltZSlcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oZXZlbnQpIHsgXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRzci1wYXJlbnQnKVxuICAgIGFkc3JGb3JtLmluc2VydEhUTUwoZWxlbSlcblxuICAgIHZhciBwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXknKVxuICAgIHBsYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBsYXlOb3RlSW4oMClcbiAgICB9KVxufSk7XG4iXX0=
