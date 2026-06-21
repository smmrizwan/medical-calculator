const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let scripts = '';
let match;
while ((match = scriptRegex.exec(html)) !== null) {
  scripts += match[1] + '\n';
}

describe('CKM Syndrome Calculator', () => {
  let context;
  let domNodes;

  beforeEach(() => {
    domNodes = {};
    const documentMock = {
      getElementById: jest.fn((id) => {
        if (!domNodes[id]) {
          domNodes[id] = { value: '', checked: false, innerText: '', innerHTML: '', className: '', style: {} };
        }
        return domNodes[id];
      }),
      querySelector: jest.fn(),
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
      parseFloat: parseFloat,
      console: console
    });

    vm.runInContext(scripts, context);
  });

  function setInputs(inputs) {
    for (const [id, value] of Object.entries(inputs)) {
      if (typeof value === 'boolean') {
        context.document.getElementById(id).checked = value;
      } else {
        context.document.getElementById(id).value = value;
      }
    }
  }

  function getOutput(id, prop = 'innerText') {
    return context.document.getElementById(id)[prop];
  }

  it('calculates stage 0 correctly', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '70', // BMI 22.8
      'ckm-waist': '85',
      'ckm-sbp': '110',
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '80', // normal
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': false,
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': ''
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('0');
    expect(getOutput('ckm-stage-name')).toBe('No CKM Risk Factors');
  });

  it('calculates stage 1 correctly (Excess Adiposity)', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '85', // BMI 27.7, > 25
      'ckm-waist': '85',
      'ckm-sbp': '110',
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '80',
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': false,
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': ''
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('1');
    expect(getOutput('ckm-stage-name')).toBe('Excess Adiposity / Prediabetes');
  });

  it('calculates stage 2 correctly (Metabolic Risk - HTN)', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '70',
      'ckm-waist': '85',
      'ckm-sbp': '135', // SBP >= 130
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '80',
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': false,
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': ''
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('2');
    expect(getOutput('ckm-stage-name')).toBe('Metabolic Risk Factors or CKD');
  });

  it('calculates stage 3 correctly (Subclinical CVD / CAC > 0)', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '70',
      'ckm-waist': '85',
      'ckm-sbp': '110',
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '80',
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': false,
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': '100' // CAC > 0
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('3');
    expect(getOutput('ckm-stage-name')).toBe('Subclinical CVD / High Risk');
  });

  it('calculates stage 4a correctly (Clinical CVD)', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '70',
      'ckm-waist': '85',
      'ckm-sbp': '110',
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '80',
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': true, // CVD
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': ''
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('4a');
    expect(getOutput('ckm-stage-name')).toBe('Clinical CVD');
  });

  it('calculates stage 4b correctly (Clinical CVD with Kidney Failure)', () => {
    setInputs({
      'ckm-age': '30',
      'ckm-sex': 'male',
      'ckm-race': 'other',
      'ckm-asian': false,
      'ckm-height': '175',
      'ckm-weight': '70',
      'ckm-waist': '85',
      'ckm-sbp': '110',
      'ckm-dbp': '70',
      'ckm-glucose': '4.5',
      'ckm-hba1c': '5.0',
      'ckm-tg': '1.0',
      'ckm-hdl': '1.5',
      'ckm-chol': '4.0',
      'ckm-creat': '600', // eGFR < 15
      'ckm-acr': '5',
      'ckm-smoking': 'never',
      'ckm-bpmeds': false,
      'ckm-lipids': false,
      'ckm-dm': false,
      'ckm-htn': false,
      'ckm-chd': true, // CVD
      'ckm-hf': false,
      'ckm-stroke': false,
      'ckm-pad': false,
      'ckm-afib': false,
      'ckm-cac': ''
    });

    context.calculateCKM();

    expect(getOutput('ckm-stage-num')).toBe('4b');
    expect(getOutput('ckm-stage-name')).toBe('Clinical CVD with Kidney Failure');
  });
});
