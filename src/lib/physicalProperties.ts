/**
 * @file physicalProperties.ts
 *
 * This module is responsible for calculating temperature-dependent physical properties
 * of pure components using various correlation types.
 *
 * Original source: Visual Basic modules for property calculation.
 */
import { componentLibrary } from './componentData';

// ===================================================================================
// 1. DATA STRUCTURES & INTERFACES
// ===================================================================================

/**
 * Represents the coefficients for a specific property correlation.
 * In the VB code, this was a class 'Coefficients_Propriétée'.
 */
export interface PropertyCoefficients {
    property_name: string;
    correlation_type: 'Type1' | 'Type2' | 'Type3' | 'Type4' | 'Type5' | 'Type6';
    // For correlations with temperature intervals
    has_intervals: boolean;
    interval_count?: number;
    T_min?: number[];
    T_max?: number[];
    // All correlations use up to 5 coefficients
    coeff_0: number[];
    coeff_1: number[];
    coeff_2: number[];
    coeff_3: number[];
    coeff_4: number[];
}

/**
 * Represents the fixed constants for a pure component.
 */
export interface ComponentConstants {
    name: string;
    molecular_weight: number;
    critical_temperature: number; // K
    critical_pressure: number;    // bar
    acentric_factor: number;
    enthalpy_formation: number;   // HForm
}

/**
 * Represents a pure component with its constants and properties.
 */
export interface PureComponent {
    constants: ComponentConstants;
    properties: Map<string, PropertyCoefficients>; // Map property name to its formula
    calculated_properties: Map<string, number>; // Stores the calculated values
}


// ===================================================================================
// 2. MATHEMATICAL HELPER FUNCTIONS (from VB code)
// ===================================================================================

const sinh = (x: number): number => Math.sinh(x);
const cosh = (x: number): number => Math.cosh(x);
const tanh = (x: number): number => Math.tanh(x);
const coth = (x: number): number => cosh(x) / sinh(x);


// ===================================================================================
// 3. PROPERTY CALCULATION FUNCTIONS (from VB code)
// ===================================================================================

function calcPolynomial(T: number, coeff: PropertyCoefficients, index: number): number {
    return (
        coeff.coeff_0[index] +
        coeff.coeff_1[index] * T +
        coeff.coeff_2[index] * T ** 2 +
        coeff.coeff_3[index] * T ** 3 +
        coeff.coeff_4[index] * T ** 4
    );
}

function calcAntoine(T: number, coeff: PropertyCoefficients, index: number): number {
    return (
        coeff.coeff_0[index] +
        coeff.coeff_1[index] / T +
        coeff.coeff_2[index] * Math.log(T) +
        coeff.coeff_3[index] * T ** coeff.coeff_4[index]
    );
}

function calcType3(T: number, coeff: PropertyCoefficients, index: number): number {
    const term1 = coeff.coeff_0[index] * T ** coeff.coeff_1[index];
    const term2 = 1 + coeff.coeff_2[index] / T + coeff.coeff_3[index] / T ** 2;
    return term1 / term2;
}

function calcHyperbolic(T: number, coeff: PropertyCoefficients, index: number): number {
    const term2_num = coeff.coeff_2[index] / T;
    const term2 = (term2_num / sinh(term2_num)) ** 2;
    const term3_num = coeff.coeff_4[index] / T;
    const term3 = (term3_num / cosh(term3_num)) ** 2;
    return (
        coeff.coeff_0[index] +
        coeff.coeff_1[index] * term2 +
        coeff.coeff_3[index] * term3
    );
}

function calcPuissance(Tr: number, coeff: PropertyCoefficients, index: number): number {
    const exponent =
        coeff.coeff_1[index] +
        coeff.coeff_2[index] * Tr +
        coeff.coeff_3[index] * Tr ** 2 +
        coeff.coeff_4[index] * Tr ** 3;
    return coeff.coeff_0[index] * (1 - Tr) ** exponent;
}

function calcEnthalpy(T: number, coeff: PropertyCoefficients, index: number, HForm: number): number {
    const T_ref = 298.15; // Standard reference temperature
    return (
        HForm +
        coeff.coeff_0[index] * (T - T_ref) +
        coeff.coeff_1[index] * coeff.coeff_2[index] * (coth(coeff.coeff_2[index] / T) - coth(coeff.coeff_2[index] / T_ref)) -
        coeff.coeff_3[index] * coeff.coeff_4[index] * (tanh(coeff.coeff_4[index] / T) - tanh(coeff.coeff_4[index] / T_ref))
    );
}

/**
 * Estimates a property value by interpolation/extrapolation if the temperature is out of range.
 * This is a translation of the 'Interpolation' sub.
 */
function interpolateProperty(T: number, coeff: PropertyCoefficients, component: PureComponent): number {
    let interpValue = 0;
    const Tk = T; // Already in Kelvin
    const Tr = Tk / component.constants.critical_temperature;

    // The VB code logic for interpolation is complex and seems to rely on the *first* interval's T_max.
    // We will replicate this logic. It might need review for physical accuracy.
    if (!coeff.T_max || coeff.T_max.length === 0) return 0; // Cannot interpolate without a reference T_max

    const T_max_ref = coeff.T_max[0];
    const correlationIndex = 0; // Interpolation logic in VB always used the first set of coefficients (temp=1)

    // Temperatures for interpolation points
    const Tk1 = T_max_ref - 10;
    const Tk2 = T_max_ref - 1;
    const Tk3 = T_max_ref * (17 / 16);
    const Tk4 = T_max_ref - 0.01;

    const Tr1 = Tk1 / component.constants.critical_temperature;
    const Tr2 = Tk2 / component.constants.critical_temperature;
    const Tr3 = Tk3 / component.constants.critical_temperature;
    const Tr4 = Tk4 / component.constants.critical_temperature;

    let val1 = 0, val2 = 0, val3 = 0;

    // The logic is split into two main blocks based on temperature
    if (Tk < 1.25 * T_max_ref) { // Extrapolation for a small range
        switch (coeff.correlation_type) {
            case 'Type1':
            case 'Type3':
            case 'Type4':
                val1 = calcFunction(coeff.correlation_type, Tk1, Tr1, coeff, correlationIndex, component.constants.enthalpy_formation);
                val2 = calcFunction(coeff.correlation_type, Tk2, Tr2, coeff, correlationIndex, component.constants.enthalpy_formation);
                interpValue = ((val2 - val1) / (Tk2 - Tk1)) * (Tk - Tk1) + val1;
                break;
            case 'Type2':
                val1 = calcAntoine(Tk1, coeff, correlationIndex);
                val2 = calcAntoine(Tk2, coeff, correlationIndex);
                interpValue = Math.exp(((val2 - val1) / (1 / Tk2 - 1 / Tk1)) * (1 / Tk - 1 / Tk1) + val1);
                break;
            case 'Type5':
                if (Tr2 <= 1) {
                    val1 = calcPuissance(Tr1, coeff, correlationIndex);
                    val2 = calcPuissance(Tr2, coeff, correlationIndex);
                    val3 = calcPuissance(Tr4, coeff, correlationIndex);
                    // Quadratic interpolation/extrapolation
                    interpValue = ((val3 - val1) / (Tr4 - Tr1) - (val2 - val1) / (Tr2 - Tr1)) / (Tr4 - Tr2) * (Tr - Tr1) ** 2 + ((val2 - val1) / (Tr2 - Tr1)) * (Tr - Tr1) + val1;
                } else {
                    interpValue = 0;
                }
                break;
        }
    } else { // Far extrapolation, property is considered constant
        switch (coeff.correlation_type) {
            case 'Type1':
            case 'Type3':
            case 'Type4':
                val1 = calcFunction(coeff.correlation_type, Tk1, Tr1, coeff, correlationIndex, component.constants.enthalpy_formation);
                val2 = calcFunction(coeff.correlation_type, Tk2, Tr2, coeff, correlationIndex, component.constants.enthalpy_formation);
                interpValue = ((val2 - val1) / (Tk2 - Tk1)) * (Tk3 - Tk1) + val1;
                break;
            case 'Type2':
                val1 = calcAntoine(Tk1, coeff, correlationIndex);
                val2 = calcAntoine(Tk2, coeff, correlationIndex);
                interpValue = Math.exp(((val2 - val1) / (1 / Tk2 - 1 / Tk1)) * (1 / Tk3 - 1 / Tk1) + val1);
                break;
            case 'Type5':
                if (Tr2 <= 1) {
                    val1 = calcPuissance(Tr1, coeff, correlationIndex);
                    val2 = calcPuissance(Tr2, coeff, correlationIndex);
                    val3 = calcPuissance(Tr4, coeff, correlationIndex);
                    interpValue = ((val3 - val1) / (Tr4 - Tr1) - (val2 - val1) / (Tr2 - Tr1)) / (Tr4 - Tr2) * (Tr3 - Tr1) ** 2 + ((val2 - val1) / (Tr2 - Tr1)) * (Tr3 - Tr1) + val1;
                } else {
                    interpValue = 0;
                }
                break;
        }
    }

    return interpValue;
}

/**
 * A helper to call the correct calculation function dynamically.
 * Used for interpolation where the function type is determined at runtime.
 */
function calcFunction(type: PropertyCoefficients['correlation_type'], Tk: number, Tr: number, coeff: PropertyCoefficients, index: number, hform: number): number {
    switch (type) {
        case 'Type1': return calcPolynomial(Tk, coeff, index);
        case 'Type2': return Math.exp(calcAntoine(Tk, coeff, index));
        case 'Type3': return calcType3(Tk, coeff, index);
        case 'Type4': return calcHyperbolic(Tk, coeff, index);
        case 'Type5': return calcPuissance(Tr, coeff, index);
        case 'Type6': return calcEnthalpy(Tk, coeff, index, hform);
        default: return 0;
    }
}


// ===================================================================================
// 4. MAIN CONTROLLER FUNCTION
// ===================================================================================

/**
 * Calculates all temperature-dependent properties for a list of components.
 * This function replaces the 'Calcul_prop_corps_pur' sub from the VB code.
 * @param componentNames Array of component names to calculate properties for.
 * @param T The temperature in Kelvin.
 * @returns A Map of component names to their updated PureComponent objects.
 */
export function calculateAllProperties(componentNames: string[], T: number): Map<string, PureComponent> {
    const results = new Map<string, PureComponent>();

    for (const name of componentNames) {
        const component = componentLibrary.get(name);
        if (!component) {
            console.warn(`Component "${name}" not found in library. Skipping.`);
            continue;
        }

        // Deep copy the component object to avoid modifying the original library data
        const componentClone = JSON.parse(JSON.stringify(component));
        componentClone.properties = component.properties; // Restore Map from original
        componentClone.calculated_properties = new Map<string, number>();

        const Tk = T; // Assuming input T is already in Kelvin
        const Tr = Tk / componentClone.constants.critical_temperature;

        // Loop through all properties defined for this component
        for (const [propName, propCoeffs] of componentClone.properties.entries()) {
            let value = 0;
            let correlationIndex = -1;

            // Determine which set of coefficients to use based on temperature intervals
            if (propCoeffs.has_intervals && propCoeffs.T_min && propCoeffs.T_max) {
                for (let i = 0; i < (propCoeffs.interval_count || 0); i++) {
                    if (Tk >= propCoeffs.T_min[i] && Tk <= propCoeffs.T_max[i]) {
                        correlationIndex = i;
                        break;
                    }
                }
            } else {
                correlationIndex = 0; // No intervals, use the first (and only) set of coefficients
            }

            if (correlationIndex !== -1) {
                // Temperature is within a valid range
                value = calcFunction(propCoeffs.correlation_type, Tk, Tr, propCoeffs, correlationIndex, componentClone.constants.enthalpy_formation);
            } else {
                // Temperature is out of range, call interpolation
                console.log(`Temperature ${Tk}K is out of range for property "${propName}". Interpolating...`);
                value = interpolateProperty(Tk, propCoeffs, componentClone);
            }

            // Store the calculated value
            componentClone.calculated_properties.set(propName, value);
        }
        results.set(name, componentClone);
    }

    return results;
}
