import React, { useState, useMemo } from "react";

export default function App() {
  // --------------------------------
  // Unit Selection
  // --------------------------------
  const [forceUnit, setForceUnit] = useState("N"); // options: "N", "kN"
  const [distanceUnit, setDistanceUnit] = useState("m"); // options: "m", "mm"
  const [pressureUnit, setPressureUnit] = useState("Pa"); // options: "Pa", "MPa"

  // Conversion factors (to SI)
  const forceFactor = forceUnit === "kN" ? 1000 : 1; // convert force to N
  const distanceFactor = distanceUnit === "mm" ? 0.001 : 1; // convert distance to m
  const pressureFactor = pressureUnit === "MPa" ? 1e6 : 1; // used to convert computed SI stress to output

  // --------------------------------
  // Global Loading Inputs (in selected units)
  // --------------------------------
  const [beamLength, setBeamLength] = useState(1); // e.g., 1 m or 1000 mm (user enters value in chosen unit)
  const [force, setForce] = useState(1000); // e.g., 1000 N or 1 kN (user enters value in chosen unit)
  const [moment, setMoment] = useState(1000); // bending moment (N·m if force in N and distance in m)
  const [torque, setTorque] = useState(1000); // N·m
  const [shearForce, setShearForce] = useState(500); // N

  // --------------------------------
  // Cross-Section Type and Dimensions
  // --------------------------------
  // Options: "rectangle", "circle", "hollowCircle", "iBeam"
  const [sectionType, setSectionType] = useState("rectangle");

  // Rectangle dimensions (distance unit)
  const [rectWidth, setRectWidth] = useState(0.05);
  const [rectHeight, setRectHeight] = useState(0.1);

  // Solid circle: diameter (distance unit)
  const [circleDiameter, setCircleDiameter] = useState(0.08);

  // Hollow circle: outer and inner radii (distance unit)
  const [hollowOuter, setHollowOuter] = useState(0.08);
  const [hollowInner, setHollowInner] = useState(0.04);

  // I Beam: overall depth, flange width, flange thickness, web thickness (distance unit)
  const [iBeamDepth, setIBeamDepth] = useState(0.2);
  const [iBeamFlangeWidth, setIBeamFlangeWidth] = useState(0.1);
  const [iBeamFlangeThick, setIBeamFlangeThick] = useState(0.02);
  const [iBeamWebThick, setIBeamWebThick] = useState(0.01);

  // --------------------------------
  // Analysis Point in Y Direction (from neutral axis; in chosen distance unit)
  // --------------------------------
  const [pointY, setPointY] = useState(0);

  // --------------------------------
  // Convert all input values to SI units for internal calculations
  // --------------------------------
  const beamLengthSI = beamLength * distanceFactor;
  const forceSI = force * forceFactor;
  const momentSI = moment * forceFactor * distanceFactor;
  const torqueSI = torque * forceFactor * distanceFactor;
  const shearForceSI = shearForce * forceFactor;
  const rectWidthSI = rectWidth * distanceFactor;
  const rectHeightSI = rectHeight * distanceFactor;
  const circleDiameterSI = circleDiameter * distanceFactor;
  const hollowOuterSI = hollowOuter * distanceFactor;
  const hollowInnerSI = hollowInner * distanceFactor;
  const iBeamDepthSI = iBeamDepth * distanceFactor;
  const iBeamFlangeWidthSI = iBeamFlangeWidth * distanceFactor;
  const iBeamFlangeThickSI = iBeamFlangeThick * distanceFactor;
  const iBeamWebThickSI = iBeamWebThick * distanceFactor;
  const pointYSI = pointY * distanceFactor;

  // --------------------------------
  // Calculate Cross-Section Properties (in SI units)
  // --------------------------------
  const sectionProps = useMemo(() => {
    let area = 0,
      inertia = 0,
      polarInertia = 0,
      outerRadius = 0,
      shearThickness = 0;

    if (sectionType === "rectangle") {
      area = rectWidthSI * rectHeightSI;
      inertia = (rectWidthSI * Math.pow(rectHeightSI, 3)) / 12;
      polarInertia = (rectWidthSI * Math.pow(rectHeightSI, 3)) / 3; // approximate
      outerRadius = rectHeightSI / 2;
      shearThickness = rectWidthSI;
    } else if (sectionType === "circle") {
      const r = circleDiameterSI / 2;
      area = Math.PI * Math.pow(r, 2);
      inertia = (Math.PI * Math.pow(r, 4)) / 4;
      polarInertia = (Math.PI * Math.pow(r, 4)) / 2;
      outerRadius = r;
      shearThickness = circleDiameterSI; // using diameter as effective thickness
    } else if (sectionType === "hollowCircle") {
      const R_o = hollowOuterSI;
      const R_i = hollowInnerSI;
      if (R_i >= R_o) {
        area = 0;
        inertia = 0;
        polarInertia = 0;
        outerRadius = R_o;
        shearThickness = 0;
      } else {
        area = Math.PI * (Math.pow(R_o, 2) - Math.pow(R_i, 2));
        inertia = (Math.PI / 4) * (Math.pow(R_o, 4) - Math.pow(R_i, 4));
        polarInertia = (Math.PI / 2) * (Math.pow(R_o, 4) - Math.pow(R_i, 4));
        outerRadius = R_o;
        shearThickness = R_o - R_i;
      }
    } else if (sectionType === "iBeam") {
      // I-beam: overall depth = h, flange width = bf, flange thickness = tf, web thickness = tw.
      const h = iBeamDepthSI;
      const bf = iBeamFlangeWidthSI;
      const tf = iBeamFlangeThickSI;
      const tw = iBeamWebThickSI;
      // Area: two flanges plus web
      area = 2 * bf * tf + tw * (h - 2 * tf);
      // Bending moment of inertia about horizontal axis using subtraction:
      inertia =
        (bf * Math.pow(h, 3) - (bf - tw) * Math.pow(h - 2 * tf, 3)) / 12;
      // Approximate polar moment inertia
      polarInertia = inertia;
      outerRadius = h / 2;
      shearThickness = tw;
    }
    return { area, inertia, polarInertia, outerRadius, shearThickness };
  }, [
    sectionType,
    rectWidthSI,
    rectHeightSI,
    circleDiameterSI,
    hollowOuterSI,
    hollowInnerSI,
    iBeamDepthSI,
    iBeamFlangeWidthSI,
    iBeamFlangeThickSI,
    iBeamWebThickSI,
  ]);

  // --------------------------------
  // Compute the First Moment Q at the Analysis Point (in SI units)
  // --------------------------------
  const Q_point = useMemo(() => {
    const yAbs = Math.abs(pointYSI);
    if (sectionType === "rectangle") {
      const a = rectHeightSI / 2;
      if (yAbs > a) return 0;
      return (rectWidthSI / 2) * (Math.pow(a, 2) - Math.pow(pointYSI, 2));
    } else if (sectionType === "circle") {
      const r = circleDiameterSI / 2;
      if (yAbs > r) return 0;
      return (2 / 3) * Math.pow(r * r - pointYSI * pointYSI, 1.5);
    } else if (sectionType === "hollowCircle") {
      const R_o = hollowOuterSI;
      const R_i = hollowInnerSI;
      if (yAbs > R_o) return 0;
      if (yAbs <= R_i) {
        return (
          (2 / 3) *
          (Math.pow(R_o * R_o - pointYSI * pointYSI, 1.5) -
            Math.pow(R_i * R_i - pointYSI * pointYSI, 1.5))
        );
      } else {
        return (2 / 3) * Math.pow(R_o * R_o - pointYSI * pointYSI, 1.5);
      }
    } else if (sectionType === "iBeam") {
      const h = iBeamDepthSI;
      const tf = iBeamFlangeThickSI;
      const bf = iBeamFlangeWidthSI;
      const tw = iBeamWebThickSI;
      const halfDepth = h / 2;
      if (yAbs > halfDepth) return 0;
      if (yAbs <= halfDepth - tf) {
        // Analysis point is in the web.
        const Q_flange = bf * tf; // top flange area contribution
        const webArea = tw * (halfDepth - tf - yAbs);
        const webCentroid = (halfDepth - tf + yAbs) / 2;
        return Q_flange + webArea * webCentroid;
      } else {
        // Analysis point is within the top flange.
        const flangeHeightAbove = halfDepth - yAbs;
        return bf * flangeHeightAbove * (flangeHeightAbove / 2);
      }
    }
    return 0;
  }, [
    sectionType,
    pointYSI,
    rectHeightSI,
    rectWidthSI,
    circleDiameterSI,
    hollowOuterSI,
    hollowInnerSI,
    iBeamDepthSI,
    iBeamFlangeThickSI,
    iBeamFlangeWidthSI,
    iBeamWebThickSI,
  ]);

  // --------------------------------
  // Stress Calculations at the Analysis Point (in SI units)
  // --------------------------------
  // Axial stress: σ = N / A
  const axialStressSI = forceSI / sectionProps.area;
  // Bending stress: σ = M * y / I
  const bendingStressSI = (momentSI * pointYSI) / sectionProps.inertia;
  // Torsional shear: τ = T * |y| / J
  const torsionalShearSI =
    (torqueSI * Math.abs(pointYSI)) / sectionProps.polarInertia;
  // Transverse shear: τ = V * Q / (I * t)
  const transverseShearSI =
    (shearForceSI * Q_point) /
    (sectionProps.inertia * sectionProps.shearThickness);

  // Convert computed stresses to chosen pressure unit for display
  const axialStressDisplay = axialStressSI / pressureFactor;
  const bendingStressDisplay = bendingStressSI / pressureFactor;
  const torsionalShearDisplay = torsionalShearSI / pressureFactor;
  const transverseShearDisplay = transverseShearSI / pressureFactor;

  return (
    <div className="w-screen min-h-screen bg-gray-900 text-white p-6 flex flex-col justify-center items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-300">
          Beam Stress Analyzer
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Analyze cross-sectional stresses at a specified distance from the
          neutral axis.
        </p>
      </header>
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Unit Selection */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Select Units
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium mb-1">Force Unit</label>
              <select
                value={forceUnit}
                onChange={(e) => setForceUnit(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="N">N</option>
                <option value="kN">kN</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Distance Unit</label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="m">m</option>
                <option value="mm">mm</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Pressure Unit</label>
              <select
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              >
                <option value="Pa">Pa</option>
                <option value="MPa">MPa</option>
              </select>
            </div>
          </div>
        </section>

        {/* Global Loading Inputs */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Global Loading Conditions ({forceUnit}, {distanceUnit}, etc.)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium mb-1">
                Beam Length ({distanceUnit})
              </label>
              <input
                type="number"
                step="0.01"
                value={beamLength}
                onChange={(e) => setBeamLength(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Axial Force ({forceUnit})
              </label>
              <input
                type="number"
                step="1"
                value={force}
                onChange={(e) => setForce(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Bending Moment ({forceUnit}·{distanceUnit})
              </label>
              <input
                type="number"
                step="1"
                value={moment}
                onChange={(e) => setMoment(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Torque ({forceUnit}·{distanceUnit})
              </label>
              <input
                type="number"
                step="1"
                value={torque}
                onChange={(e) => setTorque(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Shear Force ({forceUnit})
              </label>
              <input
                type="number"
                step="1"
                value={shearForce}
                onChange={(e) => setShearForce(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
          </div>
        </section>

        {/* Cross-Section Inputs */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Cross-Section Properties
          </h2>
          <div className="mb-4">
            <label className="block font-medium mb-1">Section Type</label>
            <select
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle (Solid)</option>
              <option value="hollowCircle">Hollow Circle</option>
              <option value="iBeam">I Beam</option>
            </select>
          </div>

          {sectionType === "rectangle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">
                  Width ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={rectWidth}
                  onChange={(e) => setRectWidth(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Height ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={rectHeight}
                  onChange={(e) => setRectHeight(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
            </div>
          )}

          {sectionType === "circle" && (
            <div>
              <label className="block font-medium mb-1">
                Diameter ({distanceUnit})
              </label>
              <input
                type="number"
                step="0.001"
                value={circleDiameter}
                onChange={(e) => setCircleDiameter(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              />
            </div>
          )}

          {sectionType === "hollowCircle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">
                  Outer Radius ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={hollowOuter}
                  onChange={(e) => setHollowOuter(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Inner Radius ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={hollowInner}
                  onChange={(e) => setHollowInner(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
            </div>
          )}

          {sectionType === "iBeam" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">
                  Overall Depth, h ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={iBeamDepth}
                  onChange={(e) => setIBeamDepth(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Flange Width, bₓ ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={iBeamFlangeWidth}
                  onChange={(e) => setIBeamFlangeWidth(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Flange Thickness, t_f ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={iBeamFlangeThick}
                  onChange={(e) => setIBeamFlangeThick(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Web Thickness, t_w ({distanceUnit})
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={iBeamWebThick}
                  onChange={(e) => setIBeamWebThick(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Display computed cross-section properties */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-semibold text-blue-300">Area</h3>
              <p>{sectionProps.area.toFixed(4)} m²</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-semibold text-blue-300">
                Bending Inertia (I)
              </h3>
              <p>{sectionProps.inertia.toExponential(2)} m⁴</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-semibold text-blue-300">Polar Inertia (J)</h3>
              <p>{sectionProps.polarInertia.toExponential(2)} m⁴</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-semibold text-blue-300">Outer Radius</h3>
              <p>{sectionProps.outerRadius.toFixed(4)} m</p>
            </div>
          </div>
        </section>

        {/* Analysis Point in Y Direction */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Analysis Point in Y Direction ({distanceUnit})
          </h2>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              step="0.001"
              value={pointY}
              onChange={(e) => setPointY(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
              placeholder="Enter distance from neutral axis"
            />
            <span className="w-20 text-center">{distanceUnit}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Recommended range: between -{sectionProps.outerRadius.toFixed(4)} m
            and {sectionProps.outerRadius.toFixed(4)} m.
          </p>
          <div className="mt-2 text-gray-300">
            Computed Q at this point: {Q_point.toFixed(4)} m³
          </div>
        </section>

        {/* Calculated Stresses */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Calculated Stresses ({pressureUnit})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">Axial Stress:</p>
              <p>
                {axialStressDisplay.toFixed(4)} {pressureUnit}
              </p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">
                Bending Stress (at y = {pointY} {distanceUnit}):
              </p>
              <p>
                {bendingStressDisplay.toFixed(4)} {pressureUnit}
              </p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">
                Torsional Shear (at y = {pointY} {distanceUnit}):
              </p>
              <p>
                {torsionalShearDisplay.toFixed(4)} {pressureUnit}
              </p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">Transverse Shear (using Q):</p>
              <p>
                {transverseShearDisplay.toFixed(4)} {pressureUnit}
              </p>
            </div>
          </div>
        </section>
      </div>
      <footer className="mt-8 text-center text-gray-500">
        <p>&copy; 2025 Beam Stress Analyzer</p>
      </footer>
    </div>
  );
}
