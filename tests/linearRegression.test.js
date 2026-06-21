const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read the HTML file
const htmlPath = path.resolve(__dirname, '../calculators_updated_v4_corrected_na.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Extract all scripts
const scripts = [];
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
    scripts.push(match[1]);
}

// Create a simple mocked DOM to satisfy script parsing if it does initialization on load
const mockDocument = {
    getElementById: jest.fn(() => ({
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        style: {},
    })),
    querySelectorAll: jest.fn(() => []),
    querySelector: jest.fn(() => null),
    addEventListener: jest.fn(),
};

const mockWindow = {
    addEventListener: jest.fn(),
    document: mockDocument
};

const context = vm.createContext({
    document: mockDocument,
    window: mockWindow,
    console: console,
    Math: Math,
    Date: Date,
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN,
});

// Execute the scripts
scripts.forEach(script => {
    try {
        vm.runInContext(script, context);
    } catch (e) {
        // Some DOM specific things might fail on load, ignore for now as we just want the functions
    }
});

// The function to test
const linearRegression = context.linearRegression;

describe('linearRegression', () => {
    test('returns null for array with fewer than 2 points', () => {
        expect(linearRegression([])).toBeNull();
        expect(linearRegression([{x: 1, y: 2}])).toBeNull();
    });

    test('calculates correct slope and intercept for a perfect line', () => {
        const points = [
            { x: 1, y: 2 },
            { x: 2, y: 4 },
            { x: 3, y: 6 }
        ];
        const result = linearRegression(points);
        expect(result.slope).toBeCloseTo(2);
        expect(result.intercept).toBeCloseTo(0);
        expect(result.r2).toBeCloseTo(1);
    });

    test('handles negative values correctly', () => {
        const points = [
            { x: -1, y: -2 },
            { x: 0, y: 0 },
            { x: 1, y: 2 }
        ];
        const result = linearRegression(points);
        expect(result.slope).toBeCloseTo(2);
        expect(result.intercept).toBeCloseTo(0);
        expect(result.r2).toBeCloseTo(1);
    });

    test('calculates correctly for typical scattered points', () => {
        const points = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 1.3 },
            { x: 4, y: 3.75 },
            { x: 5, y: 2.25 }
        ];
        // Results computed using standard linear regression formulas
        // sumX = 15, sumY = 10.3, n=5
        // x_mean = 3, y_mean = 2.06
        const result = linearRegression(points);
        expect(result.slope).toBeCloseTo(0.425);
        expect(result.intercept).toBeCloseTo(0.785);
        // Corrected expected R2 according to actual computation for these points
        expect(result.r2).toBeCloseTo(0.3929, 3);
    });

    test('returns null for points that form a vertical line (denom = 0)', () => {
        const points = [
            { x: 2, y: 1 },
            { x: 2, y: 5 },
            { x: 2, y: 10 }
        ];
        const result = linearRegression(points);
        expect(result).toBeNull();
    });

    test('handles r2 correctly when horizontal line (slope 0)', () => {
        const points = [
            { x: 1, y: 5 },
            { x: 2, y: 5 },
            { x: 3, y: 5 }
        ];
        const result = linearRegression(points);
        expect(result.slope).toBeCloseTo(0);
        expect(result.intercept).toBeCloseTo(5);
        expect(result.r2).toBeCloseTo(1); // Variance is 0, so our code defaults r2 to 1
    });
});
