/**
 * @file zieglerModel.ts
 *
 * This file contains the logic for the Ziegler-Natta polymerization kinetic model.
 * It calculates reaction rates based on various inputs like monomer concentrations and temperature.
 */

// ===================================================================================
// 1. INTERFACES for TYPE-SAFE INPUTS and OUTPUTS
// ===================================================================================

/**
 * Defines the inputs required for the reaction rate calculation.
 */
export interface ZieglerModelInputs {
    // Concentrations and operational parameters
    hydrogen: number;          // H2: Hydrogen concentration (moles/liter)
    ethylene: number;          // M1: Ethylene monomer concentration (moles/liter)
    hexene: number;            // M2: 1-Hexene comonomer concentration (moles/liter)
    catalyst: number;          // S: Inactive catalyst sites concentration (moles/liter)
    cr6: number;               // S1: Inactive catalyst sites type bis (moles/liter)
    cocatalyst: number;        // c: Cocatalyst concentration (moles/liter)
    volume: number;            // V: Reactor volume (liters)
    temperature: number;       // T: Reactor temperature (Kelvin)
    reactorFlag: number;       // flag1: Selects the reactor for 'eth' constant

    // Concentrations of active sites (original N0_j, mapped to z0_j)
    activeSites_z0_1: number; // N0_1: Active sites type 1 (moles/liter)
    activeSites_z0_2: number; // N0_2: Active sites type 2 (moles/liter)

    // Concentrations of living polymers ending with monomer type i on site j (original N(i,j), mapped to z(i,j))
    livingPolymerEnd_z1_1: number; // N1_1: Living polymer ending in M1 on site 1
    livingPolymerEnd_z1_2: number; // N1_2: Living polymer ending in M1 on site 2
    livingPolymerEnd_z2_1: number; // N2_1: Living polymer ending in M2 on site 1
    livingPolymerEnd_z2_2: number; // N2_2: Living polymer ending in M2 on site 2

    // The model uses the living polymer moments directly as state variables.
    // The dead polymer moments are typically just for output/analysis, so they aren't inputs to the rate calculation itself.
    livingPolymerMoment0_y0_1: number; // Y0_1: Zeroth moment of living polymer on site 1
    livingPolymerMoment0_y0_2: number; // Y0_2: Zeroth moment of living polymer on site 2
    livingPolymerMoment1_y1_1: number; // Y1_1: First moment of living polymer on site 1
    livingPolymerMoment1_y1_2: number; // Y1_2: First moment of living polymer on site 2
    livingPolymerMoment2_y2_1: number; // Y2_1: Second moment of living polymer on site 1
    livingPolymerMoment2_y2_2: number; // Y2_2: Second moment of living polymer on site 2
}

/**
 * Defines the output object containing all calculated reaction rates.
 * Public variables
 */
export interface ZieglerModelOutputs {
    polymerProductionRate: number;      // RP: Polymer production rate (g/h)
    rateNitrogen: number;
    rateEthylene: number;               // REthylene (mol/h)
    rateEthane: number;
    ratePropane: number;
    rateButene: number;
    rateIsobutane: number;
    rateHexene: number;                 // RHexene (mol/h)
    rateHexane: number;
    rateWater: number;
    rateCarbonMonoxide: number;
    rateMethane: number;
    rateHydrogen: number;               // RHydrogen (mol/h)
    rateEthylenesegment: number;
    rateHexenesegment: number;
    rateCatalyst: number;               // RCatalyst (rate for S in mol/h)
    rateCocatalyst: number;             // RCocatalyst (rate for c in mol/h)
    rateCr6: number;                    // Rcr6_ (rate for S1 in mol/h)
    rateDeadPolymerMoment0_x0_1: number;
    rateDeadPolymerMoment0_x0_2: number;
    rateDeadPolymerMoment1_x1_1: number;
    rateDeadPolymerMoment1_x1_2: number;
    rateDeadPolymerMoment2_x2_1: number;
    rateDeadPolymerMoment2_x2_2: number;
    rateLivingPolymerMoment0_y0_1: number;
    rateLivingPolymerMoment0_y0_2: number;
    rateLivingPolymerMoment1_y1_1: number;
    rateLivingPolymerMoment1_y1_2: number;
    rateLivingPolymerMoment2_y2_1: number;
    rateLivingPolymerMoment2_y2_2: number;
    rateActiveSites_z0_1: number;
    rateActiveSites_z0_2: number;
    rateLivingPolymerEnd_z1_1: number;
    rateLivingPolymerEnd_z1_2: number;
    rateLivingPolymerEnd_z2_1: number;
    rateLivingPolymerEnd_z2_2: number;
    ratePolymerMass: number; // RXP_ (same as polymerProductionRate)
}


// ===================================================================================
// 2. MAIN CALCULATION FUNCTION
// ===================================================================================

/**
 * Calculates the reaction rates for the Ziegler-Natta polymerization process.
 * @param inputs An object containing all necessary input values.
 * @returns An object containing all calculated reaction rates.
 */
export function calculateReactionRates(inputs: ZieglerModelInputs): ZieglerModelOutputs {

    const {
        hydrogen: H2,
        ethylene: M1,
        hexene: M2,
        activeSites_z0_1: N0_1,
        activeSites_z0_2: N0_2,
        livingPolymerEnd_z1_1: N1_1,
        livingPolymerEnd_z1_2: N1_2,
        livingPolymerEnd_z2_1: N2_1,
        livingPolymerEnd_z2_2: N2_2,
        catalyst: S,
        cr6: S1,
        livingPolymerMoment0_y0_1: Y0_1,
        livingPolymerMoment0_y0_2: Y0_2,
        livingPolymerMoment1_y1_1: Y1_1,
        livingPolymerMoment1_y1_2: Y1_2,
        livingPolymerMoment2_y2_1: Y2_1,
        livingPolymerMoment2_y2_2: Y2_2,
        volume: V,
        temperature: T,
        cocatalyst: c,
        reactorFlag,
    } = inputs;

    // ===============================================================================
    // 3. CONSTANTS AND LOCAL VARIABLES
    // ===============================================================================

    // --- Fixed constants and molecular weights ---
    const MC2 = 28; // Molecular weight of C2 (Ethylene) g/mol
    const MC6 = 84; // Molecular weight of C6 (1-Hexene) g/mol
    const MH2 = 2;  // Molecular weight of H2 (Hydrogen) g/mol

    // --- Kinetic model parameters (Arrhenius pre-exponential factors 'a' and activation energies 'b') ---

    // -- Activation Parameters --
    // These parameters control the conversion of inactive to active catalyst sites.
    const aka = 1.90413, bka = 2.35352;
    const akaa = 42.8061, bkaa = 2.07067;
    const akaH = 43.4913, bkaH = 1.81544;

    // -- Initiation Parameters --
    // These parameters control the start of a new polymer chain on an active site.
    const ai1_1 = 2.72252, bi1_1 = 0.00164819;
    const ai1_2 = 0.0190001, bi1_2 = 2.76802;
    const ai2_1 = 0.00158295, bi2_1 = 75.0948;
    const ai2_2 = 2.49924, bi2_2 = 3.86923;

    // -- Propagation Parameters --
    // These parameters control the growth of the polymer chain by adding monomers.
    const ap11_1 = 23.5079, bp11_1 = 62.7073;
    const ap11_2 = 44.4108489690084, bp11_2 = 9.02536689954115;
    const ap12_1 = 7.45487, bp12_1 = 570.828;
    const ap12_2 = 16.6269298831462, bp12_2 = 1.34505395511823E-02;
    const ap21_1 = 11.7691, bp21_1 = 13.1246;
    const ap21_2 = 13.0385236154171, bp21_2 = 7.12672329782542E-02;
    const ap22_1 = 0.0506817, bp22_1 = 91.5249;
    const ap22_2 = 10.2482861977761, bp22_2 = 245.73403529402;

    // -- Transfer Parameters --
    // These parameters control the stopping of a chain, which yields a 'dead' polymer and a new active site.
    const at11_1 = 1.91232, bt11_1 = 574.851;
    const at11_2 = 2.12135, bt11_2 = 198.691;
    const at12_1 = 2.3086, bt12_1 = 598.13;
    const at12_2 = 1.92168, bt12_2 = 449.254;
    const at21_1 = 1.88274, bt21_1 = 10.4787;
    const at21_2 = 1.81545, bt21_2 = 50.6018;
    const at22_1 = 1.85856, bt22_1 = 15.4026;
    const at22_2 = 2.041, bt22_2 = 476.019;
    const atH1_1 = 8.24086, btH1_1 = 24.0953;
    const atH1_2 = 7.87596, btH1_2 = 2.95216;
    const atH2_1 = 10.4391, btH2_1 = 0.00153492;
    const atH2_2 = 0.806824, btH2_2 = 46.4001;

    // -- Termination Parameters --
    // These parameters control the irreversible deactivation of a growing chain.
    const ate1_1 = 2.01811, bte1_1 = 13.8224;
    const ate1_2 = 1.99198, bte1_2 = 15.4759;
    const ate2_1 = 1.83056, bte2_1 = 15.2807;
    const ate2_2 = 2.11061, bte2_2 = 10.8984;

    // -- Other Parameters --
    const aethane = 0.0010069, bethane = 3.06806; // For a side reaction
    const teta1 = 0.624963;
    const teta2 = 1 - teta1;

    // ===============================================================================
    // 4. CALCULATION LOGIC
    // ===============================================================================

    // --- Intermediate calculated variables ---
    let eth: number;
    switch (reactorFlag) {
        case 1: eth = 5.34329; break;
        case 2: eth = 1.13724; break;
        case 3: eth = 0.318066; break;
        case 4: eth = 0.456617; break;
        default: eth = 0;
    }

    const totalMonomerConcentration = M1 + M2;
    const f1 = M1 / (totalMonomerConcentration + 1E-25);
    const f2 = M2 / (totalMonomerConcentration + 1E-25);

    const phi1_1 = N1_1 / (N1_1 + N2_1 + 1E-25);
    const phi1_2 = N1_2 / (N1_2 + N2_2 + 1E-25);
    const phi2_1 = 1 - phi1_1;
    const phi2_2 = 1 - phi1_2;

    // --- Kinetic constants calculation (Arrhenius equation) ---
    // k = exp(a) * exp(-exp(b) / T)
    const kethane = Math.exp(aethane) * Math.exp(-Math.exp(bethane) / T);
    const ka = Math.exp(aka) * Math.exp(-Math.exp(bka) / T);
    const kaa = Math.exp(akaa) * Math.exp(-Math.exp(bkaa) / T);
    const kaH = Math.exp(akaH) * Math.exp(-Math.exp(bkaH) / T);
    const ki1_1 = Math.exp(ai1_1) * Math.exp(-Math.exp(bi1_1) / T);
    const ki1_2 = Math.exp(ai1_2) * Math.exp(-Math.exp(bi1_2) / T);
    const ki2_1 = Math.exp(ai2_1) * Math.exp(-Math.exp(bi2_1) / T);
    const ki2_2 = Math.exp(ai2_2) * Math.exp(-Math.exp(bi2_2) / T);
    const kp11_1 = Math.exp(ap11_1) * Math.exp(-Math.exp(bp11_1) / T);
    const kp11_2 = Math.exp(ap11_2) * Math.exp(-Math.exp(bp11_2) / T);
    const kp12_1 = Math.exp(ap12_1) * Math.exp(-Math.exp(bp12_1) / T);
    const kp12_2 = Math.exp(ap12_2) * Math.exp(-Math.exp(bp12_2) / T);
    const kp21_1 = Math.exp(ap21_1) * Math.exp(-Math.exp(bp21_1) / T);
    const kp21_2 = Math.exp(ap21_2) * Math.exp(-Math.exp(bp21_2) / T);
    const kp22_1 = Math.exp(ap22_1) * Math.exp(-Math.exp(bp22_1) / T);
    const kp22_2 = Math.exp(ap22_2) * Math.exp(-Math.exp(bp22_2) / T);
    const kt11_1 = Math.exp(at11_1) * Math.exp(-Math.exp(bt11_1) / T);
    const kt11_2 = Math.exp(at11_2) * Math.exp(-Math.exp(bt11_2) / T);
    const kt12_1 = Math.exp(at12_1) * Math.exp(-Math.exp(bt12_1) / T);
    const kt12_2 = Math.exp(at12_2) * Math.exp(-Math.exp(bt12_2) / T);
    const kt21_1 = Math.exp(at21_1) * Math.exp(-Math.exp(bt21_1) / T);
    const kt21_2 = Math.exp(at21_2) * Math.exp(-Math.exp(bt21_2) / T);
    const kt22_1 = Math.exp(at22_1) * Math.exp(-Math.exp(bt22_1) / T);
    const kt22_2 = Math.exp(at22_2) * Math.exp(-Math.exp(bt22_2) / T);
    const ktH1_1 = Math.exp(atH1_1) * Math.exp(-Math.exp(btH1_1) / T);
    const ktH1_2 = Math.exp(atH1_2) * Math.exp(-Math.exp(btH1_2) / T);
    const ktH2_1 = Math.exp(atH2_1) * Math.exp(-Math.exp(btH2_1) / T);
    const ktH2_2 = Math.exp(atH2_2) * Math.exp(-Math.exp(btH2_2) / T);
    const kte1_1 = Math.exp(ate1_1) * Math.exp(-Math.exp(bte1_1) / T);
    const kte1_2 = Math.exp(ate1_2) * Math.exp(-Math.exp(bte1_2) / T);
    const kte2_1 = Math.exp(ate2_1) * Math.exp(-Math.exp(bte2_1) / T);
    const kte2_2 = Math.exp(ate2_2) * Math.exp(-Math.exp(bte2_2) / T);

    // --- Pseudo-constants calculation ---
    const pseudo_ki_1 = (ki1_1 * f1 + ki2_1 * f2);
    const pseudo_ki_2 = (ki1_2 * f1 + ki2_2 * f2);
    const pseudo_kp_1 = (kp11_1 * f1 * phi1_1 + kp21_1 * f1 * phi2_1 + kp22_1 * f2 * phi2_1 + kp12_1 * phi1_1 * f2);
    const pseudo_kp_2 = (kp11_2 * f1 * phi1_2 + kp21_2 * f1 * phi2_2 + kp22_2 * f2 * phi2_2 + kp12_2 * phi1_2 * f2);
    const pseudo_kt_1 = (kt11_1 * f1 * phi1_1 + kt21_1 * f1 * phi2_1 + kt22_1 * f2 * phi2_1 + kt12_1 * phi1_1 * f2);
    const pseudo_kt_2 = (kt11_2 * f1 * phi1_2 + kt21_2 * f1 * phi2_2 + kt22_2 * f2 * phi2_2 + kt12_2 * phi1_2 * f2);
    const pseudo_ktH_1 = (ktH1_1 * phi1_1 + ktH2_1 * phi2_1);
    const pseudo_ktH_2 = (ktH1_2 * phi1_2 + ktH2_2 * phi2_2);
    const pseudo_kte_1 = (kte1_1 * phi1_1 + kte2_1 * phi2_1);
    const pseudo_kte_2 = (kte1_2 * phi1_2 + kte2_2 * phi2_2);

    // --- Rate equations (R refers to d[...]/dt) ---
    // Monomer consumption rates
    const RM1 = -N0_1 * M1 * ki1_1 - N0_2 * M1 * ki1_2 - M1 * Y0_1 * (kp11_1 * phi1_1 + kt11_1 * phi1_1 + kp21_1 * phi2_1 + kt21_1 * phi2_1) - M1 * Y0_2 * (kp11_2 * phi1_2 + kt11_2 * phi1_2 + kp21_2 * phi2_2 + kt21_2 * phi2_2);
    const RM2 = -N0_1 * M2 * ki2_1 - N0_2 * M2 * ki2_2 - M2 * Y0_1 * (kp22_1 * phi2_1 + kt22_1 * phi2_1 + kp12_1 * phi1_1 + kt12_1 * phi1_1) - M2 * Y0_2 * (kp22_2 * phi2_2 + kt22_2 * phi2_2 + kp12_2 * phi1_2 + kt12_2 * phi1_2);

    // Hydrogen consumption rate
    const RH2 = -Y0_1 * H2 * (ktH1_1 + ktH2_1) - Y0_2 * H2 * (ktH1_2 + ktH2_2) - kaH * H2 * S1 - kethane * H2 * eth;

    // Catalyst site rates
    const RS = -ka * S * c - kaa * c * S;
    const RS1 = -kaH * H2 * S1 + kaa * c * S;
    const RC = -ka * S * c - kaa * c * S;

    // Active site rates (formation and consumption)
    const RN0_1 = (ka * S * c + kaH * H2 * S1) * teta1 - ki1_1 * N0_1 * M1 - ki2_1 * N0_1 * M2;
    const RN0_2 = (ka * S * c + kaH * H2 * S1) * teta2 - ki1_2 * N0_2 * M1 - ki2_2 * N0_2 * M2;

    // Living polymer moments rates
    const RY0_1 = N0_1 * totalMonomerConcentration * pseudo_ki_1 - Y0_1 * pseudo_kte_1 - Y0_1 * H2 * pseudo_ktH_1;
    const RY0_2 = N0_2 * totalMonomerConcentration * pseudo_ki_2 - Y0_2 * pseudo_kte_2 - Y0_2 * H2 * pseudo_ktH_2;
    const RY1_1 = N0_1 * totalMonomerConcentration * pseudo_ki_1 + totalMonomerConcentration * Y0_1 * (pseudo_kp_1 + pseudo_kt_1) - totalMonomerConcentration * Y1_1 * pseudo_kt_1 - Y1_1 * (H2 * pseudo_ktH_1 + pseudo_kte_1);
    const RY1_2 = N0_2 * totalMonomerConcentration * pseudo_ki_2 + totalMonomerConcentration * Y0_2 * (pseudo_kp_2 + pseudo_kt_2) - totalMonomerConcentration * Y1_2 * pseudo_kt_2 - Y1_2 * (H2 * pseudo_ktH_2 + pseudo_kte_2);
    const RY2_1 = N0_1 * totalMonomerConcentration * pseudo_ki_1 + totalMonomerConcentration * Y0_1 * (pseudo_kp_1 + pseudo_kt_1) + 2 * totalMonomerConcentration * pseudo_kp_1 * Y1_1 - Y2_1 * (pseudo_kt_1 * totalMonomerConcentration + pseudo_ktH_1 * H2 + pseudo_kte_1);
    const RY2_2 = N0_2 * totalMonomerConcentration * pseudo_ki_2 + totalMonomerConcentration * Y0_2 * (pseudo_kp_2 + pseudo_kt_2) + 2 * totalMonomerConcentration * pseudo_kp_2 * Y1_2 - Y2_2 * (pseudo_kt_2 * totalMonomerConcentration + pseudo_ktH_2 * H2 + pseudo_kte_2);

    // Dead polymer moments rates
    const Rx0_1 = Y0_1 * (totalMonomerConcentration * pseudo_kt_1 + pseudo_ktH_1 * H2 + pseudo_kte_1);
    const Rx0_2 = Y0_2 * (totalMonomerConcentration * pseudo_kt_2 + pseudo_ktH_2 * H2 + pseudo_kte_2);
    const Rx1_1 = Y1_1 * (totalMonomerConcentration * pseudo_kt_1 + pseudo_ktH_1 * H2 + pseudo_kte_1);
    const Rx1_2 = Y1_2 * (totalMonomerConcentration * pseudo_kt_2 + pseudo_ktH_2 * H2 + pseudo_kte_2);
    const Rx2_1 = Y2_1 * (totalMonomerConcentration * pseudo_kt_1 + pseudo_ktH_1 * H2 + pseudo_kte_1);
    const Rx2_2 = Y2_2 * (totalMonomerConcentration * pseudo_kt_2 + pseudo_ktH_2 * H2 + pseudo_kte_2);

    // Living polymer end-group rates
    const RN1_1 = ki1_1 * M1 * N0_1 + kp21_1 * N2_1 * M1 + kt21_1 * N2_1 * M1 - ktH1_1 * H2 * N1_1 - kte1_1 * N1_1 - kp12_1 * N1_1 * M2 - kt12_1 * N1_1 * M2;
    const RN1_2 = ki1_2 * M1 * N0_2 + kp21_2 * N2_2 * M1 + kt21_2 * N2_2 * M1 - ktH1_2 * H2 * N1_2 - kte1_2 * N1_2 - kp12_2 * N1_2 * M2 - kt12_2 * N1_2 * M2;
    const RN2_1 = ki2_1 * M2 * N0_1 + kp12_1 * N1_1 * M2 + kt12_1 * N1_1 * M2 - kp21_1 * N2_1 * M1 - kt21_1 * N2_1 * M1 - ktH2_1 * H2 * N2_1 - kte2_1 * N2_1;
    const RN2_2 = ki2_2 * M2 * N0_2 + kp12_2 * N1_2 * M2 + kt12_2 * N1_2 * M2 - kp21_2 * N2_2 * M1 - kt21_2 * N2_2 * M1 - ktH2_2 * H2 * N2_2 - kte2_2 * N2_2;

    // Total polymer production rate in g/h
    const polymerRate_M1_consumption = -RM1; // Consumption is the negative of the rate of change
    const polymerRate_M2_consumption = -RM2;
    const polymerRateGrams = (polymerRate_M1_consumption * MC2 + polymerRate_M2_consumption * MC6) * V;

    // ===============================================================================
    // 5. RETURN THE OUTPUTS (rates are converted from mol/L/h to mol/h)
    // ===============================================================================

    const outputs: ZieglerModelOutputs = {
        polymerProductionRate: polymerRateGrams,
        ratePolymerMass: polymerRateGrams,
        rateNitrogen: 0,
        rateEthylene: RM1 * V,
        rateEthane: 0,
        ratePropane: 0,
        rateButene: 0,
        rateIsobutane: 0,
        rateHexene: RM2 * V,
        rateHexane: 0,
        rateWater: 0,
        rateCarbonMonoxide: 0,
        rateMethane: 0,
        rateHydrogen: RH2 * V,
        rateEthylenesegment: 0,
        rateHexenesegment: 0,
        rateCatalyst: RS * V,
        rateCocatalyst: RC * V,
        rateCr6: RS1 * V,
        rateDeadPolymerMoment0_x0_1: Rx0_1 * V,
        rateDeadPolymerMoment0_x0_2: Rx0_2 * V,
        rateDeadPolymerMoment1_x1_1: Rx1_1 * V,
        rateDeadPolymerMoment1_x1_2: Rx1_2 * V,
        rateDeadPolymerMoment2_x2_1: Rx2_1 * V,
        rateDeadPolymerMoment2_x2_2: Rx2_2 * V,
        rateLivingPolymerMoment0_y0_1: RY0_1 * V,
        rateLivingPolymerMoment0_y0_2: RY0_2 * V,
        rateLivingPolymerMoment1_y1_1: RY1_1 * V,
        rateLivingPolymerMoment1_y1_2: RY1_2 * V,
        rateLivingPolymerMoment2_y2_1: RY2_1 * V,
        rateLivingPolymerMoment2_y2_2: RY2_2 * V,
        rateActiveSites_z0_1: RN0_1 * V,
        rateActiveSites_z0_2: RN0_2 * V,
        rateLivingPolymerEnd_z1_1: RN1_1 * V,
        rateLivingPolymerEnd_z1_2: RN1_2 * V,
        rateLivingPolymerEnd_z2_1: RN2_1 * V,
        rateLivingPolymerEnd_z2_2: RN2_2 * V,
    };

    return outputs;
}
