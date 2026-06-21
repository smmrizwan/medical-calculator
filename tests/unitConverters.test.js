const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Unit Converters', () => {
    let context;
    let mockDOM;

    beforeEach(() => {
        const html = fs.readFileSync(path.join(__dirname, '../calculators_updated_v4_corrected_na.html'), 'utf8');

        let scripts = '';
        const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
            scripts += match[1] + '\n';
        }

        mockDOM = {
            values: {},
            elements: {},
            activeElement: null,
            getElementById: function(id) {
                if (!this.elements[id]) {
                    this.elements[id] = {
                        id: id,
                        _value: this.values[id] || '',
                        get value() { return this._value; },
                        set value(val) { this._value = val; },
                        innerHTML: '',
                        addEventListener: function() {},
                        classList: {
                            add: function() {},
                            remove: function() {}
                        }
                    };
                }
                return this.elements[id];
            },
            querySelectorAll: function() { return []; },
            addEventListener: function() {},
            querySelector: function() { return { addEventListener: function() {} }; },
        };

        context = vm.createContext({
            document: mockDOM,
            window: { addEventListener: function() {} },
            console: console,
            isNaN: isNaN,
            parseFloat: parseFloat,
            isFinite: isFinite,
            Math: Math
        });

        vm.runInContext(scripts, context);
    });

    describe('convertCalcium', () => {
        it('should correctly convert mg/dL to mmol/L', () => {
            const mgdl = mockDOM.getElementById('conv-ca-mg');
            const mmol = mockDOM.getElementById('conv-ca-mmol');
            mgdl.value = '10.0';
            mockDOM.activeElement = mgdl;

            context.convertCalcium();

            expect(mmol.value).toBe('2.50'); // 10.0 / 4 = 2.50
        });

        it('should correctly convert mmol/L to mg/dL', () => {
            const mgdl = mockDOM.getElementById('conv-ca-mg');
            const mmol = mockDOM.getElementById('conv-ca-mmol');
            mmol.value = '2.5';
            mockDOM.activeElement = mmol;

            context.convertCalcium();

            expect(mgdl.value).toBe('10.00'); // 2.5 * 4 = 10.00
        });

        it('should clear both inputs if both are empty', () => {
            const mgdl = mockDOM.getElementById('conv-ca-mg');
            const mmol = mockDOM.getElementById('conv-ca-mmol');
            mgdl.value = '';
            mmol.value = '';
            mockDOM.activeElement = mgdl;

            context.convertCalcium();

            expect(mgdl.value).toBe('');
            expect(mmol.value).toBe('');
        });
    });

    describe('convertPhosphorus', () => {
        it('should correctly convert mg/dL to mmol/L', () => {
            const mgdl = mockDOM.getElementById('conv-p-mg');
            const mmol = mockDOM.getElementById('conv-p-mmol');
            mgdl.value = '3.1';
            mockDOM.activeElement = mgdl;

            context.convertPhosphorus();

            expect(mmol.value).toBe('1.00'); // 3.1 / 3.1 = 1.00
        });

        it('should correctly convert mmol/L to mg/dL', () => {
            const mgdl = mockDOM.getElementById('conv-p-mg');
            const mmol = mockDOM.getElementById('conv-p-mmol');
            mmol.value = '1.0';
            mockDOM.activeElement = mmol;

            context.convertPhosphorus();

            expect(mgdl.value).toBe('3.10'); // 1.0 * 3.1 = 3.10
        });
    });

    describe('convertCreatinine', () => {
        it('should correctly convert mg/dL to umol/L', () => {
            const mgdl = mockDOM.getElementById('conv-cr-mg');
            const umol = mockDOM.getElementById('conv-cr-umol');
            mgdl.value = '1.0';
            mockDOM.activeElement = mgdl;

            context.convertCreatinine();

            expect(umol.value).toBe('88'); // 1.0 * 88.4 = 88
        });

        it('should correctly convert umol/L to mg/dL', () => {
            const mgdl = mockDOM.getElementById('conv-cr-mg');
            const umol = mockDOM.getElementById('conv-cr-umol');
            umol.value = '88.4';
            mockDOM.activeElement = umol;

            context.convertCreatinine();

            expect(mgdl.value).toBe('1.00'); // 88.4 / 88.4 = 1.00
        });
    });

    describe('convertPTH', () => {
        it('should correctly convert pg/mL to pmol/L', () => {
            const pgml = mockDOM.getElementById('conv-pth-pg');
            const pmol = mockDOM.getElementById('conv-pth-pmol');
            pgml.value = '94';
            mockDOM.activeElement = pgml;

            context.convertPTH();

            expect(pmol.value).toBe('10.0'); // 94 / 9.4 = 10.0
        });

        it('should correctly convert pmol/L to pg/mL', () => {
            const pgml = mockDOM.getElementById('conv-pth-pg');
            const pmol = mockDOM.getElementById('conv-pth-pmol');
            pmol.value = '10.0';
            mockDOM.activeElement = pmol;

            context.convertPTH();

            expect(pgml.value).toBe('94'); // 10.0 * 9.4 = 94
        });
    });
});
