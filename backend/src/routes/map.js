const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


const geojsonPath = path.join(__dirname, '../data/izmir-districts.geojson');


router.get('/branches', authenticate, async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        const [branches] = await db.execute(
            `SELECT 
        b.id,
        b.name,
        b.district,
        b.latitude,
        b.longitude,
        b.status,
        COALESCE(SUM(s.revenue), 0) as revenue,
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.branch_id = b.id AND YEAR(e.date) = ?), 0) as expenses
       FROM branches b
       LEFT JOIN sales s ON b.id = s.branch_id AND YEAR(s.date) = ?
       WHERE b.status = 'Active'
       GROUP BY b.id, b.name, b.district, b.latitude, b.longitude, b.status`,
            [targetYear, targetYear]
        );

        const features = branches.map(branch => {
            const revenue = parseFloat(branch.revenue) || 0;
            const expenses = parseFloat(branch.expenses) || 0;
            const profit = revenue - expenses;
            const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

            return {
                type: 'Feature',
                properties: {
                    id: branch.id,
                    name: branch.name,
                    district: branch.district,
                    status: branch.status,
                    revenue,
                    expenses,
                    profit,
                    margin: parseFloat(margin),
                    isProfitable: profit > 0
                },
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(branch.longitude), parseFloat(branch.latitude)]
                }
            };
        });

        res.json({
            type: 'FeatureCollection',
            features
        });

    } catch (error) {
        console.error('Get map branches error:', error);
        res.status(500).json({ error: 'Harita verileri alınamadı.' });
    }
});


router.get('/districts', authenticate, async (req, res) => {
    try {
        
        let geojson;
        try {
            const geojsonContent = fs.readFileSync(geojsonPath, 'utf8');
            geojson = JSON.parse(geojsonContent);
        } catch (err) {
            console.error('Error loading GeoJSON:', err);
            return res.status(500).json({ error: 'GeoJSON dosyası yüklenemedi.' });
        }

        
        const [districts] = await db.execute(
            `SELECT district, population, density FROM population_districts`
        );

        
        const [branchData] = await db.execute(
            `SELECT 
        b.district,
        COUNT(*) as branch_count,
        SUM(COALESCE((SELECT SUM(s.revenue) FROM sales s WHERE s.branch_id = b.id AND YEAR(s.date) = YEAR(CURDATE())), 0)) as total_revenue
       FROM branches b
       WHERE b.status = 'Active'
       GROUP BY b.district`
        );

        
        const districtMap = districts.reduce((map, d) => {
            map[d.district] = d;
            return map;
        }, {});

        const branchMap = branchData.reduce((map, b) => {
            map[b.district] = b;
            return map;
        }, {});

        
        geojson.features = geojson.features.map(feature => {
            const districtName = feature.properties.name;
            const popData = districtMap[districtName] || {};
            const branchInfo = branchMap[districtName] || {};

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    population: popData.population || 0,
                    density: parseFloat(popData.density) || 0,
                    branchCount: branchInfo.branch_count || 0,
                    totalRevenue: parseFloat(branchInfo.total_revenue) || 0,
                    
                    heatValue: parseFloat(popData.density) || 0
                }
            };
        });

        res.json(geojson);

    } catch (error) {
        console.error('Get map districts error:', error);
        res.status(500).json({ error: 'İlçe harita verileri alınamadı.' });
    }
});


router.get('/heatmap-data', authenticate, async (req, res) => {
    try {
        const [districts] = await db.execute(
            `SELECT 
        pd.district,
        pd.population,
        pd.density,
        pd.latitude,
        pd.longitude,
        COALESCE((SELECT COUNT(*) FROM branches b WHERE b.district = pd.district AND b.status = 'Active'), 0) as branch_count
       FROM population_districts pd
       ORDER BY pd.density DESC`
        );

        const heatmapData = districts.map(d => ({
            district: d.district,
            lat: parseFloat(d.latitude),
            lng: parseFloat(d.longitude),
            intensity: parseFloat(d.density) / 1000, 
            population: d.population,
            density: parseFloat(d.density),
            branchCount: d.branch_count
        }));

        res.json({ data: heatmapData });

    } catch (error) {
        console.error('Get heatmap data error:', error);
        res.status(500).json({ error: 'Isı haritası verileri alınamadı.' });
    }
});


router.get('/opportunity-overlay', authenticate, async (req, res) => {
    try {
        
        let geojson;
        try {
            const geojsonContent = fs.readFileSync(geojsonPath, 'utf8');
            geojson = JSON.parse(geojsonContent);
        } catch (err) {
            return res.status(500).json({ error: 'GeoJSON dosyası yüklenemedi.' });
        }

        
        const [opportunities] = await db.execute(
            `SELECT * FROM opportunity_score_by_district`
        );

        const oppMap = opportunities.reduce((map, o) => {
            map[o.district] = o;
            return map;
        }, {});

        
        geojson.features = geojson.features.map(feature => {
            const districtName = feature.properties.name;
            const opp = oppMap[districtName] || {};

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    opportunityScore: parseFloat(opp.opportunity_score) || 0,
                    populationPerBranch: opp.population_per_branch || 0,
                    avgBranchProfit: parseFloat(opp.avg_branch_profit) || 0
                }
            };
        });

        res.json(geojson);

    } catch (error) {
        console.error('Get opportunity overlay error:', error);
        res.status(500).json({ error: 'Fırsat haritası verileri alınamadı.' });
    }
});

module.exports = router;
