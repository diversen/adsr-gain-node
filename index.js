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
        releaseTime: 1 // Approximated end time. Calculated with secondsToTimeConstant()
    };

    this.setOptions = function (options) {
        this.options = options;
    };

    /**
     * The gainNode
     * @param {float} begin
     * @param {float} endBegin
     * @param {float} length
     * @returns {Gain.getGainNode.gainNode}
     */
    this.getGainNode = function (begin) {

        var gainNode = this.ctx.createGain();
        gainNode.gain.value = this.options.initGain;

        // Attack to max
        gainNode.gain.setTargetAtTime(
                this.options.maxGain,
                begin + this.options.attackTime,
                this.options.attackTime);

        // Sustain and end note
        gainNode.gain.setTargetAtTime(
                0.0,
                begin + this.options.attackTime + this.options.sustainTime,
                this.secondsToTimeConstant(this.options.releaseTime));

        return gainNode;
    };
}

module.exports = Gain;