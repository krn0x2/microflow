const express = require("express");
const bodyParser = require("body-parser");
const Stepflow = require("./index");

const app = express();
const port = 3000;
const PATH = "workflow";

const stepService = new Stepflow();

app.use(bodyParser.json());

app.get(`/${PATH}/:id`, (req, res) => {
  const { id } = req.params;
  res.status(200).json({ message: `Details queried for workflow id# ${id}` });
});

app.get(`/${PATH}`, (req, res) => {
  res.status(200).json({ message: `Started` });
});

app.post(`/${PATH}`, (req, res) => {
  const { body } = req;
  const { type } = body;
  const id = stepService.startWorkflow();
  res.status(200).json({ message: `Creating workflow`, id });
});

app.post(`/${PATH}/:id/event`, async (req, res) => {
  const { body: event, params } = req;
  const { id } = params;
  const response = await stepService.sendEvent(id,event);
  return res.status(200).json(response);
});

app.listen(port, () => {
  console.log(`endpoints listening at http://localhost:${port}`);
});



// httpService(
//   {},
//   {
//     type: "test",
//     data: {
//       botId: "anna",
//       user: "karan",
//       origin: null,
//     },
//   },
//   {
//     src: {
//       parameters: {
//         dagId: "dag1",
//         data: "$.data.botId",
//       },
//       taskId: "airflow",
//     },
//   }
// );
