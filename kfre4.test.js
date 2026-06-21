const fs = require('fs');
const vm = require('vm');

describe('KFRE 4-Variable Calculator', () => {
    let context;
    let domElements;

    beforeEach(() => {
        const html = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');
        const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
        let match;
        let scripts = '';
        while ((match = scriptRegex.exec(html)) !== null) {
            scripts += match[1] + '\n';
        }

        domElements = {
            'kfre4-age': { value: '' },
            'kfre4-gender': { value: '' },
            'kfre4-egfr': { value: '' },
            'kfre4-acr': { value: '' },
            'kfre4-result': { innerHTML: 'initial' }
        };

        const documentMock = {
            getElementById: jest.fn((id) => domElements[id] || { value: '', innerHTML: '', addEventListener: () => {} }),
            querySelectorAll: jest.fn(() => []),
            addEventListener: jest.fn()
        };

        const windowMock = {
            addEventListener: jest.fn()
        };

        context = vm.createContext({
            document: documentMock,
            window: windowMock,
            Math: Math,
            parseInt: parseInt,
            parseFloat: parseFloat,
            console: console,
            isNaN: isNaN
        });

        vm.runInContext(scripts, context);
    });

    test('calculates KFRE-4 correctly for male patient', () => {
        domElements['kfre4-age'].value = '60';
        domElements['kfre4-gender'].value = 'male';
        domElements['kfre4-egfr'].value = '30';
        domElements['kfre4-acr'].value = '100';

        context.calculateKFRE4();

        const resultHtml = domElements['kfre4-result'].innerHTML;
        expect(resultHtml).toContain('2-Year Risk: 15.8%');
        expect(resultHtml).toContain('5-Year Risk: 37.5%');
    });

    test('calculates KFRE-4 correctly for female patient', () => {
        domElements['kfre4-age'].value = '60';
        domElements['kfre4-gender'].value = 'female';
        domElements['kfre4-egfr'].value = '30';
        domElements['kfre4-acr'].value = '100';

        context.calculateKFRE4();

        const resultHtml = domElements['kfre4-result'].innerHTML;
        expect(resultHtml).toContain('2-Year Risk: 12.6%');
        expect(resultHtml).toContain('5-Year Risk: 30.8%');
    });

    test('clears output if age is missing', () => {
        domElements['kfre4-age'].value = '';
        domElements['kfre4-gender'].value = 'male';
        domElements['kfre4-egfr'].value = '30';
        domElements['kfre4-acr'].value = '100';
        domElements['kfre4-result'].innerHTML = 'previous result';

        context.calculateKFRE4();

        expect(domElements['kfre4-result'].innerHTML).toBe('');
    });

    test('clears output if egfr is missing', () => {
        domElements['kfre4-age'].value = '60';
        domElements['kfre4-gender'].value = 'male';
        domElements['kfre4-egfr'].value = '';
        domElements['kfre4-acr'].value = '100';
        domElements['kfre4-result'].innerHTML = 'previous result';

        context.calculateKFRE4();

        expect(domElements['kfre4-result'].innerHTML).toBe('');
    });

    test('clears output if acr is missing', () => {
        domElements['kfre4-age'].value = '60';
        domElements['kfre4-gender'].value = 'male';
        domElements['kfre4-egfr'].value = '30';
        domElements['kfre4-acr'].value = '';
        domElements['kfre4-result'].innerHTML = 'previous result';

        context.calculateKFRE4();

        expect(domElements['kfre4-result'].innerHTML).toBe('');
    });
});
