import server from './src/server.js'; // Use `import` with .js extension
import logger from './src/utils/logger.js'; // Use `import` with .js extension
import config from './src/utils/config.js'; // Use `import` with .js extension
const { PORT } = config;

server.listen(PORT, (err) => {
  if (err) {
    logger.error(err?.message);
  } else {
    logger.info(`🚀 Listening on port ${PORT}`);
  }
});
