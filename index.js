function Gain(ctx) {

    this.ctx = ctx;

    this.secondsToTimeConstant = function (sec) {
        return (sec * 2) / 8;
    };

    this.options = {
        initGain: 0.1, // Init gain on note
        maxGain: 1.0, // Max gain on note
        attackTime: 0.1, // AttackTime. gain.init to gain.max in attackTime
        sustainTime: 1, // Sustain note in time
        releaseTime: 1, // Approximated end time. Calculated with secondsToTimeConstant()
        // disconnect: false // Should we autodisconnect. Default is true
    };

    this.setOptions = function (options) {
        this.options = options;
    };

    this.gainNode;
    
    // Get gain node
    this.getGainNode = function (begin) {

        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setTargetAtTime(this.options.initGain, begin, 0)

        // Attack to max
        this.gainNode.gain.setTargetAtTime(
                this.options.maxGain,
                begin + this.options.attackTime,
                this.options.attackTime);

        // Sustain and end note
        this.gainNode.gain.setTargetAtTime(
                0.0,
                begin + this.options.attackTime + this.options.sustainTime,
                this.secondsToTimeConstant(this.options.releaseTime));
        
        if (this.options.disconnect !== false) {
            this.disconnect(begin);
        }
        
        return this.gainNode;
    };

    this.getTotalLength = function () {
        return this.options.attackTime + this.options.sustainTime + this.options.releaseTime
    }
    
    this.disconnect = function() {
        var totalLength = this.getTotalLength();
        
        setTimeout( () => {
            this.gainNode.disconnect();
        },
        totalLength * 1000);
    };
}

module.exports = Gain;