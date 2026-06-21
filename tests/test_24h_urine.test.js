const vm = require('vm');
const fs = require('fs');

const htmlContent = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let scripts = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  scripts += match[1] + '\n';
}

function createDOMMock() {
  const documentMock = {
    elements: {},
    getElementById(id) {
      if (!this.elements[id]) {
        this.elements[id] = {
          value: '',
          innerHTML: '',
          checked: false,
          style: {},
          classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
          },
          addEventListener: () => {}
        };
      }
      return this.elements[id];
    },
    addEventListener: () => {},
    querySelectorAll: () => []
  };

  const windowMock = {
    addEventListener: () => {}
  };

  return { documentMock, windowMock };
}

describe('calculate24hUrineAdequacy', () => {
  let context;
  let documentMock;

  beforeEach(() => {
    const mocks = createDOMMock();
    documentMock = mocks.documentMock;

    context = vm.createContext({
      document: documentMock,
      window: mocks.windowMock,
      console: console,
      Math: Math,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout
    });

    vm.runInContext(scripts, context);
  });

  function setInputs(inputs) {
    for (const [id, value] of Object.entries(inputs)) {
      documentMock.getElementById(id).value = value;
    }
  }

  test('calculates basic values correctly with standard inputs', () => {
    setInputs({
      'u24-age': '50',
      'u24-sex': 'male',
      'u24-weight': '80',
      'u24-height': '180',
      'u24-black': 'no',
      'u24-A': '1',
      'u24-ucr': '15', // mmol/day
      'u24-protein': '500', // mg/day
      'u24-acr': '300', // mg/g
      'u24-spotna': '100', // mmol/L
      'u24-spotcr-unit': 'mmoll',
      'u24-spotcr': '10' // mmol/L
    });

    context.calculate24hUrineAdequacy();

    const output = documentMock.getElementById('u24-result').innerHTML;

    // Check creatinine values
    expect(output).toContain('24h urine creatinine: 15.00 mmol/day = 1697 mg/day (1.70 g/day)');
    expect(output).toContain('Creatinine excretion per kg: <strong>21.2 mg/kg/day</strong>');
    expect(output).toContain('Predicted creatinine excretion (Ix): <strong>1571 mg/day</strong>');

    // Check protein values
    expect(output).toContain('24h total protein: 500 mg/day');
    expect(output).toContain('Protein/Creatinine (from 24h): 33.3 mg/mmol &nbsp; | &nbsp; 295 mg/g');

    // Check spot sodium
    expect(output).toContain('INTERSALT');
    expect(output).toContain('151'); // Na (mmol/day)
  });

  test('handles missing optional inputs gracefully', () => {
    setInputs({
      'u24-age': '50',
      'u24-sex': 'male',
      'u24-weight': '80',
      'u24-height': '180',
      'u24-black': 'no',
      'u24-A': '1',
      'u24-ucr': '15', // only required input
      'u24-protein': '',
      'u24-acr': '',
      'u24-spotna': '',
      'u24-spotcr-unit': 'mmoll',
      'u24-spotcr': ''
    });

    context.calculate24hUrineAdequacy();

    const output = documentMock.getElementById('u24-result').innerHTML;

    expect(output).toContain('24h urine creatinine: 15.00 mmol/day = 1697 mg/day (1.70 g/day)');
    expect(output).toContain('Creatinine excretion per kg: <strong>21.2 mg/kg/day</strong>');

    // Should not contain protein or sodium info
    expect(output).not.toContain('24h total protein');
    expect(output).not.toContain('Estimated 24h sodium excretion');
  });

  test('validates inadequate collection (undercollection)', () => {
    setInputs({
      'u24-age': '50',
      'u24-sex': 'male',
      'u24-weight': '80',
      'u24-height': '180',
      'u24-black': 'no',
      'u24-A': '1',
      'u24-ucr': '5', // unusually low for this weight
      'u24-protein': '',
      'u24-acr': '',
      'u24-spotna': '',
      'u24-spotcr-unit': 'mmoll',
      'u24-spotcr': ''
    });

    context.calculate24hUrineAdequacy();

    const output = documentMock.getElementById('u24-result').innerHTML;

    expect(output).toContain('Creatinine excretion per kg: <strong>7.1 mg/kg/day</strong>');
    expect(output).toContain('Likely incomplete or inaccurate');
    expect(output).toContain('Strongly suspect under/over‑collection');
  });

  test('returns empty if uCr is missing or invalid', () => {
    setInputs({
      'u24-age': '50',
      'u24-sex': 'male',
      'u24-weight': '80',
      'u24-height': '180',
      'u24-black': 'no',
      'u24-A': '1',
      'u24-ucr': '', // missing
      'u24-protein': '',
      'u24-acr': '',
      'u24-spotna': '',
      'u24-spotcr-unit': 'mmoll',
      'u24-spotcr': ''
    });

    context.calculate24hUrineAdequacy();

    const output = documentMock.getElementById('u24-result').innerHTML;
    expect(output).toBe('');
  });
});
