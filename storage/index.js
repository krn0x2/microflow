const { v4: uuidV4 } = require("uuid");
const _ = require("lodash");

class DefaultStorage {
  constructor() {
    this.memory = {
      workflows: {},
      tasks: {},
      instances: {},
    };
  }

  async getWorkflow(id) {
    const { workflows } = this.memory;
    if (!workflows[id]) throw new Error(`Workflow with id = ${id} not found`);
    return workflows[id];
  }

  async putWorkflow(data) {
    const { workflows } = this.memory;
    const { id } = data;
    if (id in workflows) {
      workflows[id] = data;
      return workflows[id];
    }
    const genUUID = uuidV4();
    workflows[genUUID] = { id: genUUID, ...data };
    return workflows[genUUID];
  }

  async getTask(id) {
    const { tasks } = this.memory;
    if (!tasks[id]) throw new Error(`Task with id = ${id} not found`);
    return tasks[id];
  }

  async putTask(data) {
    const { tasks } = this.memory;
    const { id } = data;
    if (id in tasks) {
      tasks[id] = data;
      return tasks[id];
    }
    tasks[id] = data;
    return tasks[id];
  }

  async getWorkflowInstance(id) {
    const { instances } = this.memory;
    if (!instances[id])
      throw new Error(`Workflow Instance with id = ${id} not found`);
    return instances[id];
  }

  async putWorkflowInstance(data) {
    const { instances } = this.memory;
    const { id } = data;
    if (id in instances) {
      instances[id] = data;
      return instances[id];
    }
    const genUUID = uuidV4();
    instances[genUUID] = { id: genUUID, ...data };
    return instances[genUUID];
  }

  async putEvent(data) {
    const { instances } = this.memory;
    const { id } = data;
    if (!instances[id])
      throw new Error(`Workflow Instance with id = ${id} not found`);
    const existingInstance = instances[id];
    const { events } = existingInstance;
    instances[id] = {
      ...existingInstance,
      events: [...events, data],
    };
    return instances[id];
  }
}

module.exports = DefaultStorage;
