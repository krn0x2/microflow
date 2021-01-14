import { JSONPath } from 'jsonpath-plus';
import * as _ from 'lodash';
import * as handlebars from 'handlebars';
import { ITransform } from '../types';

const transform = <T extends ITransform = Record<string, any>>(
  obj: T,
  root: Record<string, any>,
  identifier = '$'
): T => {
  if (_.isString(obj)) {
    if (_.startsWith(obj, `${identifier}.`) || obj === identifier)
      return _.head(
        JSONPath({
          path:
            obj === identifier ? '$' : _.replace(obj, `${identifier}.`, '$.'),
          json: root
        })
      );
    return handlebars.compile(obj)(root) as T;
  } else if (_.isArray(obj)) {
    return _.map(obj, (x) => transform(x, root, identifier)) as T;
  } else if (_.isObject(obj)) {
    return _.mapValues(obj, (x) => transform(x, root, identifier)) as T;
  } else if (_.isUndefined(obj)) {
    return root as T;
  } else {
    return obj;
  }
};

const setOnPath = (
  root: Record<string, any>,
  path: string,
  obj: Record<string, any>
): Record<string, any> => {
  if (path === '$') return obj;
  if (path === undefined) return root;
  const lodashPath = _.trimStart(path, '$.');
  return _.set(_.clone(root), lodashPath, obj);
};

export { transform, setOnPath };
