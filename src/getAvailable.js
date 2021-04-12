const utils = require("./utils");
const queryString = require("query-string");
const {splitPrefixIntoParts, joinPartsIntoPrefix, unauthorized} = require("./getDatasetHelpers");
const {ResourceNotFoundError} = require("./exceptions");

/* handler for /charon/getAvailable requests */
const getAvailable = async (req, res) => {
  const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
  utils.verbose(`getAvailable prefix: "${prefix}"`);

  const {source} = splitPrefixIntoParts(prefix);

  // Authorization
  if (!source.visibleToUser(req.user)) {
    return unauthorized(req, res);
  }

  let datasetPaths;
  let narrativePaths;

  try {
    datasetPaths = await source.availableDatasets() || [];
    narrativePaths = await source.availableNarratives() || [];
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return res.status(404).send("The requested URL does not exist.");
    }
  }

  if (!datasetPaths || !datasetPaths.length) {
    utils.verbose(`No datasets available for ${source.name}`);
  }
  if (!narrativePaths || !narrativePaths.length) {
    utils.verbose(`No narratives available for ${source.name}`);
  }

  const datasets = [];
  const narratives = [];
  for (let i=0; i<datasetPaths.length; i++) {
    const request = await joinPartsIntoPrefix({source, prefixParts: [datasetPaths[i]]}); // eslint-disable-line no-await-in-loop
    const secondTreeOptions = source.secondTreeOptions(datasetPaths[i]);
    const buildUrl = source.name === "community" ? `https://github.com/${source.repo}` : null;
    datasets.push({request, secondTreeOptions, buildUrl});
  }
  for (let i=0; i<narrativePaths.length; i++) {
    const request = await joinPartsIntoPrefix({source, prefixParts: [narrativePaths[i]], isNarrative: true}); // eslint-disable-line no-await-in-loop
    narratives.push({request});
  }
  return res.json({datasets, narratives});
};

module.exports = {
  default: getAvailable
};
