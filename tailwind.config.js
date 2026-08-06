/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#14100C",
        surface: "#1F1912",
        surfaceRaised: "#2A2216",
        accent: "#C58D29",
        accentSoft: "#3A2C13",
        accentSecondary: "#56929F",
        cream: "#F3EEE3",
        muted: "#9C9284",
        mutedDim: "#6B6355",
        line: "#332B22",
        alert: "#B85C4A",
        alertSoft: "#2E1A15",
      },
    },
  },
  plugins: [],
};
