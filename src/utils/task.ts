import axios from 'axios';
import bluebird from 'bluebird';
import { JSONPath } from 'jsonpath-plus';
import jwt from 'jsonwebtoken';
import { InvokeCreator } from 'xstate';
import { transform } from './index';

export const taskCreator = (
  secret: jwt.Secret,
  signOptions: jwt.SignOptions
): InvokeCreator<any> => async (
  ctx: Record<string, any>,
  { data },
  { src }
) => {
  const { taskEventSuffix, task, parameters, itemsPath, isMap } = src;
  const token = jwt.sign(
    { workflowInstanceId: ctx.wfid, taskEventSuffix },
    secret,
    signOptions
  );
  const dataInputs = isMap
    ? JSONPath({
        path: itemsPath,
        json: data
      })[0] || []
    : [data];
  const response = await bluebird.map(dataInputs, async (value, index) => {
    const enrichedParameters = transform(parameters, {
      _: data,
      _task: {
        executionId: ctx.wfid,
        name: ctx.name,
        token,
        item: { value, index }
      },
      _env: process.env
    });
    const taskResolved = transform(task.config, enrichedParameters);
    const res = await axios.request(taskResolved);
    return res.data;
  });
  return isMap ? response : response[0];
};

export const transformerInvoke: InvokeCreator<any> = async (
  _ctx: Record<string, any>,
  { data }
) => {
  return data;
};
