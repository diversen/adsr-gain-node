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
                this.audioTime + this.options.attackTime + this.options.decayTime + this.options.sustainTime + this.options.releaseTime)
            
            // Disconnect the gain node 
            this.disconnect(this.options.attackTime + this.options.decayTime + this.options.sustainTime + this.options.releaseTime)
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
            this.releaseTime()) 
        this.disconnect(this.options.releaseTime)
    }

    /**
     * Get release time according to audio ctx time and the adsr release time
     */
    this.releaseTime = function() {
        return this.ctx.currentTime + this.options.releaseTime
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
        attackTime: 0.1,
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
var begin = audioCtx.currentTime

// Get adsr and the gain node
var adsr = getADSR()
var gainNode = adsr.getGainNode(begin);

// Connect the oscillator to the gain node
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// Start
oscillator.start(begin);

// Stop oscillator according to the ADSR
oscillator.stop(adsr.releaseTime())

// On a piano may want to release the note, when
// the key is released. 
// 
// Then we may do something like this to end the note and the gain node: 
// E.g onKeyUp: 
//     oscillator.stop(adsr.releaseTime());
//     adsr.releaseNow()

},{"./index":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInRlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBBZHNyR2Fpbk5vZGUoY3R4KSB7XG5cbiAgICB0aGlzLmN0eCA9IGN0eDtcblxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgYXR0YWNrQW1wOiAwLjEsIFxuICAgICAgICBkZWNheUFtcDogMC4zLFxuICAgICAgICBzdXN0YWluQW1wOiAwLjcsXG4gICAgICAgIHJlbGVhc2VBbXA6IDAuMDEsXG4gICAgICAgIGF0dGFja1RpbWU6IDAuMSxcbiAgICAgICAgZGVjYXlUaW1lOiAwLjIsXG4gICAgICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgICAgICByZWxlYXNlVGltZTogMy40LFxuICAgICAgICBhdXRvUmVsZWFzZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXQgb3B0aW9ucyBvciB1c2UgZGVmYXVsdHNcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBcbiAgICAgKi9cbiAgICB0aGlzLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2Fpbk5vZGVcbiAgICB0aGlzLmF1ZGlvVGltZVxuICAgIFxuICAgIC8qKlxuICAgICAqIEdldCBhIGdhaW4gbm9kZSBmcm9tIGRlZmluZWQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGF1ZGlvVGltZSBhbiBhdWRpbyBjb250ZXh0IHRpbWUgc3RhbXBcbiAgICAgKi9cbiAgICB0aGlzLmdldEdhaW5Ob2RlID0gIChhdWRpb1RpbWUpID0+IHtcblxuICAgICAgICB0aGlzLmdhaW5Ob2RlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmF1ZGlvVGltZSA9IGF1ZGlvVGltZVxuXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhdWRpb1RpbWUpICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIEF0dGFja1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRhY2tBbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUpXG5cbiAgICAgICAgLy8gRGVjYXlcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZGVjYXlBbXAsIFxuICAgICAgICAgICAgYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuZGVjYXlUaW1lKVxuXG4gICAgICAgIC8vIFN1c3RhaW5cbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuc3VzdGFpbkFtcCwgXG4gICAgICAgICAgICBhdWRpb1RpbWUgKyB0aGlzLm9wdGlvbnMuYXR0YWNrVGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSlcblxuICAgICAgICAvLyBDaGVjayBpZiBhdXRvLXJlbGVhc2VcbiAgICAgICAgLy8gVGhlbiBjYWxjdWxhdGUgd2hlbiBub3RlIHNob3VsZCBzdG9wXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1JlbGVhc2UpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxlYXNlQW1wLFxuICAgICAgICAgICAgICAgIHRoaXMuYXVkaW9UaW1lICsgdGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuZGVjYXlUaW1lICsgdGhpcy5vcHRpb25zLnN1c3RhaW5UaW1lICsgdGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBEaXNjb25uZWN0IHRoZSBnYWluIG5vZGUgXG4gICAgICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodGhpcy5vcHRpb25zLmF0dGFja1RpbWUgKyB0aGlzLm9wdGlvbnMuZGVjYXlUaW1lICsgdGhpcy5vcHRpb25zLnN1c3RhaW5UaW1lICsgdGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmdhaW5Ob2RlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWxlYXNlIHRoZSBub3RlIGR5bmFtaWNhbHlcbiAgICAgKiBFLmcuIGlmIHlvdXIgYXJlIG1ha2luZyBhIGtleWJvYXJkLCBhbmQgeW91IHdhbnQgdGhlIG5vdGVcbiAgICAgKiB0byBiZSByZWxlYXNlZCBhY2NvcmRpbmcgdG8gY3VycmVudCBhdWRpbyB0aW1lIGFkZGVkIHRoZSBBRFNSIHJlbGVhc2UgdGltZSBcbiAgICAgKi9cbiAgICB0aGlzLnJlbGVhc2VOb3cgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGVhc2VBbXAsXG4gICAgICAgICAgICB0aGlzLnJlbGVhc2VUaW1lKCkpIFxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QodGhpcy5vcHRpb25zLnJlbGVhc2VUaW1lKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZWxlYXNlIHRpbWUgYWNjb3JkaW5nIHRvIGF1ZGlvIGN0eCB0aW1lIGFuZCB0aGUgYWRzciByZWxlYXNlIHRpbWVcbiAgICAgKi9cbiAgICB0aGlzLnJlbGVhc2VUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0eC5jdXJyZW50VGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZVxuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBkaXNjb25uZWN0VGltZSB0aGUgdGltZSB3aGVuIGdhaW5Ob2RlIHNob3VsZCBkaXNjb25uZWN0IFxuICAgICAqL1xuICAgIHRoaXMuZGlzY29ubmVjdCA9IChkaXNjb25uZWN0VGltZSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzY29ubmVjdFRpbWUgKiAxMDAwKTtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFkc3JHYWluTm9kZTtcbiIsInZhciBhZHNyR2Fpbk5vZGUgPSByZXF1aXJlKCcuL2luZGV4JylcblxudmFyIGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG52YXIgb3NjaWxsYXRvciA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKTtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCBuZXcgZ2FpbiBub2RlXG5mdW5jdGlvbiBnZXRBRFNSICgpIHtcbiAgICBsZXQgYWRzciA9IG5ldyBhZHNyR2Fpbk5vZGUoYXVkaW9DdHgpO1xuICAgIGFkc3Iuc2V0T3B0aW9ucyh7XG4gICAgICAgIGF0dGFja0FtcDogMC4wMDEsIFxuICAgICAgICBkZWNheUFtcDogMC4zLFxuICAgICAgICBzdXN0YWluQW1wOiAwLjcsXG4gICAgICAgIHJlbGVhc2VBbXA6IDAuMDAxLFxuICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgIGRlY2F5VGltZTogMC4yLFxuICAgICAgICBzdXN0YWluVGltZTogMS4wLCBcbiAgICAgICAgcmVsZWFzZVRpbWU6IDUuMCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgd2UgYXJlIG1ha2luZyBlLmcuIGEga2V5Ym9hcmQsIHRoZW4gd2UgbWF5IFxuICAgICAgICAgKiBub3QgYXV0by1yZWxlYXNlIHRoZSBub3RlLiBJZiBhdXRvIHJlbGVhc2UgaXMgZmFsc2UgdGhlblxuICAgICAgICAgKiB3ZSBzaG91bGQgcmVsZWFzZSB0aGUgbm90ZSB1c2luZy4gXG4gICAgICAgICAqIGBhZHNyLnJlbGVhc2VOb3coKcK0XG4gICAgICAgICAqL1xuICAgICAgICBhdXRvUmVsZWFzZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBhZHNyXG59XG5cblxuXG4vLyBCZWdpbiB0aW1lIGZvciBnYWluXG52YXIgYmVnaW4gPSBhdWRpb0N0eC5jdXJyZW50VGltZVxuXG4vLyBHZXQgYWRzciBhbmQgdGhlIGdhaW4gbm9kZVxudmFyIGFkc3IgPSBnZXRBRFNSKClcbnZhciBnYWluTm9kZSA9IGFkc3IuZ2V0R2Fpbk5vZGUoYmVnaW4pO1xuXG4vLyBDb25uZWN0IHRoZSBvc2NpbGxhdG9yIHRvIHRoZSBnYWluIG5vZGVcbm9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblxuLy8gU3RhcnRcbm9zY2lsbGF0b3Iuc3RhcnQoYmVnaW4pO1xuXG4vLyBTdG9wIG9zY2lsbGF0b3IgYWNjb3JkaW5nIHRvIHRoZSBBRFNSXG5vc2NpbGxhdG9yLnN0b3AoYWRzci5yZWxlYXNlVGltZSgpKVxuXG4vLyBPbiBhIHBpYW5vIG1heSB3YW50IHRvIHJlbGVhc2UgdGhlIG5vdGUsIHdoZW5cbi8vIHRoZSBrZXkgaXMgcmVsZWFzZWQuIFxuLy8gXG4vLyBUaGVuIHdlIG1heSBkbyBzb21ldGhpbmcgbGlrZSB0aGlzIHRvIGVuZCB0aGUgbm90ZSBhbmQgdGhlIGdhaW4gbm9kZTogXG4vLyBFLmcgb25LZXlVcDogXG4vLyAgICAgb3NjaWxsYXRvci5zdG9wKGFkc3IucmVsZWFzZVRpbWUoKSk7XG4vLyAgICAgYWRzci5yZWxlYXNlTm93KClcbiJdfQ==
