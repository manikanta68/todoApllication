const express = require("express");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const validatingDate = (dueDate) => {
  const result = isValid(new Date(dueDate));
  return result;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const statusProperty = ["TO DO", "IN PROGRESS", "DONE"];
const priorityProperty = ["HIGH", "MEDIUM", "LOW"];
const categoryProperty = ["WORK", "HOME", "LEARNING"];

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (statusProperty.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (priorityProperty.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (
        priorityProperty.includes(priority) === true &&
        statusProperty.includes(status) === true
      ) {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    status = '${status}'
    AND priority = '${priority}';`;
      }
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (statusProperty.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (categoryProperty.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (
        categoryProperty.includes(category) === true &&
        statusProperty.includes(status) === true
      ) {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    category = '${category}'
    AND status = '${status}';`;
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (categoryProperty.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (priorityProperty.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (
        categoryProperty.includes(category) === true &&
        priorityProperty.includes(priority) === true
      ) {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    category = '${category}'
    AND priority = '${priority}';`;
      }
      break;

    case hasPriorityProperty(request.query):
      if (priorityProperty.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      }
      break;

    case hasStatusProperty(request.query):
      if (statusProperty.includes(status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      }
      break;

    case hasCategoryProperty(request.query):
      if (categoryProperty.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND category = '${category}';`;
      }
      break;

    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  const ans = (each) => {
    return {
      id: each.id,
      todo: each.todo,
      priority: each.priority,
      status: each.status,
      category: each.category,
      dueDate: each.due_date,
    };
  };

  response.send(data.map((each) => ans(each)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todo = await db.get(selectTodoQuery);
  response.send({
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  });
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (validatingDate(date) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formatDate = format(new Date(2021 - 1 - 21), "yyyy-MM-dd");
    const selectTodo = `SELECT * FROM todo WHERE due_date=${formatDate};`;
    const getQuery = await db.get(selectTodo);
    response.send(getQuery);
  }
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (statusProperty.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorityProperty.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categoryProperty.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (validatingDate(dueDate) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const addTodo = `INSERT INTO todo (id,todo,category,priority,status,due_date) 
    VALUES (${id},'${todo}','${category}','${priority}','${status}','${dueDate}');`;
    await db.run(addTodo);
    response.send("Todo Successfully Added");
  }
});

// API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  if (status !== undefined) {
    if (statusProperty.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const selectTodo = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      await db.run(selectTodo);
      response.send("Status Updated");
    }
  } else if (priority !== undefined) {
    if (priorityProperty.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const selectTodo = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      await db.run(selectTodo);
      response.send("Priority Updated");
    }
  } else if (todo !== undefined) {
    const selectTodo = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
    await db.run(selectTodo);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (categoryProperty.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const selectTodo = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
      await db.run(selectTodo);
      response.send("Category Updated");
    }
  } else if (dueDate !== undefined) {
    if (validatingDate(dueDate) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const selectTodo = `UPDATE todo SET due_date='${format(
        new Date(dueDate),
        "yyyy-MM-dd"
      )}' WHERE id=${todoId};`;
      await db.run(selectTodo);
      response.send("Due Date Updated");
    }
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectTodo = `DELETE FROM todo WHERE id=${todoId}`;
  await db.run(selectTodo);
  response.send("Todo Deleted");
});

module.exports = app;
