const _ = require("lodash");
const { default: ApolloClient } = require("apollo-boost");
require("cross-fetch/polyfill");

const {
  UpdateTask,
  GetTask,
  UpdateWorkflow,
  GetWorkflow,
  UpdateWorkflowInstance,
  GetWorkflowInstance,
} = require("./schema");

class MyStorage {
  constructor() {
    this.client = new ApolloClient({
      uri: "http://localhost:8080/v1/graphql",
      headers: {
        "content-type": "application/json",
        "x-hasura-admin-secret": "myadminsecretkey",
      },
    });
  }

  async getTask(id) {
    return this.client
      .query({
        query: GetTask,
        variables: { id },
      })
      .then((res) => res.data.task);
  }

  async putTask(data) {
    return this.client
      .mutate({
        mutation: UpdateTask,
        variables: {
          object: data,
        },
      })
      .then((res) => res.data.task);
  }

  async getWorkflow(id) {
    return this.client
      .query({
        query: GetWorkflow,
        variables: { id },
      })
      .then((res) => res.data.workflow);
  }

  async putWorkflow(data) {
    return this.client
      .mutate({
        mutation: UpdateWorkflow,
        variables: {
          object: data,
        },
      })
      .then((res) => res.data.workflow);
  }

  async getWorkflowInstance(id) {
    return this.client
      .query({
        query: GetWorkflowInstance,
        variables: { id },
      })
      .then((res) => res.data.workflow_instance);
  }

  async putWorkflowInstance(data) {
    return this.client
      .mutate({
        mutation: UpdateWorkflowInstance,
        variables: {
          object: data,
        },
      })
      .then((res) => res.data.workflow_instance);
  }
}

module.exports = MyStorage;
