# Taskmaster AI for NovaFi

This directory contains taskmaster-ai configuration for the NovaFi project.

## Structure

- `taskmaster.json`: Main configuration file
- `/tasks`: Directory containing task definitions
- `/templates`: Directory containing task templates (if any)

## Usage

When using MCP integration, you can use commands like:

```
/task create "New task name" --priority high --tags frontend
/task list --tag backend
/task update example-task --status in-progress
/task assign example-task --to @username
```

## MCP Integration

This project uses MCP integration for taskmaster-ai, which means no separate installation is required. All taskmaster commands are available through your MCP-enabled environment. 