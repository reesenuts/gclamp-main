/** @type {import('tailwindcss').Config} */
module.exports = {
  // Include all files in the `app` directory (Expo Router) and components so
  // Tailwind can detect NativeWind classes used there.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    colors: {
      white: "#ffffff",
      millionGrey: "#999999",
      saltBlue: "#7C9B9C",
      twilightZone: "#191815",
      crystalBell: "#EFEFEF",
      metalDeluxe: "#21463E",
      gratin: "#E3D4AA",
      mercury: "#EBEBEB",
      moonBase: "#7D7C78",
      dashing: "#EBEBE8",
      seljukBlue: "#4285F4",
      doctor: "#F9F9F9",

      starfleetBlue: "#0894FF",
      princetonOrange: "#FF9004",
      thickPink: "#C959DD",
      reddishPink: "#FF2E54",

      mettwurst: "#E16F64",
      ladyAnne: "#FFE2DD",

      preciousOxley: "#6C9B7D",
      dewMist: "#DBEDDB",

      wet: "#91918E",
      beryl: "#E3E2E0",

    },
    extend: {},
  },
  plugins: [],
};
