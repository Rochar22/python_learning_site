/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {}, // Изменили "@tailwindcss/postcss" на "tailwindcss"
    autoprefixer: {},
  },
};

export default config;