import Task from '../../models/Task.js';
import { notFound, validationError } from '../../utils/AppError.js';
import { FIELD_ERRORS } from '../../utils/validation.js';
import { isObjectId } from '../../utils/ids.js';
import { loadCurrentMembers, loadPeople, memberIdSet, presentPerson } from '../../utils/people.js';

const TASK_LIST_LIMIT = 500;

async function presentTasks(householdId, tasks) {
  const people = await loadPeople(tasks.map((task) => task.assigneeId));
  return tasks.map((task) => ({
    id: String(task._id),
    title: task.title,
    assignee: presentPerson(task.assigneeId, householdId, people),
    dueDate: task.dueDate,
    status: task.status,
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
  }));
}

export async function listTasks(householdId) {
  const tasks = await Task.find({ householdId }).sort({ dueDate: 1, createdAt: 1 }).limit(TASK_LIST_LIMIT).lean();
  return { tasks: await presentTasks(householdId, tasks) };
}

export async function createTask(householdId, userId, input) {
  const members = await loadCurrentMembers(householdId);
  if (!memberIdSet(members).has(input.assigneeId)) {
    throw validationError([{ field: 'assigneeId', code: FIELD_ERRORS.NOT_MEMBER }]);
  }
  const task = await Task.create({
    householdId,
    title: input.title,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    status: 'TODO',
    createdBy: userId,
  });
  const [presented] = await presentTasks(householdId, [task]);
  return presented;
}

export async function completeTask(householdId, taskId) {
  if (!isObjectId(taskId)) throw notFound('TASK_NOT_FOUND', 'Task not found');
  const task = await Task.findOne({ _id: taskId, householdId });
  if (!task) throw notFound('TASK_NOT_FOUND', 'Task not found');
  if (task.status !== 'DONE') {
    task.status = 'DONE';
    task.completedAt = new Date();
    await task.save();
  }
  const [presented] = await presentTasks(householdId, [task]);
  return presented;
}
