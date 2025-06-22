/**
 * @file unitConverter.ts
 *
 * This module provides functions for converting values between different physical units.
 * It is a TypeScript conversion of the original 'Conversion' Visual Basic module.
 */

// ===================================================================================
// 1. TYPE DEFINITIONS FOR UNITS
// ===================================================================================

// Defines the categories of units we can convert
export enum UnitType {
    Pressure = 'Pressure',
    Temperature = 'Temperature',
    Mass = 'Mass',
    Length = 'Length',
    Volume = 'Volume',
    Viscosity = 'Viscosity',
    // Add other types as needed
}

// Defines all possible units for each category
export type PressureUnit = 'bar' | 'atm' | 'psi';
export type TemperatureUnit = 'C' | 'K' | 'F';
export type MassUnit = 'kg' | 'g' | 'lbm';
// ... define other unit types

export type Unit = PressureUnit | TemperatureUnit | MassUnit; // Add other unit types here

// ===================================================================================
// 2. CONVERSION FACTORS
// ===================================================================================
// We store conversion factors relative to a base unit for each category (e.g., SI unit).

// Base unit for pressure is 'bar'
const pressureFactors = new Map<PressureUnit, number>([
    ['bar', 1],
    ['atm', 1 / 1.01325],
    ['psi', 14.50377],
]);

// Base unit for mass is 'kg'
const massFactors = new Map<MassUnit, number>([
    ['kg', 1],
    ['g', 1000],
    ['lbm', 2.20462],
]);

// ... define other factor maps here

// ===================================================================================
// 3. CONVERSION FUNCTION
// ===================================================================================

/**
 * Converts a numeric value from a source unit to a target unit.
 * @param value The numeric value to convert.
 * @param fromUnit The starting unit.
 * @param toUnit The target unit.
 * @param unitType The category of the unit (e.g., Pressure, Temperature).
 * @returns The converted value.
 */
export function convertUnit(value: number, fromUnit: Unit, toUnit: Unit, unitType: UnitType): number {
    if (fromUnit === toUnit) {
        return value;
    }

    // Temperature is a special case (affine transformation, not just multiplication)
    if (unitType === UnitType.Temperature) {
        let valueInKelvin: number;
        // First, convert from source unit to the base unit (Kelvin)
        switch (fromUnit) {
            case 'C':
                valueInKelvin = value + 273.15;
                break;
            case 'F':
                valueInKelvin = (value - 32) * (5 / 9) + 273.15;
                break;
            case 'K':
                valueInKelvin = value;
                break;
            default:
                throw new Error(`Unknown 'from' temperature unit: ${fromUnit}`);
        }

        // Then, convert from Kelvin to the target unit
        switch (toUnit) {
            case 'C':
                return valueInKelvin - 273.15;
            case 'F':
                return (valueInKelvin - 273.15) * (9 / 5) + 32;
            case 'K':
                return valueInKelvin;
            default:
                throw new Error(`Unknown 'to' temperature unit: ${toUnit}`);
        }
    }

    // For all other units, use the factor-based approach
    let factors: Map<Unit, number> | undefined;

    switch (unitType) {
        case UnitType.Pressure:
            factors = pressureFactors as Map<Unit, number>;
            break;
        case UnitType.Mass:
            factors = massFactors as Map<Unit, number>;
            break;
        // Add cases for other unit types
        default:
            throw new Error(`Unit type "${unitType}" not implemented.`);
    }

    const fromFactor = factors.get(fromUnit);
    const toFactor = factors.get(toUnit);

    if (fromFactor === undefined || toFactor === undefined) {
        throw new Error(`Invalid units for type "${unitType}": from '${fromUnit}', to '${toUnit}'`);
    }

    // Convert the value to the base unit, then to the target unit.
    const valueInBase = value / fromFactor;
    return valueInBase * toFactor;
}

/*
// Example Usage:
try {
    const psi = convertUnit(10, 'bar', 'psi', UnitType.Pressure);
    console.log(`10 bar is approx. ${psi.toFixed(2)} psi`); // ~145.04 psi

    const celsius = convertUnit(373.15, 'K', 'C', UnitType.Temperature);
    console.log(`373.15 K is ${celsius}°C`); // 100°C
} catch (e) {
    console.error(e);
}
*/
