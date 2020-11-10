const express = require("express");
const bodyParser = require("body-parser");
const Microflow = require("./index");

const app = express();
const port = 4000;
const PATH = "stepflow";

const microflowService = new Microflow();

app.use(bodyParser.json());

// Register workflow
app.post(`/${PATH}/workflow`, async (req, res) => {
  const { body } = req;
  const response = await microflowService.putWorkflow(body);
  return res.status(200).json(response);
});

// Query workflow
app.get(`/${PATH}/workflow/:id`, async (req, res) => {
  const { params } = req;
  const { id } = params;
  const response = await microflowService.getWorkflow(id);
  return res.status(200).json(response);
});

// Start workflow instance
app.post(`/${PATH}/workflow/:id/start`, async (req, res) => {
  const { params } = req;
  const { id } = params;
  const response = await microflowService.startWorkflow(id);
  return res.status(200).json(response);
});

// Send event to workflow instance
app.post(`/${PATH}/workflow/instance/:id/event`, async (req, res) => {
  const { params, body } = req;
  const { id } = params;
  const response = await microflowService.sendEvent(id, body);
  return res.status(200).json(response);
});

// Query workflow instance
app.get(`/${PATH}/workflow/instance/:id`, async (req, res) => {
  const { id } = req.params;
  const response = await microflowService.getWorkflowInstance(id);
  res.status(200).json(response);
});

// Healthcheck
app.get(`/${PATH}`, (req, res) => {
  res.status(200).json({ message: `Started` });
});

app.listen(port, () => {
  console.log(`endpoints listening at http://localhost:${port}`);
});