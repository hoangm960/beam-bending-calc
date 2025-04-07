import React, { useState, useMemo } from "react";
import "./App.css";

export default function App() {
  // -----------------------------
  // Global Loading Inputs (SI Units)
  // -----------------------------
  const [beamLength, setBeamLength] = useState(1.0); // m
  const [force, setForce] = useState(1000); // Axial force in N
  const [moment, setMoment] = useState(1000); // Bending moment in N·m
  const [torque, setTorque] = useState(1000); // Torsional moment in N·m
  const [shearForce, setShearForce] = useState(500); // Shear force in N

  // -----------------------------
  // Cross-Section Type and Dimensions (SI Units)
  // -----------------------------
  const [sectionType, setSectionType] = useState("rectangle"); // "rectangle" or "circle"
  // For rectangle: dimensions in m
  const [rectWidth, setRectWidth] = useState(0.05); // m
  const [rectHeight, setRectHeight] = useState(0.1); // m
  // For circle: diameter in m
  const [diameter, setDiameter] = useState(0.08); // m

  // -----------------------------
  // Analysis Point in Y Direction (from the neutral axis, in m)
  // -----------------------------
  // Users should enter a value between -outerRadius and outerRadius.
  const [pointY, setPointY] = useState(0); // m

  // -----------------------------
  // Calculate Cross-Section Properties (memoized)
  // -----------------------------
  // All properties are now in SI units:
  // area in m², inertia in m⁴, polar inertia in m⁴, outerRadius in m,
  // and shearThickness in m.
  const sectionProps = useMemo(() => {
    let area = 0,
      inertia = 0,
      polarInertia = 0,
      outerRadius = 0;
    let shearThickness = 0; // effective thickness for shear

    if (sectionType === "rectangle") {
      area = rectWidth * rectHeight;
      inertia = (rectWidth * Math.pow(rectHeight, 3)) / 12;
      // Rough approximation for polar moment of inertia:
      polarInertia = (rectWidth * Math.pow(rectHeight, 3)) / 3;
      outerRadius = rectHeight / 2;
      shearThickness = rectWidth;
    } else if (sectionType === "circle") {
      area = (Math.PI * Math.pow(diameter, 2)) / 4;
      inertia = (Math.PI * Math.pow(diameter, 4)) / 64;
      polarInertia = (Math.PI * Math.pow(diameter, 4)) / 32;
      outerRadius = diameter / 2;
      shearThickness = diameter;
    }

    return { area, inertia, polarInertia, outerRadius, shearThickness };
  }, [sectionType, rectWidth, rectHeight, diameter]);

  // -----------------------------
  // Compute the First Moment (Q) at the Analysis Point
  // -----------------------------
  // Q is the first moment of the area above (if y>0) or below (if y<0) the analysis point.
  // For a rectangle (with total height h, half-height a = h/2):
  //   Q = (b/2)*((h/2)^2 - y^2)  for |y| ≤ h/2
  // For a circle (with radius r):
  //   Q = (2/3)*((r^2 - y^2)^(3/2)) for |y| ≤ r
  const Q_point = useMemo(() => {
    if (sectionType === "rectangle") {
      const a = rectHeight / 2;
      if (Math.abs(pointY) > a) return 0;
      return (rectWidth / 2) * (Math.pow(a, 2) - Math.pow(pointY, 2));
    } else if (sectionType === "circle") {
      const r = diameter / 2;
      if (Math.abs(pointY) > r) return 0;
      return (2 / 3) * Math.pow(r * r - pointY * pointY, 1.5);
    }
    return 0;
  }, [sectionType, rectHeight, rectWidth, diameter, pointY]);

  // -----------------------------
  // Stress Calculations at the Analysis Point (SI Units)
  // -----------------------------
  // Axial stress in Pa: σ = N / m²
  const axialStress = force / sectionProps.area;

  // Bending stress in Pa: σ = M * y / I (with M in N·m, I in m⁴)
  const bendingStress = (moment * pointY) / sectionProps.inertia;

  // Torsional shear stress in Pa: τ = T * |y| / J
  const torsionalShear =
    (torque * Math.abs(pointY)) / sectionProps.polarInertia;

  // Transverse shear stress in Pa: τ = V * Q / (I * t)
  const transverseShear =
    (shearForce * Q_point) /
    (sectionProps.inertia * sectionProps.shearThickness);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
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
            Global Loading Conditions
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
                step="0.1"
                value={moment}
                onChange={(e) => setMoment(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Torque (N·m)</label>
              <input
                type="number"
                step="0.1"
                value={torque}
                onChange={(e) => setTorque(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Shear Force (N)</label>
              <input
                type="number"
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
              <option value="circle">Circle</option>
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
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              <p>{sectionProps.inertia.toFixed(6)} m⁴</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-semibold text-blue-300">Polar Inertia (J)</h3>
              <p>{sectionProps.polarInertia.toFixed(6)} m⁴</p>
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
            Analysis Point in Y Direction
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
            Recommended range: between -{sectionProps.outerRadius.toFixed(4)}{" "}
            and {sectionProps.outerRadius.toFixed(4)} m.
          </p>
          <div className="mt-2 text-gray-300">
            Computed Q at this point: {Q_point.toFixed(6)} m³
          </div>
        </section>

        {/* Calculated Stresses at the Given Point */}
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
