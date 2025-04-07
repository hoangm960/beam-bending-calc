import React, { useState, useMemo } from "react";

export default function App() {
  // -----------------------------
  // Global Loading Inputs (SI units: meters, N, N·m, etc.)
  // -----------------------------
  const [beamLength, setBeamLength] = useState(1); // m
  const [force, setForce] = useState(1000); // N
  const [moment, setMoment] = useState(1000); // N·m (bending moment)
  const [torque, setTorque] = useState(1000); // N·m
  const [shearForce, setShearForce] = useState(500); // N

  // -----------------------------
  // Cross-Section Type and Dimensions
  // -----------------------------
  // Options: "rectangle", "circle", "hollowCircle"
  const [sectionType, setSectionType] = useState("rectangle");
  // Rectangle inputs (in m)
  const [rectWidth, setRectWidth] = useState(0.05); // m
  const [rectHeight, setRectHeight] = useState(0.1); // m
  // Solid circle input (in m)
  const [circleDiameter, setCircleDiameter] = useState(0.08); // m
  // Hollow circle inputs (in m)
  const [hollowOuter, setHollowOuter] = useState(0.08); // m
  const [hollowInner, setHollowInner] = useState(0.04); // m

  // -----------------------------
  // Analysis Point in Y Direction (from the neutral axis) in m
  // -----------------------------
  const [pointY, setPointY] = useState(0); // m

  // -----------------------------
  // Calculate Cross-Section Properties (memoized)
  // -----------------------------
  // This calculates area, bending inertia I, polar inertia J, outer radius, and effective shear thickness.
  const sectionProps = useMemo(() => {
    let area = 0,
      inertia = 0,
      polarInertia = 0,
      outerRadius = 0,
      shearThickness = 0;

    if (sectionType === "rectangle") {
      area = rectWidth * rectHeight;
      inertia = (rectWidth * Math.pow(rectHeight, 3)) / 12;
      polarInertia = (rectWidth * Math.pow(rectHeight, 3)) / 3; // approximate
      outerRadius = rectHeight / 2;
      shearThickness = rectWidth;
    } else if (sectionType === "circle") {
      // For a solid circle, diameter is provided.
      const r = circleDiameter / 2;
      area = Math.PI * Math.pow(r, 2);
      inertia = (Math.PI * Math.pow(r, 4)) / 4;
      polarInertia = (Math.PI * Math.pow(r, 4)) / 2;
      outerRadius = r;
      shearThickness = circleDiameter; // using diameter as effective thickness
    } else if (sectionType === "hollowCircle") {
      // Ensure inner radius is less than outer radius.
      const R_o = hollowOuter;
      const R_i = hollowInner;
      if (R_i >= R_o) {
        // Fall back to a minimal valid section if invalid input.
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
        shearThickness = R_o - R_i; // approximate effective thickness
      }
    }
    return { area, inertia, polarInertia, outerRadius, shearThickness };
  }, [
    sectionType,
    rectWidth,
    rectHeight,
    circleDiameter,
    hollowOuter,
    hollowInner,
  ]);

  // -----------------------------
  // Compute the First Moment Q at the Analysis Point
  // -----------------------------
  // Q is computed differently for each section type.
  const Q_point = useMemo(() => {
    if (sectionType === "rectangle") {
      const a = rectHeight / 2;
      if (Math.abs(pointY) > a) return 0;
      return (rectWidth / 2) * (Math.pow(a, 2) - Math.pow(pointY, 2));
    } else if (sectionType === "circle") {
      const r = circleDiameter / 2;
      if (Math.abs(pointY) > r) return 0;
      return (2 / 3) * Math.pow(r * r - pointY * pointY, 1.5);
    } else if (sectionType === "hollowCircle") {
      const R_o = hollowOuter;
      const R_i = hollowInner;
      if (Math.abs(pointY) > R_o) return 0;
      if (Math.abs(pointY) <= R_i) {
        // Subtract inner circle contribution
        return (
          (2 / 3) *
          (Math.pow(R_o * R_o - pointY * pointY, 1.5) -
            Math.pow(R_i * R_i - pointY * pointY, 1.5))
        );
      } else {
        // If pointY is between R_i and R_o, the hole is completely below the line.
        return (2 / 3) * Math.pow(R_o * R_o - pointY * pointY, 1.5);
      }
    }
    return 0;
  }, [
    sectionType,
    rectHeight,
    rectWidth,
    circleDiameter,
    hollowOuter,
    hollowInner,
    pointY,
  ]);

  // -----------------------------
  // Stress Calculations at the Analysis Point
  // -----------------------------
  // Axial stress: σ = N / A (uniform)
  const axialStress = force / sectionProps.area;
  // Bending stress: σ = M * y / I
  const bendingStress = (moment * pointY) / sectionProps.inertia;
  // Torsional shear stress: τ = T * |y| / J
  const torsionalShear =
    (torque * Math.abs(pointY)) / sectionProps.polarInertia;
  // Transverse shear stress: τ = V * Q / (I * t)
  const transverseShear =
    (shearForce * Q_point) /
    (sectionProps.inertia * sectionProps.shearThickness);

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
        {/* Global Loading Inputs */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Global Loading Conditions (SI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium mb-1">Beam Length (m)</label>
              <input
                type="number"
                step="0.01"
                value={beamLength}
                onChange={(e) => setBeamLength(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Axial Force (N)</label>
              <input
                type="number"
                step="1"
                value={force}
                onChange={(e) => setForce(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Bending Moment (N·m)
              </label>
              <input
                type="number"
                step="1"
                value={moment}
                onChange={(e) => setMoment(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Torque (N·m)</label>
              <input
                type="number"
                step="1"
                value={torque}
                onChange={(e) => setTorque(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Shear Force (N)</label>
              <input
                type="number"
                step="1"
                value={shearForce}
                onChange={(e) => setShearForce(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle (Solid)</option>
              <option value="hollowCircle">Hollow Circle</option>
            </select>
          </div>

          {sectionType === "rectangle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Width (m)</label>
                <input
                  type="number"
                  step="0.001"
                  value={rectWidth}
                  onChange={(e) => setRectWidth(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Height (m)</label>
                <input
                  type="number"
                  step="0.001"
                  value={rectHeight}
                  onChange={(e) => setRectHeight(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {sectionType === "circle" && (
            <div>
              <label className="block font-medium mb-1">Diameter (m)</label>
              <input
                type="number"
                step="0.001"
                value={circleDiameter}
                onChange={(e) => setCircleDiameter(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {sectionType === "hollowCircle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">
                  Outer Radius (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={hollowOuter}
                  onChange={(e) => setHollowOuter(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Inner Radius (m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={hollowInner}
                  onChange={(e) => setHollowInner(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Analysis Point in Y Direction (m)
          </h2>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              step="0.001"
              value={pointY}
              onChange={(e) => setPointY(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter distance from neutral axis (m)"
            />
            <span className="w-20 text-center">m</span>
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
            Calculated Stresses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">Axial Stress:</p>
              <p>{axialStress.toFixed(2)} Pa</p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">Bending Stress (at y = {pointY} m):</p>
              <p>{bendingStress.toFixed(2)} Pa</p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">
                Torsional Shear (at y = {pointY} m):
              </p>
              <p>{torsionalShear.toFixed(2)} Pa</p>
            </div>
            <div className="p-4 bg-green-900 border border-green-700 rounded-md">
              <p className="font-medium">Transverse Shear (using Q):</p>
              <p>{transverseShear.toFixed(2)} Pa</p>
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
