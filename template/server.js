import express from 'express';
import compression from 'compression';
import ReactDOMServer from 'react-dom/server';
import manifest from 'react-scripts/lib/manifest';
import assetMiddleware from 'react-scripts/lib/assetMiddleware';
import errorHandlerMiddleware from 'react-scripts/lib/errorHandlerMiddleware';
import defaultHeadersMiddleware from 'react-scripts/lib/defaultHeadersMiddleware';
import graphqlProxyMiddleware from 'react-scripts/lib/graphqlProxyMiddleware';
import { getFarceResult } from 'found/lib/server';
import serialize from 'serialize-javascript';
import envConfig from 'env-config';
import 'babel-polyfill';
import { ServerFetcher } from './src/fetcher';
import {
  createResolver,
  historyMiddlewares,
  render,
  routeConfig,
} from './src/routes';

const {
  APP_PORT = 3232,
  GRAPHQL_ORIGIN = 'http://localhost:3002',
  GRAPHQL_PATH = '/graphql',
  PERSIST_QUERIES = false,
} = process.env;

envConfig.register({
  PERSIST_QUERIES,
});

const GRAPHQL_URL = `${GRAPHQL_ORIGIN}${GRAPHQL_PATH}`;

const app = express();
app.use(compression());
app.use('/assets', assetMiddleware);
app.use(express.static('public'));
app.use(defaultHeadersMiddleware);
app.use('/graphql', graphqlProxyMiddleware(GRAPHQL_URL));

const stylesheetTag = (href) => {
  if (!href) {
    return '';
  }

  return `<link href="${href}" type="text/css" rel="stylesheet">`
};

app.get('*', async (req, res) => {
  const fetcher = new ServerFetcher(GRAPHQL_URL);

  const { redirect, status, element } = await getFarceResult({
    url: req.url,
    historyMiddlewares,
    routeConfig,
    resolver: createResolver(fetcher),
    render,
  });

  if (redirect) {
    res.redirect(302, redirect.url);
    return;
  }

  res.status(status).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Hello world</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    ${stylesheetTag(manifest['main.css'])}
  </head>
  <body>
    <div id="root">${ReactDOMServer.renderToString(element)}</div>
    <script>
      window.__RELAY_PAYLOADS__ = ${serialize(fetcher, { isJSON: true })}
    </script>
    ${envConfig.renderScriptTag()}
    <script type="text/javascript" src="${manifest['main.js']}"></script>
  </body>
</html>`);
});

app.use(errorHandlerMiddleware);

app.listen(APP_PORT, (err) => {
  if (err) {
    return console.error(err.message || err);
  }
  return console.log(`Server started on port ${APP_PORT}`);
});
