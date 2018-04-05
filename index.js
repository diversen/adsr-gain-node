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
