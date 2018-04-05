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
        releaseTime: 3.4
    };

    this.setOptions = function (options) {
        this.options = options;
    };

    this.gainNode
    
    // Get gain node
    this.getGainNode = function (begin) {

        this.gainNode = this.ctx.createGain();

        this.gainNode.gain.setValueAtTime(0, begin)
        
        // Attack
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.attackAmp, 
            begin + this.options.attackTime)

        // Decay
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.decayAmp, 
            begin + this.options.attackTime + this.options.decayTime)

        // Sustain
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.sustainAmp, 
            begin + this.options.attackTime + this.options.sustainTime)

        // Release
        this.gainNode.gain.exponentialRampToValueAtTime(
            this.options.releaseAmp,
            begin + this.options.attackTime + this.options.decayTime + this.options.sustainTime + this.options.releaseTime)
        
        return this.gainNode;
    };

    this.getTotalTime = function () {
        return this.options.attackTime + this.options.decayTime + this.options.sustainTime + this.options.releaseTime
    }
    
    this.disconnect = () => {
        setTimeout( () => {
            this.gainNode.disconnect();
        },
        this.getTotalTime() * 1000);
    };
}

module.exports = AdsrGainNode;

},{}],2:[function(require,module,exports){
var adsrGainNode = require('./index')

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

},{"./index":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInRlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQWRzckdhaW5Ob2RlKGN0eCkge1xuXG4gICAgdGhpcy5jdHggPSBjdHg7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgIGF0dGFja0FtcDogMC4xLCBcbiAgICAgICAgZGVjYXlBbXA6IDAuMyxcbiAgICAgICAgc3VzdGFpbkFtcDogMC43LFxuICAgICAgICByZWxlYXNlQW1wOiAwLjAxLFxuICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgIGRlY2F5VGltZTogMC4yLFxuICAgICAgICBzdXN0YWluVGltZTogMS4wLCBcbiAgICAgICAgcmVsZWFzZVRpbWU6IDMuNFxuICAgIH07XG5cbiAgICB0aGlzLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH07XG5cbiAgICB0aGlzLmdhaW5Ob2RlXG4gICAgXG4gICAgLy8gR2V0IGdhaW4gbm9kZVxuICAgIHRoaXMuZ2V0R2Fpbk5vZGUgPSBmdW5jdGlvbiAoYmVnaW4pIHtcblxuICAgICAgICB0aGlzLmdhaW5Ob2RlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBiZWdpbilcbiAgICAgICAgXG4gICAgICAgIC8vIEF0dGFja1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdHRhY2tBbXAsIFxuICAgICAgICAgICAgYmVnaW4gKyB0aGlzLm9wdGlvbnMuYXR0YWNrVGltZSlcblxuICAgICAgICAvLyBEZWNheVxuICAgICAgICB0aGlzLmdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5kZWNheUFtcCwgXG4gICAgICAgICAgICBiZWdpbiArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSlcblxuICAgICAgICAvLyBTdXN0YWluXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnN1c3RhaW5BbXAsIFxuICAgICAgICAgICAgYmVnaW4gKyB0aGlzLm9wdGlvbnMuYXR0YWNrVGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSlcblxuICAgICAgICAvLyBSZWxlYXNlXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKFxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGVhc2VBbXAsXG4gICAgICAgICAgICBiZWdpbiArIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmdhaW5Ob2RlO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFRvdGFsVGltZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hdHRhY2tUaW1lICsgdGhpcy5vcHRpb25zLmRlY2F5VGltZSArIHRoaXMub3B0aW9ucy5zdXN0YWluVGltZSArIHRoaXMub3B0aW9ucy5yZWxlYXNlVGltZVxuICAgIH1cbiAgICBcbiAgICB0aGlzLmRpc2Nvbm5lY3QgPSAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICB0aGlzLmdldFRvdGFsVGltZSgpICogMTAwMCk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBZHNyR2Fpbk5vZGU7XG4iLCJ2YXIgYWRzckdhaW5Ob2RlID0gcmVxdWlyZSgnLi9pbmRleCcpXG5cbnZhciBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxudmFyIG9zY2lsbGF0b3IgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCk7XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgbmV3IGdhaW4gbm9kZVxuZnVuY3Rpb24gZ2V0QURTUiAoKSB7XG4gICAgdmFyIGdhaW4gPSBuZXcgYWRzckdhaW5Ob2RlKGF1ZGlvQ3R4KTtcbiAgICBnYWluLnNldE9wdGlvbnMoe1xuICAgICAgICAgICAgYXR0YWNrQW1wOiAwLjEsIFxuICAgICAgICAgICAgZGVjYXlBbXA6IDAuMyxcbiAgICAgICAgICAgIHN1c3RhaW5BbXA6IDAuNyxcbiAgICAgICAgICAgIHJlbGVhc2VBbXA6IDAuMDEsXG4gICAgICAgICAgICBhdHRhY2tUaW1lOiAwLjEsXG4gICAgICAgICAgICBkZWNheVRpbWU6IDAuMixcbiAgICAgICAgICAgIHN1c3RhaW5UaW1lOiAxLjAsIFxuICAgICAgICAgICAgcmVsZWFzZVRpbWU6IDMuNFxuICAgIH0pO1xuICAgIHJldHVybiBnYWluXG59XG5cbi8vIEJlZ2luIHRpbWUgZm9yIGdhaW5cbnZhciBiZWdpbiA9IGF1ZGlvQ3R4LmN1cnJlbnRUaW1lICsgMVxuXG52YXIgYWRzciA9IGdldEFEU1IoKVxudmFyIGdhaW5Ob2RlID0gYWRzci5nZXRHYWluTm9kZShiZWdpbik7XG5cbm9zY2lsbGF0b3IuY29ubmVjdChnYWluTm9kZSk7XG5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ3R4LmRlc3RpbmF0aW9uKTtcblxub3NjaWxsYXRvci5zdGFydChiZWdpbik7XG5cbi8vIFN0b3Agb3NjaWxsYXRvciB3aGVuIGFkc3IgaGFzIHN0b3BwZWRcbm9zY2lsbGF0b3Iuc3RvcChiZWdpbiArIGFkc3IuZ2V0VG90YWxUaW1lKCkpXG4iXX0=
