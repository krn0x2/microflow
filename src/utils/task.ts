import axios from 'axios';
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
  // console.log(ctx, data, src);
  const { config, taskEventSuffix, task } = src;
  const { parameters } = config;
  const resolvedParameters = transform(parameters, data);
  // console.log(resolvedParameters);
  // console.log(task);
  const token = jwt.sign(
    { workflowInstanceId: ctx.wfid, taskEventSuffix },
    secret,
    signOptions
  );
  // console.log(token);
  const taskResolved = transform(task.config, resolvedParameters);
  // console.log(taskResolved);
  const tokenized = transform(
    taskResolved,
    {
      task: { token }
    },
    '$$'
  );
  // console.log(tokenized);
  const res = await axios(tokenized);
  return res.data;
};
