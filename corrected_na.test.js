const fs = require('fs');
const vm = require('vm');

describe('Corrected Sodium in Hyperglycemia Calculator', () => {
    let documentMock;
    let windowMock;
    let context;

    beforeEach(() => {
        const elements = {
            'corrna-na': { value: '' },
            'corrna-glucose': { value: '' },
            'corrna-glu': { value: '' },
            'corrna-unit': { value: 'mgdl' },
            'corrna-result': { innerHTML: '' },
        };

        documentMock = {
            getElementById: jest.fn(id => elements[id]),
            querySelectorAll: jest.fn(() => []),
            addEventListener: jest.fn()
        };

        windowMock = {
            addEventListener: jest.fn()
        };

        context = vm.createContext({
            document: documentMock,
            window: windowMock,
            console: console,
            parseFloat: parseFloat,
            isFinite: isFinite,
            isNaN: isNaN
        });

        const html = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');
        const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
        let match;
        let scripts = '';
        while ((match = scriptRegex.exec(html)) !== null) {
            scripts += match[1] + '\n';
        }

        vm.runInContext(scripts, context);
    });

    test('calculates correctly for mg/dL', () => {
        documentMock.getElementById('corrna-na').value = '140';
        documentMock.getElementById('corrna-glucose').value = '400';
        documentMock.getElementById('corrna-glu').value = '400';
        documentMock.getElementById('corrna-unit').value = 'mgdl';

        vm.runInContext('calculateCorrectedNaHyperglycemia()', context);

        const resultHTML = documentMock.getElementById('corrna-result').innerHTML;
        // delta = 1.6 * ((400-100)/100) = 1.6 * 3 = 4.8
        // correctedNa = 140 + 4.8 = 144.8
        expect(resultHTML).toContain('Corrected Na: 144.8 mmol/L');
        expect(resultHTML).toContain('Correction added: 4.8 mmol/L');
        expect(resultHTML).toContain('Using mg/dL formula');
    });

    test('calculates correctly for mmol/L', () => {
        documentMock.getElementById('corrna-na').value = '135';
        documentMock.getElementById('corrna-glucose').value = '22.4'; // 22.4 mmol/L is approx 400 mg/dL
        documentMock.getElementById('corrna-glu').value = '22.4';
        documentMock.getElementById('corrna-unit').value = 'mmol';

        vm.runInContext('calculateCorrectedNaHyperglycemia()', context);

        const resultHTML = documentMock.getElementById('corrna-result').innerHTML;
        // delta = 1.6 * ((22.4 - 5.6) / 5.6) = 1.6 * (16.8 / 5.6) = 1.6 * 3 = 4.8
        // correctedNa = 135 + 4.8 = 139.8
        expect(resultHTML).toContain('Corrected Na: 139.8 mmol/L');
        expect(resultHTML).toContain('Correction added: 4.8 mmol/L');
        expect(resultHTML).toContain('Using mmol/L formula');
    });

    test('handles missing or invalid input correctly', () => {
        documentMock.getElementById('corrna-na').value = '';
        documentMock.getElementById('corrna-glucose').value = '';
        documentMock.getElementById('corrna-glu').value = '';
        documentMock.getElementById('corrna-unit').value = 'mgdl';

        vm.runInContext('calculateCorrectedNaHyperglycemia()', context);

        const resultHTML = documentMock.getElementById('corrna-result').innerHTML;
        expect(resultHTML).toContain('Enter measured sodium and glucose');
    });

    test('calculates correctly when glucose is less than normal', () => {
        documentMock.getElementById('corrna-na').value = '140';
        documentMock.getElementById('corrna-glucose').value = '50';
        documentMock.getElementById('corrna-glu').value = '50';
        documentMock.getElementById('corrna-unit').value = 'mgdl';

        vm.runInContext('calculateCorrectedNaHyperglycemia()', context);

        const resultHTML = documentMock.getElementById('corrna-result').innerHTML;
        // delta = 1.6 * ((50-100)/100) = 1.6 * -0.5 = -0.8
        // correctedNa = 140 - 0.8 = 139.2
        expect(resultHTML).toContain('Corrected Na: 139.2 mmol/L');
        expect(resultHTML).toContain('Correction added: -0.8 mmol/L');
        expect(resultHTML).toContain('Using mg/dL formula');
    });
});
