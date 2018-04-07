(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

        this.gainNode.gain.setValueAtTime(0, audioTime)        
        
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

},{}],2:[function(require,module,exports){
var adsrGainNode = require('./index')

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
         * If we are making e.g. a keyboard, then we may 
         * not auto-release the note. If auto release is false then
         * we should release the note using. 
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

// On a piano may want to release the note, when
// the key is released. 
// 
// Then we may do something like this to end the note and the gain node: 
// E.g onKeyUp: 
//     oscillator.stop(this.adsr.releaseTimeNow())
//     adsr.releaseNow()

function playNoteIn (inTime) {

    let adsr = getADSR()
    let gainNode = adsr.getGainNode(nowTime + inTime );

    let oscillator = audioCtx.createOscillator();

    // Connect the oscillator to the gain node
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start
    oscillator.start(nowTime + inTime);

    // Stop oscillator according to the ADSR
    let endTime = adsr.releaseTime() + inTime
    oscillator.stop(endTime)
}

playNoteIn(0)
playNoteIn(4)

},{"./index":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInRlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQWRzckdhaW5Ob2RlKGN0eCkge1xuXG4gICAgdGhpcy5jdHggPSBjdHg7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgIGF0dGFja0FtcDogMC4xLCBcbiAgICAgICAgZGVjYXlBbXA6IDAuMyxcbiAgICAgICAgc3VzdGFpbkFtcDogMC43LFxuICAgICAgICByZWxlYXNlQW1wOiAwLjAxLFxuICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgIGRlY2F5VGltZTogMC4yLFxuICAgICAgICBzdXN0YWluVGltZTogMS4wLCBcbiAgICAgICAgcmVsZWFzZVRpbWU6IDMuNCxcbiAgICAgICAgYXV0b1JlbGVhc2U6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0IG9wdGlvbnMgb3IgdXNlIGRlZmF1bHRzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgXG4gICAgICovXG4gICAgdGhpcy5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB0aGlzLmdhaW5Ob2RlXG4gICAgdGhpcy5hdWRpb1RpbWVcbiAgICBcbiAgICAvKipcbiAgICAgKiBHZXQgYSBnYWluIG5vZGUgZnJvbSBkZWZpbmVkIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBhdWRpb1RpbWUgYW4gYXVkaW8gY29udGV4dCB0aW1lIHN0YW1wXG4gICAgICovXG4gICAgdGhpcy5nZXRHYWluTm9kZSA9ICAoYXVkaW9UaW1lKSA9PiB7XG5cbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5hdWRpb1RpbWUgPSBhdWRpb1RpbWVcblxuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoMCwgYXVkaW9UaW1lKSAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyBBdHRhY2tcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXR0YWNrQW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lKVxuXG4gICAgICAgIC8vIERlY2F5XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRlY2F5QW1wLCBcbiAgICAgICAgICAgIGF1ZGlvVGltZSArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSlcblxuICAgICAgICAvLyBTdXN0YWluXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN1c3RhaW5BbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuc3VzdGFpblRpbWUpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYXV0by1yZWxlYXNlXG4gICAgICAgIC8vIFRoZW4gY2FsY3VsYXRlIHdoZW4gbm90ZSBzaG91bGQgc3RvcFxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9SZWxlYXNlKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsZWFzZUFtcCxcbiAgICAgICAgICAgICAgICBhdWRpb1RpbWUgKyB0aGlzLnJlbGVhc2VUaW1lKClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdCB0aGUgZ2FpbiBub2RlIFxuICAgICAgICAgICAgdGhpcy5kaXNjb25uZWN0KGF1ZGlvVGltZSArIHRoaXMucmVsZWFzZVRpbWUoKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5nYWluTm9kZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVsZWFzZSB0aGUgbm90ZSBkeW5hbWljYWx5XG4gICAgICogRS5nLiBpZiB5b3VyIGFyZSBtYWtpbmcgYSBrZXlib2FyZCwgYW5kIHlvdSB3YW50IHRoZSBub3RlXG4gICAgICogdG8gYmUgcmVsZWFzZWQgYWNjb3JkaW5nIHRvIGN1cnJlbnQgYXVkaW8gdGltZSBhZGRlZCB0aGUgQURTUiByZWxlYXNlIHRpbWUgXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlTm93ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxlYXNlQW1wLFxuICAgICAgICAgICAgdGhpcy5jdHguY3VycmVudFRpbWUgKyB0aGlzLm9wdGlvbnMucmVsZWFzZVRpbWUpIFxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvIHRoZSBhZHNyIHJlbGVhc2UgdGltZVxuICAgICAqL1xuICAgIHRoaXMucmVsZWFzZVRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvICdub3cnXG4gICAgICovXG4gICAgdGhpcy5yZWxlYXNlVGltZU5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4LmN1cnJlbnRUaW1lICsgdGhpcy5yZWxlYXNlVGltZSgpXG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGRpc2Nvbm5lY3RUaW1lIHRoZSB0aW1lIHdoZW4gZ2Fpbk5vZGUgc2hvdWxkIGRpc2Nvbm5lY3QgXG4gICAgICovXG4gICAgdGhpcy5kaXNjb25uZWN0ID0gKGRpc2Nvbm5lY3RUaW1lKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBkaXNjb25uZWN0VGltZSAqIDEwMDApO1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWRzckdhaW5Ob2RlO1xuIiwidmFyIGFkc3JHYWluTm9kZSA9IHJlcXVpcmUoJy4vaW5kZXgnKVxuXG52YXIgYXVkaW9DdHggPSBuZXcgQXVkaW9Db250ZXh0KCk7XG5cbnZhciBvc2NpbGxhdG9yID0gYXVkaW9DdHguY3JlYXRlT3NjaWxsYXRvcigpO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IG5ldyBnYWluIG5vZGVcbmZ1bmN0aW9uIGdldEFEU1IgKCkge1xuICAgIGxldCBhZHNyID0gbmV3IGFkc3JHYWluTm9kZShhdWRpb0N0eCk7XG4gICAgYWRzci5zZXRPcHRpb25zKHtcbiAgICAgICAgYXR0YWNrQW1wOiAwLjAwMSwgXG4gICAgICAgIGRlY2F5QW1wOiAwLjMsXG4gICAgICAgIHN1c3RhaW5BbXA6IDAuNyxcbiAgICAgICAgcmVsZWFzZUFtcDogMC4wMDEsXG4gICAgICAgIGF0dGFja1RpbWU6IDEuMSxcbiAgICAgICAgZGVjYXlUaW1lOiAwLjIsXG4gICAgICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgICAgICByZWxlYXNlVGltZTogNS4wLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB3ZSBhcmUgbWFraW5nIGUuZy4gYSBrZXlib2FyZCwgdGhlbiB3ZSBtYXkgXG4gICAgICAgICAqIG5vdCBhdXRvLXJlbGVhc2UgdGhlIG5vdGUuIElmIGF1dG8gcmVsZWFzZSBpcyBmYWxzZSB0aGVuXG4gICAgICAgICAqIHdlIHNob3VsZCByZWxlYXNlIHRoZSBub3RlIHVzaW5nLiBcbiAgICAgICAgICogYGFkc3IucmVsZWFzZU5vdygpwrRcbiAgICAgICAgICovXG4gICAgICAgIGF1dG9SZWxlYXNlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIGFkc3Jcbn1cblxuLy8gQmVnaW4gdGltZSBmb3IgZ2FpblxudmFyIG5vd1RpbWUgPSBhdWRpb0N0eC5jdXJyZW50VGltZVxuXG4vLyBHZXQgYWRzciBhbmQgdGhlIGdhaW4gbm9kZVxuLy8gVGltZSBpdCB0byBiZWdpbiBpbiBjdXJyZW50IHRpbWUgKyA1IHNlY3NcbmxldCB0ZXN0VGltZSA9IDJcblxudmFyIGFkc3IgPSBnZXRBRFNSKClcbnZhciBnYWluTm9kZSA9IGFkc3IuZ2V0R2Fpbk5vZGUobm93VGltZSArIHRlc3RUaW1lICk7XG5cbi8vIENvbm5lY3QgdGhlIG9zY2lsbGF0b3IgdG8gdGhlIGdhaW4gbm9kZVxub3NjaWxsYXRvci5jb25uZWN0KGdhaW5Ob2RlKTtcbmdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuXG4vLyBTdGFydFxub3NjaWxsYXRvci5zdGFydChub3dUaW1lICsgdGVzdFRpbWUpO1xuXG4vLyBTdG9wIG9zY2lsbGF0b3IgYWNjb3JkaW5nIHRvIHRoZSBBRFNSXG5sZXQgZW5kVGltZSA9IGFkc3IucmVsZWFzZVRpbWUoKSArIHRlc3RUaW1lXG5vc2NpbGxhdG9yLnN0b3AoZW5kVGltZSlcblxuLy8gT24gYSBwaWFubyBtYXkgd2FudCB0byByZWxlYXNlIHRoZSBub3RlLCB3aGVuXG4vLyB0aGUga2V5IGlzIHJlbGVhc2VkLiBcbi8vIFxuLy8gVGhlbiB3ZSBtYXkgZG8gc29tZXRoaW5nIGxpa2UgdGhpcyB0byBlbmQgdGhlIG5vdGUgYW5kIHRoZSBnYWluIG5vZGU6IFxuLy8gRS5nIG9uS2V5VXA6IFxuLy8gICAgIG9zY2lsbGF0b3Iuc3RvcCh0aGlzLmFkc3IucmVsZWFzZVRpbWVOb3coKSlcbi8vICAgICBhZHNyLnJlbGVhc2VOb3coKVxuXG5mdW5jdGlvbiBwbGF5Tm90ZUluIChpblRpbWUpIHtcblxuICAgIGxldCBhZHNyID0gZ2V0QURTUigpXG4gICAgbGV0IGdhaW5Ob2RlID0gYWRzci5nZXRHYWluTm9kZShub3dUaW1lICsgaW5UaW1lICk7XG5cbiAgICBsZXQgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuICAgIC8vIENvbm5lY3QgdGhlIG9zY2lsbGF0b3IgdG8gdGhlIGdhaW4gbm9kZVxuICAgIG9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG4gICAgZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG5cbiAgICAvLyBTdGFydFxuICAgIG9zY2lsbGF0b3Iuc3RhcnQobm93VGltZSArIGluVGltZSk7XG5cbiAgICAvLyBTdG9wIG9zY2lsbGF0b3IgYWNjb3JkaW5nIHRvIHRoZSBBRFNSXG4gICAgbGV0IGVuZFRpbWUgPSBhZHNyLnJlbGVhc2VUaW1lKCkgKyBpblRpbWVcbiAgICBvc2NpbGxhdG9yLnN0b3AoZW5kVGltZSlcbn1cblxucGxheU5vdGVJbigwKVxucGxheU5vdGVJbig0KVxuIl19
