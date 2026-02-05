import proj4 from 'proj4';

/**
 * Coordinate Reference Systems
 */
export const CRS_SWEREF99TM = 'EPSG:3006';
export const CRS_WGS84 = 'EPSG:4326';

/**
 * Define SWEREF99 TM projection for proj4
 * Official definition from Lantmäteriet
 */
proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');

/**
 * Point in SWEREF99TM coordinates
 */
export interface Sweref99Point {
  x: number; // Easting
  y: number; // Northing
}

/**
 * Point in WGS84 coordinates
 */
export interface Wgs84Point {
  latitude: number;
  longitude: number;
}

/**
 * Convert SWEREF99TM coordinates to WGS84
 */
export function sweref99ToWgs84(point: Sweref99Point): Wgs84Point {
  // proj4 uses [x, y] = [easting, northing] order for projected CRS
  const result = proj4('EPSG:3006', 'EPSG:4326', [point.x, point.y]);

  return {
    longitude: result[0],
    latitude: result[1],
  };
}
