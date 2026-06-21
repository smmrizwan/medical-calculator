const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Extract script content from HTML
const htmlPath = path.join(__dirname, '../calculators_updated_v4_corrected_na.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let fullScript = '';
while ((match = scriptRegex.exec(html)) !== null) {
  fullScript += match[1] + '\n';
}

describe('BP Staging Calculator', () => {
    let domStore;
    let context;

    beforeEach(() => {
        // Reset DOM state before each test
        domStore = {};
        const documentMock = {
            getElementById: (id) => {
                if (!domStore[id]) {
                    domStore[id] = { value: '', innerHTML: '', addEventListener: () => {} };
                }
                return domStore[id];
            },
            addEventListener: () => {},
            querySelectorAll: () => []
        };

        const windowMock = {
            addEventListener: () => {}
        };

        context = vm.createContext({
            document: documentMock,
            window: windowMock,
            console: console,
            Math: Math,
            parseFloat: parseFloat,
            parseInt: parseInt,
            isNaN: isNaN
        });

        // Run the extracted script to load functions into the context
        vm.runInContext(fullScript, context);
    });

    const runBPStage = (systolic, diastolic) => {
        domStore['bp-systolic'] = { value: systolic.toString() };
        domStore['bp-diastolic'] = { value: diastolic.toString() };
        domStore['bp-result'] = { innerHTML: '' };

        vm.runInContext('calculateBPStage()', context);

        return domStore['bp-result'].innerHTML;
    };

    test('handles empty inputs safely', () => {
        domStore['bp-systolic'] = { value: '' };
        domStore['bp-diastolic'] = { value: '' };
        domStore['bp-result'] = { innerHTML: 'Previous result' };

        vm.runInContext('calculateBPStage()', context);

        expect(domStore['bp-result'].innerHTML).toBe('');
    });

    test('classifies Normal BP', () => {
        const html = runBPStage(119, 79);
        expect(html).toContain('Normal');
        expect(html).toContain('status-normal');
    });

    test('classifies Elevated BP', () => {
        const html = runBPStage(120, 75);
        expect(html).toContain('Elevated');
        expect(html).toContain('status-warning');

        const htmlUpper = runBPStage(129, 79);
        expect(htmlUpper).toContain('Elevated');
    });

    test('classifies Stage 1 Hypertension by systolic', () => {
        const html = runBPStage(130, 75);
        expect(html).toContain('Stage 1 Hypertension');
        expect(html).toContain('status-warning');
    });

    test('classifies Stage 1 Hypertension by diastolic', () => {
        const html = runBPStage(120, 80);
        expect(html).toContain('Stage 1 Hypertension');
    });

    test('classifies Stage 2 Hypertension by systolic', () => {
        const html = runBPStage(140, 80);
        expect(html).toContain('Stage 2 Hypertension');
        expect(html).toContain('status-danger');
    });

    test('classifies Stage 2 Hypertension by diastolic', () => {
        const html = runBPStage(130, 90);
        expect(html).toContain('Stage 2 Hypertension');
    });

    test('classifies Hypertensive Crisis by systolic', () => {
        const html = runBPStage(180, 110);
        expect(html).toContain('Hypertensive Crisis');
        expect(html).toContain('status-danger');
    });

    test('classifies Hypertensive Crisis by diastolic', () => {
        const html = runBPStage(160, 120);
        expect(html).toContain('Hypertensive Crisis');
    });

    test('takes highest severity when categories mixed', () => {
        // Stage 1 Systolic, Stage 2 Diastolic => Stage 2
        const mixed1 = runBPStage(135, 95);
        expect(mixed1).toContain('Stage 2 Hypertension');

        // Stage 2 Systolic, Normal Diastolic => Stage 2
        const mixed2 = runBPStage(150, 75);
        expect(mixed2).toContain('Stage 2 Hypertension');

        // Stage 2 Systolic, Hypertensive Crisis Diastolic => Crisis
        const mixed3 = runBPStage(160, 125);
        expect(mixed3).toContain('Hypertensive Crisis');
    });
});
