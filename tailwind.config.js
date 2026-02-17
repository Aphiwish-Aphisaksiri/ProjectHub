module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // app router
    "./pages/**/*.{js,ts,jsx,tsx}",     // optional (if you have pages/)
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#061E29',
          100: '#1D546D',
          500: '#5F9598',
          700: '#F3F4F4',
        },
        primary: '#061E29',
        secondary: '#1D546D'
      }
    },
  },
  plugins: [],
};
