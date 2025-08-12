import pool from '../utils/db.js';

export async function getDashboardMetrics() {
  const { rows } = await pool.query(
    `SELECT population_growth, vehicle_change, vehicle_density_change FROM dashboard_metrics LIMIT 1`
  );

  const row = rows[0] || {};
  return {
    populationGrowth: row.population_growth ?? null,
    vehicleChange: row.vehicle_change ?? null,
    vehicleDensityChange: row.vehicle_density_change ?? null,
  };
}
