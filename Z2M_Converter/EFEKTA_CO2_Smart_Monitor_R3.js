const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const constants = require('zigbee-herdsman-converters/lib/constants');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const extend = require('zigbee-herdsman-converters/lib/extend');
const e = exposes.presets;
const ea = exposes.access;
//const {calibrateAndPrecisionRoundOptions} = require('zigbee-herdsman-converters/lib/utils');

const tzLocal = {
	co2_config: {
        key: ['auto_brightness', 'forced_recalibration', 'factory_reset_co2', 'long_chart_period', 'set_altitude',
            'manual_forced_recalibration', 'light_indicator', 'light_ind_level', 'automatic_scal', 'reading_delay'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                auto_brightness: ['msCO2', {0x0203: {value, type: 0x10}}],
                forced_recalibration: ['msCO2', {0x0202: {value, type: 0x10}}],
                factory_reset_co2: ['msCO2', {0x0206: {value, type: 0x10}}],
                long_chart_period: ['msCO2', {0x0204: {value, type: 0x10}}],
                set_altitude: ['msCO2', {0x0205: {value, type: 0x21}}],
                manual_forced_recalibration: ['msCO2', {0x0207: {value, type: 0x21}}],
				light_indicator: ['msCO2', {0x0211: {value, type: 0x10}}],
				light_ind_level: ['msCO2', {0x0209: {value, type: 0x20}}],
				automatic_scal: ['msCO2', {0x0402: {value, type: 0x10}}],
				reading_delay: ['msCO2', {0x0201: {value, type: 0x21}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	temperaturef_config: {
        key: ['temperature_offset'],
        convertSet: async (entity, key, rawValue, meta) => {
            const value = parseFloat(rawValue)*10;
            const payloads = {
                temperature_offset: ['msTemperatureMeasurement', {0x0410: {value, type: 0x29}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
    humidity_config: {
        key: ['humidity_offset'],
        convertSet: async (entity, key, rawValue, meta) => {
            const value = parseInt(rawValue, 10);
            const payloads = {
                humidity_offset: ['msRelativeHumidity', {0x0210: {value, type: 0x29}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	co2_gasstat_config: {
        key: ['high_gas', 'low_gas', 'enable_gas', 'invert_logic_gas'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                high_gas: ['msCO2', {0x0221: {value, type: 0x21}}],
                low_gas: ['msCO2', {0x0222: {value, type: 0x21}}],
				enable_gas: ['msCO2', {0x0220: {value, type: 0x10}}],
				invert_logic_gas: ['msCO2', {0x0225: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
};

const fzLocal = {
	co2: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
			if (msg.data.hasOwnProperty('measuredValue')) {
				return {co2: Math.round(msg.data.measuredValue * 1000000)};
			}
        },
    },
	co2_config: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0202)) {
                result.forced_recalibration = ['OFF', 'ON'][msg.data[0x0202]];
            }
            if (msg.data.hasOwnProperty(0x0206)) {
                result.factory_reset_co2 = ['OFF', 'ON'][msg.data[0x0206]];
            }
            if (msg.data.hasOwnProperty(0x0205)) {
                result.set_altitude = msg.data[0x0205];
            }
            if (msg.data.hasOwnProperty(0x0207)) {
                result.manual_forced_recalibration = msg.data[0x0207];
            }
			if (msg.data.hasOwnProperty(0x0211)) {
				result.light_indicator = ['OFF', 'ON'][msg.data[0x0211]];
            }
			if (msg.data.hasOwnProperty(0x0209)) {
                result.light_ind_level = msg.data[0x0209];
            }
			if (msg.data.hasOwnProperty(0x0402)) {
                result.automatic_scal = ['OFF', 'ON'][msg.data[0x0402]];
            }
			if (msg.data.hasOwnProperty(0x0201)) {
                result.reading_delay = msg.data[0x0201];
            }
            return result;
        },
    },
	temperaturef_config: {
        cluster: 'msTemperatureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0410)) {
                result.temperature_offset = parseFloat(msg.data[0x0410])/10.0;
            }
            return result;
        },
    },
    humidity_config: {
        cluster: 'msRelativeHumidity',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0210)) {
                result.humidity_offset = msg.data[0x0210];
            }
            return result;
        },
    },
	co2_gasstat_config: {
        cluster: 'msCO2',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0221)) {
                result.high_gas = msg.data[0x0221];
            }
			if (msg.data.hasOwnProperty(0x0222)) {
                result.low_gas = msg.data[0x0222];
            }
            if (msg.data.hasOwnProperty(0x0220)) {
                result.enable_gas = ['OFF', 'ON'][msg.data[0x0220]];
            }
			if (msg.data.hasOwnProperty(0x0225)) {
                result.invert_logic_gas = ['OFF', 'ON'][msg.data[0x0225]];
            }
            return result;
        },
    },
};

const definition = {
        zigbeeModel: ['EFEKTA_CO2_Smart_Monitor'],
        model: 'EFEKTA_CO2_Smart_Monitor',
        vendor: 'Custom devices (DiY)',
        description: '[EFEKTA CO2 Smart Monitor, ws2812b indicator, can control the relay, binding on some other devices](https://efektalab.com/CO2_Monitor)',
        fromZigbee: [fz.temperature, fz.humidity, fzLocal.co2, fzLocal.co2_config, fzLocal.temperaturef_config, fzLocal.humidity_config, fzLocal.co2_gasstat_config],
        toZigbee: [tz.factory_reset, tzLocal.co2_config, tzLocal.temperaturef_config, tzLocal.humidity_config, tzLocal.co2_gasstat_config],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(1);
            const clusters = ['msTemperatureMeasurement', 'msRelativeHumidity', 'msCO2'];
			await reporting.bind(endpoint, coordinatorEndpoint, clusters);
			const payload1 = [{attribute: {ID: 0x0000, type: 0x39},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
            await endpoint.configureReporting('msCO2', payload1);
			const payload2 = [{attribute: {ID: 0x0000, type: 0x29},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
			await endpoint.configureReporting('msTemperatureMeasurement', payload2);
			const payload3 = [{attribute: {ID: 0x0000, type: 0x21},
            minimumReportInterval: 0, maximumReportInterval: 600, reportableChange: 0}];
			await endpoint.configureReporting('msRelativeHumidity', payload3);
        },
        exposes: [e.co2(), e.temperature(), e.humidity(),
		    exposes.numeric('reading_delay', ea.STATE_SET).withUnit('Seconds').withDescription('Setting the sensor reading delay. Setting the time in seconds, by default 30 seconds')
                .withValueMin(30).withValueMax(600),
            exposes.binary('light_indicator', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable or Disable light_indicator'),
			exposes.numeric('light_ind_level', ea.STATE_SET).withUnit('%').withDescription('light_indicator_level')
                .withValueMin(0).withValueMax(100),
			exposes.numeric('set_altitude', ea.STATE_SET).withUnit('meters').withDescription('Setting the altitude above sea level (for high accuracy of the CO2 sensor)')
                .withValueMin(0).withValueMax(3000),
			exposes.numeric('temperature_offset', ea.STATE_SET).withUnit('°C').withValueStep(0.1).withDescription('Adjust temperature')
                .withValueMin(-50.0).withValueMax(50.0),
            exposes.numeric('humidity_offset', ea.STATE_SET).withUnit('%').withDescription('Adjust humidity')
                .withValueMin(-50).withValueMax(50),
			exposes.binary('forced_recalibration', ea.STATE_SET, 'ON', 'OFF').withDescription('Start FRC (Perform Forced Recalibration of the CO2 Sensor in the fresh air)'),
			exposes.numeric('manual_forced_recalibration', ea.STATE_SET).withUnit('ppm').withDescription('Start FRC (Perform Forced Recalibration of the CO2 Sensor according to data from another sensor)')
                .withValueMin(0).withValueMax(5000),
			exposes.binary('automatic_scal', ea.STATE_SET, 'ON', 'OFF')
			    .withDescription('Automatic self calibration'),
			exposes.binary('factory_reset_co2', ea.STATE_SET, 'ON', 'OFF').withDescription('Factory Reset CO2 sensor'),
			exposes.binary('enable_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable CO2 Gas Control'),
			exposes.binary('invert_logic_gas', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable invert logic CO2 Gas Control'),
            exposes.numeric('high_gas', ea.STATE_SET).withUnit('ppm').withDescription('Setting High CO2 Gas Border')
                .withValueMin(400).withValueMax(2000),
            exposes.numeric('low_gas', ea.STATE_SET).withUnit('ppm').withDescription('Setting Low CO2 Gas Border')
                .withValueMin(400).withValueMax(2000)],
};

module.exports = definition;