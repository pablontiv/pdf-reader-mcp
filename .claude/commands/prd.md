# /prd [instruction] Command to create PRD documents

Evaluates the [instruction] and creates a document in the @docs/prd folder assigning the next available number according to the format PRD[nnn]-[function].md

## Conditions

- [instruction] can refer to a new action, or a phase of another document in @docs/prd/
- Ask all necessary questions to clarify the instruction before starting work
- If the [instruction] involves non-atomic tasks (see Expected Result) confirmation should be obtained from the user whether to create multiple PRDs

## Expected Result

- A clear and atomic objective (a service, a configuration, or any change that can be tested individually and provides value according to the [instruction])
- A list of sequential tasks that can be tested and reverted one by one
- Validation or acceptance criteria (if applicable, LAN client validation with a network namespace should be required)
- Implementation report, including but not limited to:
  - Service name
  - Access path
  - Configuration files
  - IPs and ports
  - Credentials
  - Dependencies
  - Rollback strategy
