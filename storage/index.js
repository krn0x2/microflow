const { v4: uuidV4 } = require("uuid");
const _ = require("lodash");

const memory = {
  workflows: {},
  instances: {},
};

class DefaultStorage {
  constructor() {}

  async getWorkflow(id) {
    const { workflows } = memory;
    if (!workflows[id]) throw new Error(`Workflow with id = ${id} not found`);
    return workflows[id];
  }

  async putWorkflow(data) {
    const { workflows } = memory;
    const { id } = data;
    if (id in workflows) {
      const existngWflow = workflows[id];
      workflows[id] = { ...existngWflow, defintion };
      return workflows[id];
    }
    const genUUID = uuidV4();
    workflows[genUUID] = { id: genUUID, ...data };
    return workflows[genUUID];
  }

  async getWorkflowInstance(id) {
    const { instances } = memory;
    if (!instances[id])
      throw new Error(`Workflow Instance with id = ${id} not found`);
    return instances[id];
  }

  async putWorkflowInstance(data) {
    const { instances } = memory;
    const { id } = data;
    if (id in instances) {
      const existingInstance = instances[id];
      instances[id] = { ...existingInstance, ..._.omit(data, "id") };
      return instances[id];
    }
    const genUUID = uuidV4();
    instances[genUUID] = { id: genUUID, ...data };
    return instances[genUUID];
  }

  async putEvent(data) {
    const { instances } = memory;
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
