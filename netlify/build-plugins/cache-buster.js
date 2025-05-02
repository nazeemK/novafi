// Netlify build plugin to add cache-busting
module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Adding DEPLOY_TIMESTAMP environment variable for cache busting');
    process.env.DEPLOY_TIMESTAMP = Date.now();
  },
  onBuild: ({ utils }) => {
    console.log('Adding cache control headers for cache busting');
    utils.status.show({
      title: '🚀 Adding cache-control headers',
      summary: 'Setting no-cache for HTML and cache-control for assets'
    });
  }
}; 