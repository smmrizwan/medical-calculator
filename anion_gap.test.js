const fs = require('fs');
const vm = require('vm');

describe('Anion Gap and Delta-Delta Calculators', () => {
    let documentMock;
    let context;

    beforeEach(() => {
        // Simple DOM mock
        const elements = {};
        documentMock = {
            getElementById: jest.fn((id) => {
                if (!elements[id]) {
                    elements[id] = { value: '', innerHTML: '' };
                }
                return elements[id];
            }),
            addEventListener: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            createElement: jest.fn(() => ({
                appendChild: jest.fn(),
                classList: { add: jest.fn() }
            }))
        };

        // Extract script from HTML
        const html = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');
        const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
        const scripts = scriptMatches.map(m => m[1]).join('\n');

        // Create VM context
        context = vm.createContext({
            document: documentMock,
            window: { addEventListener: jest.fn() },
            console: console,
            isNaN: isNaN,
            isFinite: isFinite,
            parseFloat: parseFloat,
            Math: Math,
            Date: Date,
            Array: Array
        });

        // Run scripts in context
        try {
            vm.runInContext(scripts, context);
        } catch (e) {
            console.error('Error compiling script', e);
        }
    });

    describe('calculateFullAnionGap', () => {
        const setInputs = (inputs) => {
            documentMock.getElementById('ag-na').value = inputs.na !== undefined ? inputs.na : '';
            documentMock.getElementById('ag-cl').value = inputs.cl !== undefined ? inputs.cl : '';
            documentMock.getElementById('ag-hco3').value = inputs.hco3 !== undefined ? inputs.hco3 : '';
            documentMock.getElementById('ag-alb').value = inputs.alb !== undefined ? inputs.alb : '';
            documentMock.getElementById('ag-k').value = inputs.k !== undefined ? inputs.k : '';
            documentMock.getElementById('ag-ca').value = inputs.ca !== undefined ? inputs.ca : '';
            documentMock.getElementById('ag-phos').value = inputs.phos !== undefined ? inputs.phos : '';
        };

        const getResult = () => documentMock.getElementById('ag-result').innerHTML;

        test('handles missing inputs gracefully', () => {
            setInputs({ na: 140, cl: 100 }); // missing hco3
            context.calculateFullAnionGap();
            expect(getResult()).toContain('Enter Na⁺, Cl⁻, and HCO₃⁻ to calculate');
        });

        test('calculates normal traditional AG', () => {
            setInputs({ na: 140, cl: 104, hco3: 24 });
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Traditional AG: 12.0 mEq/L');
            expect(result).toContain('Normal anion gap');
            expect(result).toContain('status-normal');
        });

        test('calculates high traditional AG', () => {
            setInputs({ na: 140, cl: 100, hco3: 20 });
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Traditional AG: 20.0 mEq/L');
            expect(result).toContain('High anion gap');
            expect(result).toContain('status-danger');
        });

        test('calculates low traditional AG', () => {
            setInputs({ na: 140, cl: 110, hco3: 25 });
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Traditional AG: 5.0 mEq/L');
            expect(result).toContain('Low anion gap');
            expect(result).toContain('status-warning');
        });

        test('calculates albumin-adjusted AG', () => {
            setInputs({ na: 140, cl: 100, hco3: 20, alb: 30 });
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Traditional AG: 20.0 mEq/L');
            expect(result).toContain('Albumin-Adjusted AG (aAG): 12.5 mEq/L');
        });

        test('calculates full AG with all inputs', () => {
            setInputs({ na: 140, cl: 100, hco3: 20, alb: 30, k: 4.0, ca: 4.5, phos: 3.0 });
            context.calculateFullAnionGap();
            const result = getResult();
            // traditional = 20
            // aAG = 20 - (0.25 * 30) = 12.5
            // fullAG = 12.5 + 4.0 + 4.5 - 3.0 = 18.0
            expect(result).toContain('Full AG: 18.0 mEq/L');
        });

        test('shows warning when some full AG inputs are missing', () => {
            setInputs({ na: 140, cl: 100, hco3: 20, alb: 30, k: 4.0 }); // missing ca and phos
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Albumin-Adjusted AG (aAG): 12.5 mEq/L');
            expect(result).toContain('Enter ionized Ca²⁺, phosphate to calculate Full AG');
        });

        test('shows hint to enter albumin when secondary electrolytes are entered', () => {
            setInputs({ na: 140, cl: 100, hco3: 20, k: 4.0 }); // missing albumin
            context.calculateFullAnionGap();
            const result = getResult();
            expect(result).toContain('Enter albumin to calculate Albumin-Adjusted and Full AG');
        });
    });

    describe('calculateDeltaDelta', () => {
        const setInputs = (inputs) => {
            documentMock.getElementById('dd-na').value = inputs.na !== undefined ? inputs.na : '';
            documentMock.getElementById('dd-cl').value = inputs.cl !== undefined ? inputs.cl : '';
            documentMock.getElementById('dd-hco3').value = inputs.hco3 !== undefined ? inputs.hco3 : '';
            documentMock.getElementById('dd-alb').value = inputs.alb !== undefined ? inputs.alb : '';
        };

        const getResult = () => documentMock.getElementById('dd-result').innerHTML;

        test('handles missing inputs gracefully', () => {
            setInputs({ na: 140, cl: 100 });
            context.calculateDeltaDelta();
            expect(getResult()).toContain('Enter Na, Cl, and HCO₃⁻');
        });

        test('calculates delta ratio for pure HAGMA (ratio 1-2)', () => {
            setInputs({ na: 140, cl: 100, hco3: 14 });
            // AG = 140 - 114 = 26
            // deltaAG = 26 - 12 = 14
            // deltaHCO3 = 24 - 14 = 10
            // ratio = 14 / 10 = 1.4
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('Anion Gap: 26.0 mmol/L');
            expect(result).toContain('ΔAG: 14.0 mmol/L');
            expect(result).toContain('ΔHCO₃⁻: 10.0 mmol/L');
            expect(result).toContain('Delta Ratio (ΔAG/ΔHCO₃⁻): 1.40');
            expect(result).toContain('Pure HAGMA');
            expect(result).toContain('status-normal');
        });

        test('calculates delta ratio for concurrent NAGMA (ratio < 1)', () => {
            setInputs({ na: 140, cl: 110, hco3: 14 });
            // AG = 140 - 124 = 16
            // deltaAG = 16 - 12 = 4
            // deltaHCO3 = 24 - 14 = 10
            // ratio = 4 / 10 = 0.4
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('Anion Gap: 16.0 mmol/L');
            expect(result).toContain('Delta Ratio (ΔAG/ΔHCO₃⁻): 0.40');
            expect(result).toContain('Concurrent NAGMA');
            expect(result).toContain('status-warning');
        });

        test('calculates delta ratio for coexisting metabolic alkalosis (ratio > 2)', () => {
            setInputs({ na: 140, cl: 90, hco3: 18 });
            // AG = 140 - 108 = 32
            // deltaAG = 32 - 12 = 20
            // deltaHCO3 = 24 - 18 = 6
            // ratio = 20 / 6 = 3.33
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('Anion Gap: 32.0 mmol/L');
            expect(result).toContain('Delta Ratio (ΔAG/ΔHCO₃⁻): 3.33');
            expect(result).toContain('Coexisting metabolic alkalosis');
            expect(result).toContain('status-warning');
        });

        test('calculates albumin-corrected delta delta', () => {
            setInputs({ na: 140, cl: 100, hco3: 14, alb: 20 });
            // AG = 140 - 114 = 26
            // correctedAG = 26 - (0.25 * 20) = 21
            // deltaAG = 21 - 12 = 9
            // deltaHCO3 = 24 - 14 = 10
            // ratio = 9 / 10 = 0.9
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('Albumin-corrected AG: 21.0 mmol/L');
            expect(result).toContain('ΔAG: 9.0 mmol/L');
            expect(result).toContain('Delta Ratio (ΔAG/ΔHCO₃⁻): 0.90');
        });

        test('handles no metabolic acidosis correctly', () => {
            setInputs({ na: 140, cl: 100, hco3: 26 });
            // AG = 14
            // HCO3 >= 24 -> deltaHCO3 <= 0
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('Anion Gap: 14.0 mmol/L');
            expect(result).toContain('No metabolic acidosis detected (HCO₃⁻ ≥ normal)');
        });

        test('handles normal anion gap without acidosis', () => {
            setInputs({ na: 140, cl: 105, hco3: 24 });
            // AG = 11 (normal)
            // deltaHCO3 = 0
            context.calculateDeltaDelta();
            const result = getResult();
            expect(result).toContain('No metabolic acidosis detected');
        });
    });
});
