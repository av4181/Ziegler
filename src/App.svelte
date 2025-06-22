<script lang="ts">
  // Corrected import path for a standard Svelte + Vite project
  import { calculateReactionRates, type ZieglerModelInputs, type ZieglerModelOutputs } from './lib/zieglerModel';
  import { onMount } from 'svelte';

  // ===================================================================================
  // 1. INPUT STATE
  // ===================================================================================
  // Reactive object to hold all input values for the model.
  // Initialized with realistic default values based on the provided PE loop reactor conditions.
  let inputs: ZieglerModelInputs = {
    // --- Main operational parameters (controlled by sliders) ---
    temperature: 363.15,  // Kelvin (90 °C)
    hydrogen: 0.005,      // mol/L (Target: 0-0.01)
    ethylene: 0.08,       // mol/L (Target: 0-0.1)
    hexene: 0.02,         // mol/L (Target: 0-0.04)
    catalyst: 0.0001,     // mol/L (S) - Using previous default
    cr6: 0,               // mol/L (S1, often starts at 0)
    cocatalyst: 0.01,     // mol/L (c) - Using previous default
    volume: 100000,       // Liters (100 m^3)
    reactorFlag: 1,       // Reactor type 1

    // --- State variables (concentrations of species in the reactor) ---
    // These would change over time in a dynamic simulation.
    // For a single calculation, we use small initial values.
    activeSites_z0_1: 1e-7,
    activeSites_z0_2: 1e-7,
    livingPolymerEnd_z1_1: 1e-7,
    livingPolymerEnd_z1_2: 1e-7,
    livingPolymerEnd_z2_1: 1e-7,
    livingPolymerEnd_z2_2: 1e-7,
    livingPolymerMoment0_y0_1: 1e-7,
    livingPolymerMoment0_y0_2: 1e-7,
    livingPolymerMoment1_y1_1: 1e-7,
    livingPolymerMoment1_y1_2: 1e-7,
    livingPolymerMoment2_y2_1: 1e-7,
    livingPolymerMoment2_y2_2: 1e-7,
  };

  // ===================================================================================
  // 2. OUTPUT STATE
  // ===================================================================================
  // Reactive variable to hold the calculation results.
  // It's nullable, so we can show a message if no calculation has been run yet.
  let outputs: ZieglerModelOutputs | null = null;

  // ===================================================================================
  // 3. CALCULATION HANDLER
  // ===================================================================================
  function runCalculation() {
    try {
      // Call the function from our library with the current input values
      outputs = calculateReactionRates(inputs);
    } catch (error) {
      console.error("Calculation failed:", error);
      // Using a modal or on-screen message is better than alert()
    }
  }

  // Run the calculation once on component mount to show initial results
  onMount(() => {
    runCalculation();
  });

  // A helper to format numbers for display
  function formatNumber(num: number | undefined | null) {
    if (num === undefined || num === null) return 'N/A';
    if (Math.abs(num) < 1e-4 && num !== 0) {
      return num.toExponential(3);
    }
    return num.toFixed(5);
  }
</script>

<main class="bg-slate-50 font-sans p-4 sm:p-6 lg:p-8 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">PE Loop Reactor Kinetics Simulator</h1>
      <p class="text-slate-600 mt-1">
        Interactive tool to explore reaction kinetics. Ranges based on typical PE loop reactor conditions.
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Input Section -->
      <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 class="text-xl font-semibold text-slate-700 mb-6 border-b pb-3">Input Parameters</h2>

        <div class="space-y-6">
          <!-- Slider for Temperature -->
          <div>
            <label for="temperature" class="flex justify-between items-center text-sm font-medium text-slate-700">
              Temperature (K)
              <span class="text-indigo-600 font-bold">{inputs.temperature.toFixed(2)} K / {(inputs.temperature - 273.15).toFixed(1)} °C</span>
            </label>
            <input
                    type="range"
                    id="temperature"
                    bind:value={inputs.temperature}
                    min={273.15 + 80}
                    max={273.15 + 110}
                    step="0.1"
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <!-- Slider for Reactor Volume -->
          <div>
            <label for="volume" class="flex justify-between items-center text-sm font-medium text-slate-700">
              Volume (m³)
              <span class="text-indigo-600 font-bold">{(inputs.volume / 1000).toFixed(1)}</span>
            </label>
            <input
                    type="range"
                    id="volume"
                    bind:value={inputs.volume}
                    min="50000"
                    max="150000"
                    step="1000"
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <!-- Slider for Hydrogen -->
          <div>
            <label for="hydrogen" class="flex justify-between items-center text-sm font-medium text-slate-700">
              Hydrogen (mol/L)
              <span class="text-indigo-600 font-bold">{formatNumber(inputs.hydrogen)}</span>
            </label>
            <input
                    type="range"
                    id="hydrogen"
                    bind:value={inputs.hydrogen}
                    min="0"
                    max="0.01"
                    step="0.0001"
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <!-- Slider for Ethylene -->
          <div>
            <label for="ethylene" class="flex justify-between items-center text-sm font-medium text-slate-700">
              Ethylene (mol/L)
              <span class="text-indigo-600 font-bold">{formatNumber(inputs.ethylene)}</span>
            </label>
            <input
                    type="range"
                    id="ethylene"
                    bind:value={inputs.ethylene}
                    min="0"
                    max="0.1"
                    step="0.001"
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <!-- Slider for Hexene -->
          <div>
            <label for="hexene" class="flex justify-between items-center text-sm font-medium text-slate-700">
              Hexene (mol/L)
              <span class="text-indigo-600 font-bold">{formatNumber(inputs.hexene)}</span>
            </label>
            <input
                    type="range"
                    id="hexene"
                    bind:value={inputs.hexene}
                    min="0"
                    max="0.04"
                    step="0.0005"
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <!-- Other inputs can be added here in the same way -->
        </div>

        <button on:click={runCalculation} class="mt-8 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Run Calculation
        </button>
      </div>

      <!-- Output Section -->
      <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 class="text-xl font-semibold text-slate-700 mb-6 border-b pb-3">Simulation Results</h2>
        {#if outputs}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div class="bg-indigo-50 p-4 rounded-lg text-center">
              <p class="text-sm text-indigo-800 font-medium">Polymer Rate</p>
              <p class="text-2xl font-bold text-indigo-900 mt-1">{formatNumber(outputs.polymerProductionRate)}</p>
              <p class="text-xs text-slate-500">g/h</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
              <p class="text-sm text-green-800 font-medium">Ethylene Rate</p>
              <p class="text-2xl font-bold text-green-900 mt-1">{formatNumber(outputs.rateEthylene)}</p>
              <p class="text-xs text-slate-500">mol/h</p>
            </div>
            <div class="bg-sky-50 p-4 rounded-lg text-center">
              <p class="text-sm text-sky-800 font-medium">Hexene Rate</p>
              <p class="text-2xl font-bold text-sky-900 mt-1">{formatNumber(outputs.rateHexene)}</p>
              <p class="text-xs text-slate-500">mol/h</p>
            </div>
            <div class="bg-amber-50 p-4 rounded-lg text-center">
              <p class="text-sm text-amber-800 font-medium">Hydrogen Rate</p>
              <p class="text-2xl font-bold text-amber-900 mt-1">{formatNumber(outputs.rateHydrogen)}</p>
              <p class="text-xs text-slate-500">mol/h</p>
            </div>

            <!-- Detailed Rates -->
            <h3 class="col-span-full text-lg font-semibold text-slate-600 mt-6 mb-2">Detailed Moment & Site Rates (mol/h)</h3>

            <div class="col-span-full grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <p><span class="font-semibold">d[Y0_1]/dt:</span> {formatNumber(outputs.rateLivingPolymerMoment0_y0_1)}</p>
              <p><span class="font-semibold">d[Y0_2]/dt:</span> {formatNumber(outputs.rateLivingPolymerMoment0_y0_2)}</p>
              <p><span class="font-semibold">d[S]/dt:</span> {formatNumber(outputs.rateCatalyst)}</p>
              <p><span class="font-semibold">d[S1]/dt:</span> {formatNumber(outputs.rateCr6)}</p>
            </div>

          </div>
        {:else}
          <p class="text-center text-slate-500 py-10">
            Click "Run Calculation" to see the results.
          </p>
        {/if}
      </div>
    </div>
  </div>
</main>
