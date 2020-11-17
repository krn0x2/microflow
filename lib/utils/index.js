"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOnPath = exports.transform = void 0;
const jsonpath_plus_1 = require("jsonpath-plus");
const _ = require("lodash");
const handlebars = require("handlebars");
const transform = (obj = null, root) => _.isNull(obj)
    ? root
    : _.mapValues(obj, (val) => {
        if (_.isString(val)) {
            if (_.startsWith(val, "$"))
                return _.head(jsonpath_plus_1.JSONPath({
                    path: val,
                    json: root,
                }));
            return handlebars.compile(val)(root);
        }
        if (_.isPlainObject(val))
            return transform(val, root);
        if (_.isArray(val))
            return _.map(val, (x) => transform(x, root));
        return val;
    });
exports.transform = transform;
const setOnPath = (root, path = "$", obj) => {
    if (path === "$")
        return obj;
    const lodashPath = _.trimStart(path, "$.");
    return _.set(_.clone(root), lodashPath, obj);
};
exports.setOnPath = setOnPath;
