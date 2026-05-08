# Luna — Moon Shadow Tip Mapper

**Live app: https://tim0s.github.io/Luna/**

Given a tall object (tower, antenna, building) and a time window, Luna computes where the tip of its moon shadow falls on the ground for every qualifying night-time moment — and shows you the results on an interactive map.

## What it does

Each arrow on the map represents one moment when the moon casts a visible shadow from the object. The arrowhead marks the shadow tip; the arrow direction shows how the tip was moving over ±10 minutes. Arrows are colored on a plasma scale from early (purple) to late (yellow) within the displayed date range.

Click any arrow to open a WebGL scene preview: a simulated view from that ground location looking back toward the object, with the moon visible in the sky. You can step ±15 minutes around the moment, change sensor size and focal length, and toggle landscape/portrait orientation.

## How it works

### Moon position
Moon altitude and azimuth are calculated using the full Meeus *Astronomical Algorithms* Ch. 47 series (60 longitude terms, 20 latitude terms, 15 distance terms), with topocentric parallax correction. Sun altitude uses a simplified Meeus formula for the same timestamp. No external astronomy API is used.

### Terrain
Elevation data is loaded on-demand from [AWS Terrarium tiles](https://registry.opendata.aws/terrain-tiles/) at zoom 12 (~10 m/px). The raw RGB-encoded elevation values are decoded and stored in a floating-point grid, then sampled via bicubic Catmull-Rom interpolation for smooth results.

### Shadow ray-march
For each qualifying timestamp, the code traces a ray from the top of the object in the anti-moon direction. It steps outward at configurable intervals and checks whether the ray height drops below the terrain surface. The intersection is refined with linear interpolation to find the shadow tip position.

### Scene preview (WebGL)
The preview is rendered with a WebGL fragment shader that:
- Reads a 1024-sample skyline texture (maximum terrain elevation angle at each horizontal pixel column) computed via ray-marching from the observer position
- Draws sky, terrain silhouette, moon disc + glow, and the object silhouette
- Adjusts sky brightness based on sun altitude (night → deep blue / day → pale)

### Filters
Only moments that pass all of the following are shown:
- Moon altitude above a minimum (default 2°)
- Sun altitude below a maximum (default 0° — sun must be below the horizon)
- Moon illumination above a minimum (default 30%)
- Shadow tip within the map area and beyond a minimum distance from the object

## Settings

Click the ⚙ button to change:

| Field | Meaning |
|---|---|
| Latitude / Longitude | Object position |
| Height / Width | Object dimensions in metres |
| Start / End | Time window to scan |
| Step | Time resolution in hours |
| Min moon altitude | Reject moments when moon is too low |
| Min distance | Reject tips too close to the object |
| Max sun altitude | Reject moments when it is not dark enough |
| Min moon illum % | Reject thin crescents |
| Timezone | Display timezone for timestamps (IANA name or `local`) |

The date filter bar at the top of the map lets you narrow the displayed arrows without a full recalculation.

## Tech stack

- [Leaflet](https://leafletjs.com/) for the map
- [CARTO light basemap](https://carto.com/basemaps/) tiles
- [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium format) for elevation
- WebGL (via `canvas.getContext('webgl')`) for the scene preview
- No build step — plain HTML + JS, runs entirely in the browser
