const pkg = require("sofa-api");
const express = require("express");
const app = express();

const { introspectSchema, wrapSchema } = require("@graphql-tools/wrap");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const fetch = require("node-fetch");
const { createHttpLink } = require("apollo-link-http");
const { print } = require("graphql");

const executor = async ({ document, variables }) => {
  const query = print(document);
  const fetchResult = await fetch(
    "https://api.thegraph.com/subgraphs/name/hashtag-protocol/hashtag-rinkeby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  return fetchResult.json();
};
async function generateSchema() {
  const schema = wrapSchema({
    schema: await introspectSchema(executor),
    executor,
  });
  return schema;
}

generateSchema().then((schema) => {
  const openApi = pkg.OpenAPI({
    schema,
    info: {
      title: "Hashtag Protocol Rest API",
      version: "1.0.0",
    },
  });
  app.use(
    "/api",
    pkg.useSofa({
      basePath: "/api",
      schema,
      onRoute(info) {
        openApi.addRoute(info, {
          basePath: "/api",
        });
      },
    })
  );
  openApi.save("./swagger.yml");
  const port = 4000;
  app.listen({ port: 4000 }, () => {
    console.log(`🚀  Server ready http://localhost:${port}`);
  });
});
