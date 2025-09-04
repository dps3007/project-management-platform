// Roles for users inside a project
export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

// List of allowed roles
export const AvailableRolesEnum = Object.values(UserRolesEnum);

// Task statuses
export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

// List of allowed task statuses
export const AvailableTaskStatusesEnum = Object.values(TaskStatusEnum);
