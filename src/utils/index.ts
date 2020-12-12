import { JSONPath } from 'jsonpath-plus';
import * as _ from 'lodash';
import * as handlebars from 'handlebars';

const transform = (obj = null, root, identifier = '$') =>
  _.isNull(obj)
    ? root
    : _.mapValues(obj, (val) => {
        if (_.isString(val)) {
          if (_.startsWith(val, `${identifier}.`) || val === identifier)
            return _.head(
              JSONPath({
                path:
                  val === identifier
                    ? '$'
                    : _.replace(val, `${identifier}.`, '$.'),
                json: root
              })
            );
          return handlebars.compile(val)(root);
        }

        if (_.isPlainObject(val)) return transform(val, root, identifier);

        if (_.isArray(val))
          return _.map(val, (x) => transform(x, root, identifier));

        return val;
      });

const setOnPath = (root, path = '$', obj) => {
  if (path === '$') return obj;
  const lodashPath = _.trimStart(path, '$.');
  return _.set(_.clone(root), lodashPath, obj);
};

export { transform, setOnPath };
