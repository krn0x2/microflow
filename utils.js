const { JSONPath } = require("jsonpath-plus");
const _ = require("lodash");
const handlebars = require("handlebars");

const transform = (obj, root) =>
  _.mapValues(obj, (val) => {
    if (_.isString(val)) {
      if (_.startsWith(val, "$."))
        return _.head(
          JSONPath({
            path: val,
            json: root,
          })
        );
      return handlebars.compile(val)(root);
    }

    if (_.isPlainObject(val)) return transform(val, root);

    if (_.isArray(val)) return _.map(val, (x) => transform(x, root));

    return val;
  });

module.exports = { transform };
