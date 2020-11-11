const gql = require("graphql-tag");

const UpdateTask = gql`
  mutation UpsertTask($object: task_insert_input!) {
    task: insert_task_one(
      object: $object
      on_conflict: { constraint: task_pkey, update_columns: [config, type] }
    ) {
      config
      id
      type
    }
  }
`;

const GetTask = gql`
  query GetTask($id: String!) {
    task: task_by_pk(id: $id) {
      config
      id
      type
    }
  }
`;

const UpdateWorkflow = gql`
  mutation UpdateWorkflow($object: workflow_insert_input!) {
    workflow: insert_workflow_one(
      object: $object
      on_conflict: { constraint: workflow_pkey, update_columns: definition }
    ) {
      definition
      id
    }
  }
`;

const GetWorkflow = gql`
  query GetWorkflow($id: String!) {
    workflow: workflow_by_pk(id: $id) {
      definition
      id
    }
  }
`;

const UpdateWorkflowInstance = gql`
  mutation UpdateWorkflowInstance($object: workflow_instance_insert_input!) {
    workflow_instance: insert_workflow_instance_one(
      object: $object
      on_conflict: {
        constraint: workflow_instance_pkey
        update_columns: current_json
      }
    ) {
      current_json
      definition
      id
    }
  }
`;

const GetWorkflowInstance = gql`
  query GetWorkflowInstance($id: uuid!) {
    workflow_instance: workflow_instance_by_pk(id: $id) {
      current_json
      definition
      id
    }
  }
`;

module.exports = {
  UpdateTask,
  GetTask,
  UpdateWorkflow,
  GetWorkflow,
  UpdateWorkflowInstance,
  GetWorkflowInstance,
};
