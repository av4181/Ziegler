/**
 * @file componentData.ts
 *
 * This file contains the physical property data for pure components.
 * The data is structured to be used by the calculation functions in 'physicalProperties.ts'.
 * This data was converted from the original Excel/CSV files.
 */

import type { PureComponent, PropertyCoefficients } from './physicalProperties';

// ===================================================================================
// DATA LIBRARY
// ===================================================================================
// We use a Map for efficient lookup of components by their name.
export const componentLibrary = new Map<string, PureComponent>();

// --- ETHYLENE ---
const ethylene_constants = {
    name: 'ETHYLENE',
    molecular_weight: 28.054,
    critical_temperature: 282.35, // K
    critical_pressure: 50.40,     // bar
    acentric_factor: 0.087,
    enthalpy_formation: 52467,   // J/mol (assuming original value was this unit)
};

const ethylene_properties = new Map<string, PropertyCoefficients>();
ethylene_properties.set('Vapor heat capacity', {
    property_name: 'Vapor heat capacity',
    correlation_type: 'Type1',
    has_intervals: true,
    interval_count: 2,
    T_min: [200, 500],
    T_max: [500, 1500],
    coeff_0: [1.424e+4, 5.869e+4],
    coeff_1: [7.550e+1, -6.650e+1],
    coeff_2: [-1.800e-2, 2.370e-1],
    coeff_3: [0, -1.280e-4],
    coeff_4: [0, 2.530e-8],
});
ethylene_properties.set('Liquid viscosity', {
    property_name: 'Liquid viscosity',
    correlation_type: 'Type2',
    has_intervals: false,
    coeff_0: [-6.4013],
    coeff_1: [183.56],
    coeff_2: [0],
    coeff_3: [0.019],
    coeff_4: [1], // Exponent
});
// ... other properties for ethylene would be added here in the same way

const ethylene: PureComponent = {
    constants: ethylene_constants,
    properties: ethylene_properties,
    calculated_properties: new Map<string, number>(),
};
componentLibrary.set('ETHYLENE', ethylene);


// --- 1-HEXENE ---
const hexene_constants = {
    name: '1-HEXENE',
    molecular_weight: 84.161,
    critical_temperature: 504.0, // K
    critical_pressure: 31.10,     // bar
    acentric_factor: 0.281,
    enthalpy_formation: -41160,
};

const hexene_properties = new Map<string, PropertyCoefficients>();
hexene_properties.set('Vapor heat capacity', {
    property_name: 'Vapor heat capacity',
    correlation_type: 'Type1',
    has_intervals: false,
    coeff_0: [2.579e+4],
    coeff_1: [3.332e+2],
    coeff_2: [-8.470e-2],
    coeff_3: [-2.180e-5],
    coeff_4: [0],
});
// ... other properties for 1-hexene would be added here

const hexene: PureComponent = {
    constants: hexene_constants,
    properties: hexene_properties,
    calculated_properties: new Map<string, number>(),
};
componentLibrary.set('1-HEXENE', hexene);

// ... Other components like NITROGEN, HYDROGEN, etc. would be added here
