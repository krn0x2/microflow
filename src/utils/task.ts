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
  const { config, taskEventSuffix, task } = src;
  const { parameters } = config;
  const token = jwt.sign(
    { workflowInstanceId: ctx.wfid, taskEventSuffix },
    secret,
    signOptions
  );
  const parametersWithInput = transform(parameters, data);
  const parametersWithExecutionContext = transform(
    parametersWithInput,
    {
      executionId: ctx.wfid,
      task: { token }
    },
    '$$'
  );
  const parametersWithEnv = transform(
    parametersWithExecutionContext,
    process.env,
    '$$$'
  );
  const taskResolved = transform(task.config, parametersWithEnv);
  const res = await axios(taskResolved);
  return res.data;
};
