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

