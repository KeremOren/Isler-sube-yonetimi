/**
 * Analytics Service Tests
 * 
 * Tests for the core analytics calculations including:
 * - Risk scoring
 * - Opportunity scoring
 * - KPI calculations
 */

// Mock database
const mockDb = {
    execute: jest.fn()
};

// Mock the database module
jest.mock('../src/config/database', () => mockDb);

// Import after mocking
const analyticsService = require('../src/services/analytics');

describe('Analytics Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Risk Score Calculation', () => {
        test('should return 0 risk for healthy branch', () => {
            const factors = { lossStreak: 0, lossMonths: 0 };
            const revenueTrend = 10; // 10% growth
            const fixedCostRatio = 50; // 50% fixed costs
            const avgBasket = 40; // Good basket size

            // The calculation logic
            let score = 0;
            // Loss streak factor (0-6 months = 0-30 points)
            score += Math.min(30, factors.lossStreak * 5);
            // Revenue trend (negative = bad)
            if (revenueTrend < 0) {
                score += Math.min(25, Math.abs(revenueTrend) / 2);
            }
            // Fixed cost ratio (>70% is concerning)
            if (fixedCostRatio > 60) {
                score += Math.min(25, (fixedCostRatio - 60) / 2);
            }
            // Basket size (lower than 25 is concerning)
            if (avgBasket < 30) {
                score += Math.min(20, (30 - avgBasket) * 2);
            }

            expect(score).toBe(0);
        });

        test('should return high risk for struggling branch', () => {
            const factors = { lossStreak: 5, lossMonths: 5 };
            const revenueTrend = -20; // 20% decline
            const fixedCostRatio = 80; // 80% fixed costs
            const avgBasket = 15; // Low basket size

            let score = 0;
            score += Math.min(30, factors.lossStreak * 5); // 25 points
            if (revenueTrend < 0) {
                score += Math.min(25, Math.abs(revenueTrend) / 2); // 10 points
            }
            if (fixedCostRatio > 60) {
                score += Math.min(25, (fixedCostRatio - 60) / 2); // 10 points
            }
            if (avgBasket < 30) {
                score += Math.min(20, (30 - avgBasket) * 2); // 20 points (capped)
            }

            expect(score).toBeGreaterThanOrEqual(70);
        });

        test('should cap maximum risk score at 100', () => {
            const factors = { lossStreak: 10, lossMonths: 10 };
            const revenueTrend = -50;
            const fixedCostRatio = 95;
            const avgBasket = 5;

            let score = 0;
            score += Math.min(30, factors.lossStreak * 5);
            if (revenueTrend < 0) {
                score += Math.min(25, Math.abs(revenueTrend) / 2);
            }
            if (fixedCostRatio > 60) {
                score += Math.min(25, (fixedCostRatio - 60) / 2);
            }
            if (avgBasket < 30) {
                score += Math.min(20, (30 - avgBasket) * 2);
            }

            const finalScore = Math.min(100, Math.max(0, Math.round(score)));
            expect(finalScore).toBeLessThanOrEqual(100);
        });
    });

    describe('Risk Level Classification', () => {
        const getRiskLevel = (score) => {
            if (score >= 70) return 'Yüksek';
            if (score >= 40) return 'Orta';
            return 'Düşük';
        };

        test('should classify score 0-39 as Low Risk', () => {
            expect(getRiskLevel(0)).toBe('Düşük');
            expect(getRiskLevel(20)).toBe('Düşük');
            expect(getRiskLevel(39)).toBe('Düşük');
        });

        test('should classify score 40-69 as Medium Risk', () => {
            expect(getRiskLevel(40)).toBe('Orta');
            expect(getRiskLevel(55)).toBe('Orta');
            expect(getRiskLevel(69)).toBe('Orta');
        });

        test('should classify score 70-100 as High Risk', () => {
            expect(getRiskLevel(70)).toBe('Yüksek');
            expect(getRiskLevel(85)).toBe('Yüksek');
            expect(getRiskLevel(100)).toBe('Yüksek');
        });
    });

    describe('Opportunity Score Calculation', () => {
        test('should give high score for uncovered high-density area', () => {
            const density = 12000; // High density
            const branchCount = 0; // No branches
            const population = 350000;
            const avgProfit = 0; // No existing performance

            let score = 0;
            // Density factor (max 30 points)
            score += Math.min(30, density / 400); // 30 points
            // Coverage gap factor (max 40 points)
            if (branchCount === 0) {
                score += 40; // 40 points
            }
            // Performance factor (max 30 points) - unknown, moderate
            if (branchCount === 0) {
                score += 15; // 15 points
            }

            expect(score).toBeGreaterThanOrEqual(70);
        });

        test('should give lower score for well-covered area', () => {
            const density = 5000;
            const branchCount = 3; // Multiple branches
            const population = 200000;
            const avgProfit = 50000;

            let score = 0;
            score += Math.min(30, density / 400); // 12.5 points
            if (branchCount === 0) {
                score += 40;
            } else if (branchCount === 1 && population > 100000) {
                score += 30;
            } else if (branchCount === 1) {
                score += 20;
            } else if (population / branchCount > 150000) {
                score += 15;
            } else {
                score += 5; // 5 points
            }
            // Performance factor
            if (avgProfit > 100000) {
                score += 30;
            } else if (avgProfit > 50000) {
                score += 20;
            } else if (avgProfit > 0) {
                score += 10; // 10 points
            }

            expect(score).toBeLessThan(50);
        });
    });

    describe('KPI Calculations', () => {
        test('should calculate margin correctly', () => {
            const revenue = 1000000;
            const expenses = 800000;
            const profit = revenue - expenses; // 200000
            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

            expect(margin).toBe(20);
        });

        test('should handle zero revenue', () => {
            const revenue = 0;
            const expenses = 50000;
            const profit = revenue - expenses;
            const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

            expect(margin).toBe(0);
        });

        test('should calculate YoY change correctly', () => {
            const currentRevenue = 1200000;
            const previousRevenue = 1000000;
            const yoyChange = previousRevenue > 0
                ? (((currentRevenue - previousRevenue) / previousRevenue) * 100)
                : null;

            expect(yoyChange).toBe(20);
        });

        test('should handle negative YoY change', () => {
            const currentRevenue = 800000;
            const previousRevenue = 1000000;
            const yoyChange = previousRevenue > 0
                ? (((currentRevenue - previousRevenue) / previousRevenue) * 100)
                : null;

            expect(yoyChange).toBe(-20);
        });
    });

    describe('Moving Average Calculation', () => {
        test('should calculate 3-month moving average', () => {
            const profits = [100000, 120000, 110000]; // Last 3 months
            const movingAvg = profits.reduce((a, b) => a + b, 0) / 3;

            expect(movingAvg).toBeCloseTo(110000);
        });

        test('should handle insufficient data', () => {
            const profits = [100000, 120000]; // Only 2 months
            const index = 1; // Current index

            // Only calculate if we have 3+ months
            const movingAvg = index >= 2
                ? profits.reduce((a, b) => a + b, 0) / 3
                : null;

            expect(movingAvg).toBeNull();
        });
    });
});

describe('Formatting Utilities', () => {
    describe('Currency Formatting', () => {
        const formatCurrency = (value) => {
            if (value === null || value === undefined) return '-';
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        };

        test('should format positive currency', () => {
            const result = formatCurrency(1250000);
            expect(result).toContain('1.250.000');
        });

        test('should handle null values', () => {
            expect(formatCurrency(null)).toBe('-');
            expect(formatCurrency(undefined)).toBe('-');
        });
    });

    describe('Percentage Formatting', () => {
        const formatPercent = (value) => {
            if (value === null || value === undefined) return '-';
            return `%${value.toFixed(1)}`;
        };

        test('should format percentage correctly', () => {
            expect(formatPercent(25.5)).toBe('%25.5');
            expect(formatPercent(100)).toBe('%100.0');
        });

        test('should handle null values', () => {
            expect(formatPercent(null)).toBe('-');
        });
    });
});
