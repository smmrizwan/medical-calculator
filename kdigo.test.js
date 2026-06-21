const fs = require('fs');

// Extract the script content from the HTML
const htmlContent = fs.readFileSync('calculators_updated_v4_corrected_na.html', 'utf8');

let kdigoFunctionStr = '';
const functionMatch = htmlContent.match(/function\s+calculateKDIGO\s*\(\)\s*\{/);
if (functionMatch) {
    const startIndex = functionMatch.index;
    let braceCount = 0;
    let i = startIndex + functionMatch[0].length - 1; // start at '{'

    // Safety limit
    while (i < htmlContent.length) {
        if (htmlContent[i] === '{') braceCount++;
        if (htmlContent[i] === '}') braceCount--;

        if (braceCount === 0) {
            kdigoFunctionStr = htmlContent.substring(startIndex, i + 1);
            break;
        }
        i++;
    }
}

// Eval the function to add it to global scope
eval(kdigoFunctionStr);

// Create a mock DOM environment
global.document = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = { value: '', innerHTML: '' };
        }
        return this.elements[id];
    }
};

function resetDom() {
    global.document.elements = {};
}

describe('KDIGO AKI Staging Calculator', () => {
    beforeEach(() => {
        resetDom();
    });

    const setInputs = (baselineCr, currentCr, cr48hr, urine6hr, urine12hr, urine24hr, anuria, rrt) => {
        global.document.getElementById('kdigo-baseline-cr').value = baselineCr;
        global.document.getElementById('kdigo-current-cr').value = currentCr;
        global.document.getElementById('kdigo-cr-48hr').value = cr48hr;
        global.document.getElementById('kdigo-urine-6hr').value = urine6hr;
        global.document.getElementById('kdigo-urine-12hr').value = urine12hr;
        global.document.getElementById('kdigo-urine-24hr').value = urine24hr;
        global.document.getElementById('kdigo-anuria').value = anuria;
        global.document.getElementById('kdigo-rrt').value = rrt;
    };

    const getResult = () => global.document.getElementById('kdigo-result').innerHTML;

    test('should return No AKI when no criteria are met', () => {
        setInputs('', '', 'no', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('No AKI');
    });

    test('should calculate Stage 1 for 1.5x baseline Cr', () => {
        setInputs('100', '160', 'no', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 1');
        expect(getResult()).not.toContain('Stage 2');
        expect(getResult()).not.toContain('Stage 3');
    });

    test('should calculate Stage 2 for 2x baseline Cr', () => {
        setInputs('100', '210', 'no', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 2');
    });

    test('should calculate Stage 3 for 3x baseline Cr', () => {
        setInputs('100', '310', 'no', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should calculate Stage 3 for Cr >= 353.6 with acute rise', () => {
        setInputs('340', '370', 'no', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should calculate Stage 1 for Cr rise >= 26.5 within 48hr', () => {
        setInputs('', '', 'yes', '', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 1');
    });

    test('should calculate Stage 1 for UO < 0.5 for 6h', () => {
        setInputs('', '', 'no', '0.4', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 1');
    });

    test('should calculate Stage 2 for UO < 0.5 for 12h', () => {
        setInputs('', '', 'no', '', '0.4', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 2');
    });

    test('should calculate Stage 3 for UO < 0.3 for 24h', () => {
        setInputs('', '', 'no', '', '', '0.2', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should calculate Stage 3 for Anuria', () => {
        setInputs('', '', 'no', '', '', '', 'yes', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should calculate Stage 3 for RRT', () => {
        setInputs('', '', 'no', '', '', '', 'no', 'yes');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should select higher stage when Cr is Stage 1 but UO is Stage 3', () => {
        setInputs('100', '160', 'no', '', '', '0.2', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should select higher stage when Cr is Stage 3 but UO is Stage 1', () => {
        setInputs('100', '310', 'no', '0.4', '', '', 'no', 'no');
        calculateKDIGO();
        expect(getResult()).toContain('Stage 3');
    });

    test('should not render empty if values missing and no result handling is missing', () => {
        setInputs('', '', '', '', '', '', '', '');
        calculateKDIGO();
        // Just verify it doesn't crash
    });
});
