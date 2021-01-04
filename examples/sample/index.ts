import express from 'express';
import bodyParser from 'body-parser';
import { Microflow } from '../../src/microflow';

const app = express();
const port = 5000;
const PATH = 'microflow';

const microflowService = new Microflow({
  jwt: {
    secretOrPublicKey: 'shhhhh',
    sign: {
      expiresIn: '24h'
    }
  }
});

app.use(bodyParser.json());

// Register task
app.post(`/${PATH}/task`, async (req, res) => {
  const { body } = req;
  const task = await microflowService.task.create(body);
  const response = await task.data();
  return res.status(200).json(response);
});

// Query task
app.get(`/${PATH}/task/:id`, async (req, res) => {
  const { params } = req;
  const { id } = params;
  const task = await microflowService.task.read(id);
  const response = await task.data();
  return res.status(200).json(response);
});

// Register workflow
app.post(`/${PATH}/workflow`, async (req, res) => {
  const { body } = req;
  const workflow = await microflowService.workflow.create(body);
  const response = await workflow.data();
  return res.status(200).json(response);
});

// Query workflow
app.get(`/${PATH}/workflow/:id`, async (req, res) => {
  const { params } = req;
  const { id } = params;
  const workflow = await microflowService.workflow.read(id);
  const response = await workflow.data();
  return res.status(200).json(response);
});

// Update workflow
app.put(`/${PATH}/workflow`, async (req, res) => {
  const { body } = req;
  const { id } = body;
  const workflow = await microflowService.workflow.update(id, body);
  const response = await workflow.data();
  return res.status(200).json(response);
});

// Start workflow instance
app.post(`/${PATH}/workflow/:id/start`, async (req, res) => {
  const { params, body } = req;
  const { id } = params;
  const workflow = await microflowService.workflow.read(id);
  const execution = await workflow.start(body);
  const response = await execution.describe();
  return res.status(200).json(response);
});

// Send event to workflow instance
app.post(`/${PATH}/workflow/instance/:id/event`, async (req, res) => {
  const { params, body } = req;
  const { id } = params;
  const execution = await microflowService.execution.read(id);
  await execution.send(body);
  const response = await execution.describe();
  return res.status(200).json(response);
});

// Send event to workflow instance
app.get(`/${PATH}/task-success`, async (req, res) => {
  const { body, query } = req;
  const { token } = query;
  console.log(token);
  const execution = await microflowService.sendTaskSuccess(
    token as string,
    body
  );
  const response = await execution.describe();
  return res.status(200).json(response);
});

app.get(`/${PATH}/task-failure`, async (req, res) => {
  const { body, query } = req;
  const { token } = query;
  console.log(token);
  const execution = await microflowService.sendTaskFailure(
    token as string,
    body
  );
  const response = await execution.describe();
  return res.status(200).json(response);
});

// Query workflow instance
app.get(`/${PATH}/workflow/instance/:id`, async (req, res) => {
  const { id } = req.params;
  const execution = await microflowService.execution.read(id);
  const response = await execution.describe();
  res.status(200).json(response);
});

// Healthcheck
app.get(`/${PATH}`, (req, res) => {
  res.status(200).json({ message: 'Started' });
});

app.listen(port, () => {
  console.log(`endpoints listening at http://localhost:${port}`);
});
