// TODO: put JSON request functions into seperate function - need to find a way to pass if they're todays tasks or all tasks

// display all current tasks in table
const displayAllTasks = () => {
  completeTasks()

  $.getJSON("/api/alltasks")
  .then((tasks) => {
    if (tasks.length > 0) {
      $.each(tasks, (i, task) => {
        let taskHTML = ''
        if (task.complete) {
          taskHTML = `
          <tr class="old-task completed" id="task-${task.id}">
            <td><strong>${task.task}</strong><br/ >${task.due_date}</td>
            <td><a class="edit" href="/editask?taskid=${task.id}"><i class="fas fa-pencil-alt"></i></a></td>
          </tr>
          `
        } else {
          taskHTML = `
          <tr class="old-task" id="task-${task.id}">
            <td><strong>${task.task}</strong><br/ >${task.due_date}</td>
            <td><a class="edit" href="/editask?taskid=${task.id}"><i class="fas fa-pencil-alt"></i></a></td>
          </tr>
          `
        }
        $('.tasks').append(taskHTML)
      })
    } 
    // TODO: Move this to it's own "if there are no rows" function
    // else {
    //   $('table').after(`
    //   <h2 class="tasks-complete">You've completed all your tasks, you're amazing!</h2>
    //   `)
    // }
  })
  .catch((err) => {
    $('.tasks').append(`
    <tr>
      <td colspan="3">We could not retreive your tasks.</td>
      <td coldpan="3">${err.message}</td>
    </tr>
    `)
  })

  // add recurring tasks
  $.getJSON("/api/allrecurringtasks")
  .then((tasks) => {
    if (tasks.length > 0) {
      $.each(tasks, (i, task) => {

        let frequency = ''
        if (task.frequency === 1) frequency = 'Daily'
        if (task.frequency === 2) frequency = 'Every 2 days'
        if (task.frequency === 7) frequency = 'Weekly'

        let taskHTML = `
        <tr class="old-task recurring" id="task-${task.id}">
          <td><strong>${task.task}</strong><br/ >${frequency}</td>
          <td><a class="edit" href="/editask?taskid=${task.id}"><i class="fas fa-pencil-alt"></i></a></td>
        </tr>
        `
        $('.tasks').append(taskHTML)
      })
    } 
  })
  .catch((err) => {
    $('.tasks').append(`
    <tr>
      <td colspan="3">We could not retreive your recurring tasks.</td>
      <td coldpan="3">${err.message}</td>
    </tr>
    `)
  })

  if ($('.tasks').html() !== '') {
    $('table').after('<button class="remove-completed center">Remove completed tasks</button>')
  } else {
    $('table').after(`<h2 class="tasks-complete">You've completed all your tasks, you're amazing!</h2>`)
  }
}

const displayTodaysTasks = () => {
  completeTasks()

  $.getJSON("/api/todaystasks")
  .then((tasks) => {
    if (tasks.length > 0) {
      $.each(tasks, (i, task) => {
        let taskHTML = ''
        if (task.complete) {
          taskHTML = `
          <tr class="old-task completed" id="task-${task.id}">
            <td>${task.task}</td>
            <td><a class="edit" href="/editask?taskid=${task.id}"><i class="fas fa-pencil-alt"></i></a></td>
          </tr>
          `
        } else {
          taskHTML = `
          <tr class="old-task" id="task-${task.id}">
            <td>${task.task}</td>
            <td><a class="edit" href="/editask?taskid=${task.id}"><i class="fas fa-pencil-alt"></i></a></td>
          </tr>
          `
        }
        $('.tasks').append(taskHTML)
      })
      $('table').after('<button class="remove-completed center">Remove completed tasks</button>')
    } else {
      $('table').after(`
      <h2 class="tasks-complete">You've completed all your tasks for today, incredible!</h2>
      `)
    }
  })
  .catch((err) => {
    $('.tasks').append(`
    <tr>
      <td colspan="3">We could not retreive your tasks.</td>
      <td coldpan="3">${err.message}</td>
    </tr>
    `)
  })
}


// submit new task to db for today
$('.add-task-today').click(function (e) {
  e.preventDefault()
  $('.tasks-complete').remove()
  let newTask = $('#task').val()

  if (newTask !== '') {
    $.ajax({
      url: '/newtasktoday',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        task: newTask
      })
    })
    .done(() => {
      // add new task and include the task id
      $.getJSON("/api/todaystasks")
      .then((tasks) => {
        console.log(tasks[tasks.length - 1].id)
        $('.new-task-alert').after(`
        <tr class="old-task" id="task-${tasks[tasks.length - 1].id}">
        <td>${newTask}</td>
        <td><a class="edit" href="/editask?taskid=${tasks[tasks.length - 1].id}"><i class="fas fa-pencil-alt"></i></a></td>
        </tr>
        `)
        let removeButton = $('.remove-completed')
        if (removeButton.length === 0) {
          $('table').after('<button class="remove-completed center">Remove completed tasks</button>')
        }
        $('#task').val("")
      })
      .catch((err) => {
        console.log(err)
        // TODO: error catching
      })
    })
    .fail(() => {
      $('.new-task-alert').text('There was a problem submitting your task.').removeClass('hidden')
    })
  }
})

const completeTasks = () => {
  // strikethrough on click
  $('table').on('click', '.old-task > td:first-child', function() {
    $(this).parent().toggleClass('completed')

    // if task has "completed" class, set complete = true in db
    if($(this).parent().attr('class').slice(9) === 'completed') {
      const taskId = $(this).parent().attr('id').slice(5)
      const taskComplete = true
      $.ajax({
        url: '/api/completetask',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          id: taskId,
          complete: taskComplete
        })
      })
      .fail((err) => {
        console.log(err)
        // TODO: error catching
      })
      // if it doesn't have "completed" class, set complete = false in db
    } else {
      const taskId = $(this).parent().attr('id').slice(5)
      const taskComplete = false
      $.ajax({
        url: '/api/completetask',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
          id: taskId,
          complete: taskComplete
        })
      })
      .fail((err) => {
        console.log(err)
        // TODO: error catching
      })
    } 
  })
}


// delete completed tasks from db
$('body').on('click', '.remove-completed', function() {
  $.ajax({
    url: '/api/deletetasks',
    type: 'DELETE',
    contentType: 'application/json'
  })
  .done(() => {
    $('tr.completed').remove()
  })
  .fail((err) => {
    console.log(err)
    // TODO: error catching
  })
})