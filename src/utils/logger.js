import config from './config.js'; // Adjusted import to `config`, no `default` keyword needed
const { ENV } = config;

const info = (...params) => {
  if (ENV !== 'test') {
    console.log(...params);
  }
};

const error = (...params) => {
  if (ENV !== 'test') {
    console.error(...params);
  }
};

export default {
  info,
  error,
};
